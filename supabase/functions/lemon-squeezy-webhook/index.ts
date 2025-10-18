import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      customer_id: number;
      order_id: number;
      renews_at?: string;
      ends_at?: string;
      trial_ends_at?: string;
      created_at: string;
      updated_at: string;
    };
  };
}

async function verifySignature(request: Request, secret: string): Promise<boolean> {
  const signature = request.headers.get('x-signature');
  if (!signature) {
    console.error('Missing x-signature header');
    return false;
  }

  const body = await request.text();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signatureBytes = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(body)
  );

  const expectedSignature = Array.from(new Uint8Array(signatureBytes))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const isValid = signature === expectedSignature;
  if (!isValid) {
    console.error('Signature verification failed');
  }
  return isValid;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('LEMON_SQUEEZY_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clone request to verify signature and parse body
    const clonedRequest = req.clone();
    const isValid = await verifySignature(clonedRequest, webhookSecret);
    
    if (!isValid) {
      console.error('Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const event: LemonSqueezyWebhookEvent = await req.json();
    console.log('Webhook event received:', event.meta.event_name);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const eventName = event.meta.event_name;
    const subscriptionId = event.data.id;
    const customerId = event.data.attributes.customer_id?.toString();
    const orderId = event.data.attributes.order_id?.toString();
    const status = event.data.attributes.status;

    // Get user_id from custom_data
    const userId = event.meta.custom_data?.user_id;

    if (!userId) {
      console.error('No user_id in custom_data');
      return new Response(
        JSON.stringify({ error: 'No user_id provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different event types
    switch (eventName) {
      case 'order_created':
        console.log('Processing order_created event');
        // Order created, subscription will be created separately
        await supabase
          .from('user_subscriptions')
          .update({
            lemon_squeezy_order_id: orderId,
            lemon_squeezy_customer_id: customerId,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        break;

      case 'subscription_created':
        console.log('Processing subscription_created event');
        await supabase
          .from('user_subscriptions')
          .update({
            plan: 'premium',
            status: 'active',
            lemon_squeezy_subscription_id: subscriptionId,
            lemon_squeezy_customer_id: customerId,
            current_period_end: event.data.attributes.renews_at 
              ? new Date(event.data.attributes.renews_at).toISOString()
              : null,
            trial_end: event.data.attributes.trial_ends_at
              ? new Date(event.data.attributes.trial_ends_at).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId);
        break;

      case 'subscription_updated':
        console.log('Processing subscription_updated event');
        await supabase
          .from('user_subscriptions')
          .update({
            status: status === 'active' ? 'active' : 'inactive',
            current_period_end: event.data.attributes.renews_at
              ? new Date(event.data.attributes.renews_at).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('lemon_squeezy_subscription_id', subscriptionId);
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
        console.log(`Processing ${eventName} event`);
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('lemon_squeezy_subscription_id', subscriptionId);
        break;

      case 'subscription_payment_success':
        console.log('Processing subscription_payment_success event');
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'active',
            current_period_end: event.data.attributes.renews_at
              ? new Date(event.data.attributes.renews_at).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('lemon_squeezy_subscription_id', subscriptionId);
        break;

      default:
        console.log(`Unhandled event type: ${eventName}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
