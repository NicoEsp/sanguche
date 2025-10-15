import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { handleOrderEvent } from './handlers/order.ts';
import { handleSubscriptionEvent } from './handlers/subscription.ts';
import { SignatureVerificationError, verifyPolarSignature } from './utils/signature.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // Max 10 requests per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.lastReset > RATE_WINDOW * 10) {
      requestCounts.delete(ip);
    }
  }
}, RATE_WINDOW * 10);

function createResponse(body: string, status: number = 200, contentType: string = 'application/json') {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, 'Content-Type': contentType }
  });
}

serve(async (req) => {
  const clientIP = req.headers.get('cf-connecting-ip') ||
                   req.headers.get('x-forwarded-for') ||
                   'unknown';

  const now = Date.now();
  const ipData = requestCounts.get(clientIP) || { count: 0, lastReset: now };

  if (now - ipData.lastReset > RATE_WINDOW) {
    ipData.count = 0;
    ipData.lastReset = now;
  }

  ipData.count++;
  requestCounts.set(clientIP, ipData);

  if (ipData.count > RATE_LIMIT) {
    console.warn('🚫 Rate limit exceeded for IP:', clientIP);
    return createResponse('Rate limit exceeded', 429);
  }

  console.log('🎯 Polar webhook called:', {
    method: req.method,
    timestamp: new Date().toISOString(),
    ip: clientIP
  });

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET');

    if (!webhookSecret) {
      console.error('❌ Missing webhook secret');
      return createResponse('Webhook secret not configured', 500);
    }

    const body = await req.text();
    console.log('📦 Webhook body length:', body.length);

    try {
      const verification = await verifyPolarSignature({
        body,
        headers: req.headers,
        webhookSecret,
      });

      console.log('🔐 Signature verification:', {
        valid: true,
        format: verification.format,
        signatureLength: verification.signatureLength,
        header: verification.headerName,
        matchedPreview: verification.matchedVariant.substring(0, 8) + '...'
      });
    } catch (error) {
      if (error instanceof SignatureVerificationError) {
        console.error(`❌ ${error.message}`);
        const details = error.details;
        if (details) {
          if ('headerNames' in details) {
            console.log('🧾 Headers present (names only):', (details as { headerNames: unknown }).headerNames);
          } else {
            console.log('🔐 Signature check:', details);
          }
        }
        return createResponse(error.responseMessage, error.status);
      }
      throw error;
    }

    let event;
    try {
      event = JSON.parse(body);
    } catch {
      console.error('❌ Invalid JSON payload');
      return createResponse('Invalid JSON payload', 400);
    }
    console.log('✅ Event type:', event.type);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (event.type) {
      case 'checkout.created':
        console.log('🛒 INFO: Checkout created', { checkout_id: event.data.id });
        break;

      case 'checkout.updated':
        console.log('🛒 INFO: Checkout updated', {
          checkout_id: event.data.id,
          status: event.data.status
        });
        break;

      case 'order.created':
        console.log('📦 INFO: Order created', {
          order_id: event.data.id,
          status: event.data.status
        });
        break;

      case 'order.updated':
      case 'order.paid':
        await handleOrderEvent(event.data, event.type, supabase);
        break;

      case 'subscription.created':
      case 'subscription.active':
      case 'subscription.updated':
      case 'subscription.canceled':
      case 'subscription.incomplete_expired':
        await handleSubscriptionEvent(event.data, event.type, supabase);
        break;

      default:
        console.warn('❓ Unhandled event type:', event.type);
    }

    return createResponse('OK');

  } catch (error) {
    console.error('💥 Webhook error:', error instanceof Error ? error.message : 'Unknown error');
    return createResponse(JSON.stringify({ error: 'Internal server error' }), 500);
  }
});
