import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Rate limiting: Track requests per IP with cleanup
const requestCounts = new Map<string, { count: number; lastReset: number }>();
const RATE_LIMIT = 10; // Max 10 requests per minute per IP
const RATE_WINDOW = 60 * 1000; // 1 minute

// Cleanup old rate limit entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of requestCounts.entries()) {
    if (now - data.lastReset > RATE_WINDOW * 10) {
      requestCounts.delete(ip);
    }
  }
}, RATE_WINDOW * 10);

// Reusable TextEncoder instance
const textEncoder = new TextEncoder();

// Timing-safe string comparison to prevent timing attacks
function timingSafeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Function to normalize Polar signature formats
function normalizePolarSignature(signature: string): string {
  let normalized = signature.trim();
  
  // Remove common prefixes
  normalized = normalized.replace(/^(sha256=|hmac-sha256=)/, '');
  
  // Handle Polar v1 formats: "v1,<signature>" or "v1=<signature>"
  if (normalized.includes('v1=')) {
    const v1Match = normalized.match(/v1=([a-zA-Z0-9+/=]+)/);
    if (v1Match) normalized = v1Match[1];
  } else if (normalized.includes('v1,')) {
    const parts = normalized.split('v1,');
    if (parts.length > 1) normalized = parts[1];
  }
  
  // Handle "t=timestamp,v1=signature" format
  if (normalized.includes('t=') && normalized.includes(',v1=')) {
    const v1Match = normalized.match(/,v1=([a-zA-Z0-9+/=]+)/);
    if (v1Match) normalized = v1Match[1];
  }
  
  return normalized.trim();
}

// Convert ArrayBuffer to hex string
function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert ArrayBuffer to Base64 string
function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return btoa(String.fromCharCode(...bytes));
}

// Helper to create consistent responses with CORS
function createResponse(body: string, status: number = 200, contentType: string = 'application/json') {
  return new Response(body, {
    status,
    headers: { ...corsHeaders, 'Content-Type': contentType }
  });
}

// Optimized user lookup with single query
async function findUserByEmail(email: string, supabase: any): Promise<string | null> {
  try {
    console.log('🔍 Searching user by email:', email);
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError || !authUsers?.users) {
      console.error('❌ Error listing auth users:', authError);
      return null;
    }
    
    const authUser = authUsers.users.find((u: any) => u.email === email);
    if (!authUser) {
      console.warn('⚠️ Auth user not found for email:', email);
      return null;
    }
    
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', authUser.id)
      .maybeSingle();
      
    if (profileError) {
      console.error('❌ Error fetching profile:', profileError);
      return null;
    }
    
    if (!profile) {
      console.warn('⚠️ Profile not found for user_id:', authUser.id);
      return null;
    }
    
    console.log('✅ Found user profile:', { profile_id: profile.id, email });
    return profile.id;
  } catch (error) {
    console.error('❌ Error in findUserByEmail:', error);
    return null;
  }
}

// Extract profile ID from event data with fallback to email lookup
async function extractProfileId(eventData: any, supabase: any): Promise<string | null> {
  const metadata = eventData.metadata || {};
  let profileId = metadata.profile_id;
  
  if (!profileId) {
    const customerEmail = eventData.customer_email || eventData.customer?.email;
    if (customerEmail) {
      profileId = await findUserByEmail(customerEmail, supabase);
    }
  }
  
  return profileId;
}

// Unified subscription activation handler
async function handleSubscriptionActivation(profileId: string, eventData: any, source: string, supabase: any): Promise<boolean> {
  try {
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1);
    
    const subscriptionData: any = {
      user_id: profileId,
      plan: 'premium',
      status: 'active',
      current_period_end: currentPeriodEnd,
    };
    
    // Add Polar IDs if available
    if (eventData.customer_id) {
      subscriptionData.polar_customer_id = eventData.customer_id;
    }
    if (eventData.id && source.includes('subscription')) {
      subscriptionData.polar_subscription_id = eventData.id;
    }
    
    console.log('🔥 Activating premium subscription:', { profileId, source });
    
    const { error } = await supabase
      .from('user_subscriptions')
      .upsert(subscriptionData, { onConflict: 'user_id' });

    if (error) {
      console.error(`❌ Premium activation failed (${source}):`, error.message);
      return false;
    }
    
    console.log(`✅ Premium activated successfully via ${source}`);
    return true;
  } catch (error) {
    console.error(`❌ Error activating premium (${source}):`, error);
    return false;
  }
}

// Handle order events (paid/updated)
async function handleOrderEvent(order: any, eventType: string, supabase: any): Promise<void> {
  console.log(`📦 CRITICAL: ${eventType}`, {
    order_id: order.id,
    status: order.status,
    customer_email: order.customer_email || order.customer?.email,
    metadata_present: !!order.metadata?.profile_id
  });
  
  if (order.status !== 'paid') {
    if (eventType === 'order.paid') {
      console.warn('⚠️ Order.paid event but status is not paid:', order.status);
    }
    return;
  }
  
  const profileId = await extractProfileId(order, supabase);
  
  if (profileId) {
    const success = await handleSubscriptionActivation(profileId, order, eventType, supabase);
    if (!success) {
      console.error(`❌ Failed to activate premium for ${eventType}`);
    }
  } else {
    console.error(`❌ No profile_id found and no valid customer email for ${eventType}`);
  }
}

// Handle subscription events
async function handleSubscriptionEvent(subscription: any, eventType: string, supabase: any): Promise<void> {
  console.log(`🔥 CRITICAL: ${eventType}`, {
    subscription_id: subscription.id,
    status: subscription.status,
    customer_email: subscription.customer?.email,
    metadata_present: !!subscription.metadata?.profile_id
  });
  
  const profileId = await extractProfileId(subscription, supabase);
  
  if (!profileId) {
    console.error(`❌ No profile_id found and no valid customer email for ${eventType}`);
    return;
  }

  // Handle different subscription statuses
  if (subscription.status === 'active' && (eventType === 'subscription.created' || eventType === 'subscription.active' || eventType === 'subscription.updated')) {
    const success = await handleSubscriptionActivation(profileId, subscription, eventType, supabase);
    if (!success) {
      console.error(`❌ Failed to activate premium for ${eventType}`);
    }
  } else if (subscription.status === 'canceled' || subscription.status === 'incomplete_expired' || eventType.includes('canceled') || eventType.includes('incomplete_expired')) {
    // Handle cancellation
    const { error } = await supabase
      .from('user_subscriptions')
      .update({
        plan: 'free',
        status: 'active',
        polar_subscription_id: subscription.id,
      })
      .eq('user_id', profileId);

    if (error) {
      console.error('❌ Subscription cancellation failed:', error.message);
    } else {
      console.log('✅ Subscription canceled and downgraded to free');
    }
  } else if (eventType === 'subscription.updated' && subscription.status !== 'active') {
    console.log('⏳ Subscription status not final, ignoring:', subscription.status);
  } else if (eventType === 'subscription.created' && subscription.status !== 'active') {
    console.warn('⚠️ Subscription created but not active:', subscription.status);
  }
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
    
    // 1) Verify signature on raw body (before JSON parsing)
    const possibleSignatureHeaders = ['x-polar-signature', 'webhook-signature', 'polar-signature'];
    let signature: string | null = null;
    for (const h of possibleSignatureHeaders) {
      const v = req.headers.get(h);
      if (v) { signature = v; break; }
    }
    if (!signature) {
      console.error('❌ Missing Polar signature header');
      const headerNames = Array.from(req.headers.keys());
      console.log('🧾 Headers present (names only):', headerNames);
      return createResponse('Missing webhook signature', 401);
    }

    // Normalize Polar signature (handles v1, prefixes, Base64/hex formats)
    const normalizedSignature = normalizePolarSignature(signature);

    // Compute HMAC-SHA256 over the RAW body
    const key = await crypto.subtle.importKey(
      'raw',
      textEncoder.encode(webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    const expectedBuffer = await crypto.subtle.sign('HMAC', key, textEncoder.encode(body));
    const expectedHex = toHex(expectedBuffer);
    const expectedBase64 = toBase64(expectedBuffer);

    // Try both Base64 and hex comparison
    const isValidBase64 = timingSafeEquals(normalizedSignature, expectedBase64);
    const isValidHex = timingSafeEquals(normalizedSignature, expectedHex);
    const isValid = isValidBase64 || isValidHex;

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      console.log('🔐 Signature check:', {
        valid: false,
        received: normalizedSignature.substring(0, 8) + '...',
        receivedLength: normalizedSignature.length,
        expectedBase64: expectedBase64.substring(0, 8) + '...',
        expectedHex: expectedHex.substring(0, 8) + '...',
        matchedFormat: 'none'
      });
      return createResponse('Invalid signature', 401);
    }

    console.log('🔐 Signature verification:', { 
      valid: true, 
      format: isValidBase64 ? 'base64' : 'hex',
      signatureLength: normalizedSignature.length 
    });

    // 2) Parse JSON only after successful signature verification
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