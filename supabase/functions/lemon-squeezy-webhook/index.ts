import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { findOrCreateUser } from './helpers.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature',
};

// Mapping from variant ID to plan configuration
const VARIANT_TO_PLAN: Record<string, { plan: string; purchaseType: 'subscription' | 'one_time' }> = {
  '1071322': { plan: 'premium', purchaseType: 'subscription' },
  '1170898': { plan: 'repremium', purchaseType: 'subscription' },
  '1170897': { plan: 'curso_estrategia', purchaseType: 'one_time' },
  '1170900': { plan: 'cursos_all', purchaseType: 'one_time' },
};

interface LemonSqueezyWebhookEvent {
  meta: {
    event_name: string;
    custom_data?: {
      user_id?: string;
      plan?: string;
      purchase_type?: string;
    };
  };
  data: {
    id: string;
    type: string;
    attributes: {
      status: string;
      customer_id: number;
      order_id: number;
      variant_id?: number;
      first_order_item?: {
        variant_id?: number;
      };
      renews_at?: string;
      ends_at?: string;
      trial_ends_at?: string;
      created_at: string;
      updated_at: string;
      user_email?: string;
      customer_email?: string;
      user_name?: string;
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

// Helper function to log webhook event
async function logWebhookEvent(
  supabase: ReturnType<typeof createClient>,
  eventName: string,
  eventData: LemonSqueezyWebhookEvent,
  userEmail: string | null,
  userId: string | null,
  subscriptionId: string | null,
  customerId: string | null,
  orderId: string | null,
  status: 'success' | 'error',
  errorMessage: string | null,
  processingTimeMs: number
) {
  try {
    await supabase.from('payment_webhook_logs').insert({
      event_name: eventName,
      event_data: eventData,
      user_email: userEmail,
      user_id: userId,
      lemon_squeezy_subscription_id: subscriptionId,
      lemon_squeezy_customer_id: customerId,
      lemon_squeezy_order_id: orderId,
      status,
      error_message: errorMessage,
      processing_time_ms: processingTimeMs,
    });
  } catch (error) {
    console.error('Failed to log webhook event:', error);
  }
}

// Helper to extract variant ID from event
function extractVariantId(event: LemonSqueezyWebhookEvent): string | null {
  // Try multiple locations where variant_id might be
  const variantId = 
    event.data.attributes.variant_id?.toString() ||
    event.data.attributes.first_order_item?.variant_id?.toString() ||
    null;
  
  console.log('[Webhook] Extracted variant_id:', variantId);
  return variantId;
}

serve(async (req) => {
  const startTime = Date.now();
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  let event: LemonSqueezyWebhookEvent | null = null;
  let eventName = 'unknown';
  let userEmail: string | null = null;
  let userId: string | null = null;
  let subscriptionId: string | null = null;
  let customerId: string | null = null;
  let orderId: string | null = null;

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

    event = await req.json();
    console.log('Webhook event received:', event!.meta.event_name);
    console.log('Event data type:', event!.data.type);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    eventName = event!.meta.event_name;
    subscriptionId = event!.data.id;
    customerId = event!.data.attributes.customer_id?.toString();
    orderId = event!.data.attributes.order_id?.toString();
    const status = event!.data.attributes.status;

    // Extract variant ID to determine plan
    const variantId = extractVariantId(event!);
    const planConfig = variantId ? VARIANT_TO_PLAN[variantId] : null;
    
    console.log('[Webhook] Variant ID:', variantId);
    console.log('[Webhook] Plan config:', planConfig);

    // Get user email from webhook event
    userEmail = event!.data.attributes.user_email || event!.data.attributes.customer_email || null;

    if (!userEmail) {
      console.error('No user email in webhook event');
      
      // Log the failed event
      await logWebhookEvent(
        supabase, eventName, event!, null, null, subscriptionId, customerId, orderId,
        'error', 'No user email provided', Date.now() - startTime
      );
      
      return new Response(
        JSON.stringify({ error: 'No user email provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find or create user profile by email
    console.log('Finding or creating user for email:', userEmail);
    
    try {
      const userName = event!.data.attributes.user_name || null;
      userId = await findOrCreateUser(userEmail, userName, supabase);
      console.log('User profile ready:', userId);
    } catch (error) {
      console.error('Failed to find or create user:', error);
      
      // Log the failed event
      await logWebhookEvent(
        supabase, eventName, event!, userEmail, null, subscriptionId, customerId, orderId,
        'error', `Failed to process user account: ${error}`, Date.now() - startTime
      );
      
      return new Response(
        JSON.stringify({ error: 'Failed to process user account' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Handle different event types
    switch (eventName) {
      case 'order_created':
        console.log('Processing order_created event');
        
        // For one-time purchases, activate the plan immediately
        if (planConfig?.purchaseType === 'one_time') {
          console.log('[Webhook] One-time purchase detected, activating plan:', planConfig.plan);
          
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              plan: planConfig.plan,
              status: 'active',
              purchase_type: 'one_time',
              lemon_squeezy_variant_id: variantId,
              lemon_squeezy_order_id: orderId,
              lemon_squeezy_customer_id: customerId,
              // No current_period_end for one-time purchases (permanent access)
              current_period_end: null,
              updated_at: new Date().toISOString(),
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            });
            
          console.log('[Webhook] One-time purchase activated successfully');
        } else {
          // For subscriptions, just record the order (subscription_created will handle activation)
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              lemon_squeezy_order_id: orderId,
              lemon_squeezy_customer_id: customerId,
              lemon_squeezy_variant_id: variantId,
              updated_at: new Date().toISOString(),
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            });
        }
        break;

      case 'subscription_created':
        console.log('Processing subscription_created event');
        const renews_at = event!.data.attributes.renews_at;
        const trial_ends_at = event!.data.attributes.trial_ends_at;
        
        // Determine plan from variant or default to premium
        const subscriptionPlan = planConfig?.plan || 'premium';
        console.log('[Webhook] Subscription plan:', subscriptionPlan);
        
        await supabase
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan: subscriptionPlan,
            status: 'active',
            purchase_type: 'subscription',
            lemon_squeezy_subscription_id: subscriptionId,
            lemon_squeezy_customer_id: customerId,
            lemon_squeezy_variant_id: variantId,
            current_period_end: renews_at 
              ? new Date(renews_at).toISOString()
              : null,
            trial_end: trial_ends_at
              ? new Date(trial_ends_at).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          }, { 
            onConflict: 'user_id',
            ignoreDuplicates: false 
          });
        break;

      case 'subscription_updated':
        console.log('Processing subscription_updated event');
        await supabase
          .from('user_subscriptions')
          .update({
            status: status === 'active' ? 'active' : 'inactive',
            current_period_end: event!.data.attributes.renews_at
              ? new Date(event!.data.attributes.renews_at).toISOString()
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
            current_period_end: event!.data.attributes.renews_at
              ? new Date(event!.data.attributes.renews_at).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('lemon_squeezy_subscription_id', subscriptionId);
        break;

      default:
        console.log(`Unhandled event type: ${eventName}`);
    }

    // Log successful event
    await logWebhookEvent(
      supabase, eventName, event!, userEmail, userId, subscriptionId, customerId, orderId,
      'success', null, Date.now() - startTime
    );

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Try to log the error if we have a supabase client
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      
      await logWebhookEvent(
        supabase, eventName, event || {} as LemonSqueezyWebhookEvent, userEmail, userId, 
        subscriptionId, customerId, orderId,
        'error', `Error processing webhook: ${error}`, Date.now() - startTime
      );
    } catch (logError) {
      console.error('Failed to log error event:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: 'Error procesando webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
