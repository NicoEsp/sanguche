import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track requests per IP
const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // Max 10 requests per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

// Timing-safe string comparison to prevent timing attacks
function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

serve(async (req) => {
  const clientIP = req.headers.get('cf-connecting-ip') || 
                   req.headers.get('x-forwarded-for') || 
                   'unknown';

  // Rate limiting check
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
    return new Response('Rate limit exceeded', { status: 429 });
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
    
    const signature = req.headers.get('webhook-signature');
    const polarSignature = req.headers.get('x-polar-signature');
    const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      console.error('❌ Missing webhook secret');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    const body = await req.text();
    console.log('📦 Webhook body length:', body.length);
    
    // Enhanced signature verification with timing-safe comparison
    const receivedSignature = signature || polarSignature;
    if (!receivedSignature) {
      console.error('❌ No signature header found');
      return new Response('Missing webhook signature', { status: 401 });
    }

    // Support multiple signature formats and algorithms
    let isValid = false;
    try {
      // Try SHA-256 with secret prefix (common format)
      const expectedSig1 = await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(webhookSecret + body)
      );
      const expectedHex1 = Array.from(new Uint8Array(expectedSig1))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Try HMAC-SHA256 (more secure format)
      const key = await crypto.subtle.importKey(
        'raw',
        new TextEncoder().encode(webhookSecret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const expectedSig2 = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body));
      const expectedHex2 = Array.from(new Uint8Array(expectedSig2))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Timing-safe comparison
      const cleanSignature = receivedSignature.replace(/^sha256=|^hmac-sha256=/, '');
      isValid = timingSafeEquals(cleanSignature, expectedHex1) || 
                timingSafeEquals(cleanSignature, expectedHex2);
      
      console.log('🔐 Signature verification:', { valid: isValid });
    } catch (error) {
      console.error('❌ Signature verification failed:', error);
      return new Response('Invalid signature', { status: 401 });
    }

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    let event;
    try {
      event = JSON.parse(body);
      console.log('✅ Event type:', event.type);
    } catch (parseError) {
      console.error('❌ Invalid JSON payload');
      return new Response('Invalid JSON payload', { status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    
    switch (event.type) {
      case 'subscription.active':
      case 'subscription.created': {
        const subscription = event.data;
        const metadata = subscription.metadata || {};
        
        if (metadata.profile_id) {
          
          const { data, error } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: metadata.profile_id,
              plan: 'premium',
              status: 'active',
              polar_subscription_id: subscription.id,
              polar_customer_id: subscription.customer_id,
              current_period_end: subscription.current_period_end ? new Date(subscription.current_period_end) : null,
            }, {
              onConflict: 'user_id'
            })
            .select();

          if (error) {
            console.error('❌ Subscription update failed:', error.message);
          } else {
            console.log('✅ Subscription activated');
          }
        } else {
          console.warn('⚠️ No profile_id in metadata');
        }
        break;
      }

      case 'subscription.canceled':
      case 'subscription.incomplete_expired': {
        const subscription = event.data;
        const metadata = subscription.metadata || {};
        
        if (metadata.profile_id) {
          
          const { data, error } = await supabase
            .from('user_subscriptions')
            .update({
              plan: 'free',
              status: 'active',
              polar_subscription_id: subscription.id,
            })
            .eq('user_id', metadata.profile_id)
            .select();

          if (error) {
            console.error('❌ Subscription cancellation failed:', error.message);
          } else {
            console.log('✅ Subscription canceled');
          }
        } else {
          console.warn('⚠️ No profile_id in cancellation metadata');
        }
        break;
      }

      case 'order.created': {
        // Order created but not yet paid - no action needed
        break;
      }

      case 'order.paid': {
        const order = event.data;
        const metadata = order.metadata || {};
        
        if (order.status !== 'paid') {
          console.warn('⚠️ Order not paid:', order.status);
          break;
        }
        
        if (metadata.profile_id) {
          
          // Calculate subscription period end (default to 1 month from now)
          const currentPeriodEnd = new Date();
          currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
          
          const { data, error } = await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: metadata.profile_id,
              plan: 'premium',
              status: 'active',
              polar_customer_id: order.customer_id,
              current_period_end: currentPeriodEnd,
            }, {
              onConflict: 'user_id'
            })
            .select();

          if (error) {
            console.error('❌ Premium activation failed:', error.message);
          } else {
            console.log('✅ Premium activated after payment');
          }
        } else {
          console.warn('⚠️ No profile_id in order metadata');
        }
        break;
      }

      default:
        console.warn('❓ Unhandled event type:', event.type);
    }

    return new Response('OK', { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('💥 Webhook error:', error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error'
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});