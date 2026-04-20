import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { findOrCreateUser } from './helpers.ts';
import { maskEmail } from '../_shared/pii.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
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
      total?: number; // Total amount in cents (includes discounts)
      subtotal?: number;
      discount_total?: number;
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
  supabase: any,
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

// Helper to log structured event summary
function logEventSummary(
  phase: 'START' | 'END',
  eventName: string,
  data: {
    email?: string | null;
    variantId?: string | null;
    plan?: string | null;
    purchaseType?: string | null;
    result?: 'success' | 'error';
    errorMessage?: string | null;
    processingTimeMs?: number;
  }
) {
  const timestamp = new Date().toISOString();
  if (phase === 'START') {
    console.log(`[Webhook][${timestamp}] ========== START: ${eventName} ==========`);
    console.log(`[Webhook] Email: ${maskEmail(data.email)}`);
    console.log(`[Webhook] Variant ID: ${data.variantId || 'N/A'}`);
    console.log(`[Webhook] Plan: ${data.plan || 'N/A'}`);
    console.log(`[Webhook] Purchase Type: ${data.purchaseType || 'N/A'}`);
  } else {
    console.log(`[Webhook][${timestamp}] Result: ${data.result?.toUpperCase()}`);
    if (data.errorMessage) {
      console.log(`[Webhook] Error: ${data.errorMessage}`);
    }
    console.log(`[Webhook] Processing time: ${data.processingTimeMs}ms`);
    console.log(`[Webhook] ========== END: ${eventName} ==========`);
  }
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
  let variantId: string | null = null;
  let planConfig: { plan: string; purchaseType: 'subscription' | 'one_time' } | null = null;

  try {
    const webhookSecret = Deno.env.get('LEMON_SQUEEZY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('[Webhook] LEMON_SQUEEZY_WEBHOOK_SECRET not configured');
      return new Response(
        JSON.stringify({ error: 'Webhook secret not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clone request to verify signature and parse body
    const clonedRequest = req.clone();
    const isValid = await verifySignature(clonedRequest, webhookSecret);
    
    if (!isValid) {
      console.error('[Webhook] Invalid webhook signature');
      return new Response(
        JSON.stringify({ error: 'Invalid signature' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    event = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    eventName = event!.meta.event_name;
    subscriptionId = event!.data.id;
    customerId = event!.data.attributes.customer_id?.toString();
    orderId = event!.data.attributes.order_id?.toString();
    const status = event!.data.attributes.status;

    // Extract variant ID to determine plan
    variantId = extractVariantId(event!);
    planConfig = variantId ? VARIANT_TO_PLAN[variantId] : null;

    // Get user email from webhook event
    userEmail = event!.data.attributes.user_email || event!.data.attributes.customer_email || null;

    // Log structured event summary at start
    logEventSummary('START', eventName, {
      email: userEmail,
      variantId,
      plan: planConfig?.plan,
      purchaseType: planConfig?.purchaseType,
    });

    if (!userEmail) {
      console.error('[Webhook] No user email in webhook event');
      
      logEventSummary('END', eventName, {
        result: 'error',
        errorMessage: 'No user email provided',
        processingTimeMs: Date.now() - startTime,
      });
      
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
    console.log(`[Webhook] Finding or creating user for email: ${maskEmail(userEmail)}`);
    
    try {
      const userName = event!.data.attributes.user_name || null;
      userId = await findOrCreateUser(userEmail, userName, supabase);
      console.log(`[Webhook] User profile ready: ${userId}`);
    } catch (error) {
      console.error('[Webhook] Failed to find or create user:', error);
      
      logEventSummary('END', eventName, {
        result: 'error',
        errorMessage: `Failed to process user account: ${error}`,
        processingTimeMs: Date.now() - startTime,
      });
      
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
        console.log(`[Webhook] Processing order_created - Plan: ${planConfig?.plan || 'unknown'}, Type: ${planConfig?.purchaseType || 'unknown'}`);
        
        // Extract the actual paid amount (with discounts applied)
        const orderTotal = event!.data.attributes.total;
        console.log(`[Webhook] Order total (with discounts): ${orderTotal} centavos`);
        
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
              paid_amount: orderTotal || null, // Store actual paid amount
              // No current_period_end for one-time purchases (permanent access)
              current_period_end: null,
              updated_at: new Date().toISOString(),
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            });
            
          console.log('[Webhook] One-time purchase activated successfully');
        } else {
          // For subscriptions, record the order with paid_amount and set plan proactively
          // This ensures the user has access even if subscription_created webhook is delayed
          const subPlan = planConfig?.plan || 'premium';
          console.log('[Webhook] Subscription order - setting plan proactively:', subPlan);
          
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              plan: subPlan,
              status: 'active',
              purchase_type: 'subscription',
              lemon_squeezy_order_id: orderId,
              lemon_squeezy_customer_id: customerId,
              lemon_squeezy_variant_id: variantId,
              paid_amount: orderTotal || null,
              updated_at: new Date().toISOString(),
            }, { 
              onConflict: 'user_id',
              ignoreDuplicates: false 
            });
        }
        break;

      case 'subscription_created':
        console.log(`[Webhook] Processing subscription_created - Plan: ${planConfig?.plan || 'premium'}`);
        const renews_at = event!.data.attributes.renews_at;
        const trial_ends_at = event!.data.attributes.trial_ends_at;
        
        // Determine plan from variant or default to premium
        const subscriptionPlan = planConfig?.plan || 'premium';
        console.log('[Webhook] Subscription plan:', subscriptionPlan);

        // Auto-cancel previous subscription if upgrading
        const { data: currentSub } = await supabase
          .from('user_subscriptions')
          .select('lemon_squeezy_subscription_id, plan')
          .eq('user_id', userId)
          .eq('status', 'active')
          .not('lemon_squeezy_subscription_id', 'is', null)
          .maybeSingle();

        if (currentSub?.lemon_squeezy_subscription_id 
            && currentSub.lemon_squeezy_subscription_id !== subscriptionId) {
          console.log(`[Webhook] Auto-cancelling previous subscription: ${currentSub.lemon_squeezy_subscription_id} (plan: ${currentSub.plan})`);
          
          const lsApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
          if (lsApiKey) {
            try {
              const cancelResponse = await fetch(
                `https://api.lemonsqueezy.com/v1/subscriptions/${currentSub.lemon_squeezy_subscription_id}`,
                {
                  method: 'DELETE',
                  headers: {
                    'Authorization': `Bearer ${lsApiKey}`,
                    'Accept': 'application/vnd.api+json',
                  },
                }
              );
              
              if (cancelResponse.ok) {
                console.log('[Webhook] Previous subscription cancelled successfully');
              } else {
                console.error('[Webhook] Failed to cancel previous subscription:', await cancelResponse.text());
              }
            } catch (cancelError) {
              console.error('[Webhook] Error cancelling previous subscription:', cancelError);
            }
          }
        }

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
        console.log(`[Webhook] Processing subscription_updated - Status: ${status}`);
        
        // Map Lemon Squeezy statuses to our DB statuses
        // LS statuses: active, paused, past_due, unpaid, cancelled, expired
        const mappedStatus = (() => {
          switch (status) {
            case 'active':
              return 'active' as const;
            case 'cancelled':
            case 'expired':
              return 'cancelled' as const;
            case 'paused':
            case 'past_due':
            case 'unpaid':
            default:
              return 'inactive' as const;
          }
        })();
        
        console.log(`[Webhook] Mapped LS status "${status}" -> DB status "${mappedStatus}"`);
        
        await supabase
          .from('user_subscriptions')
          .update({
            status: mappedStatus,
            current_period_end: event!.data.attributes.renews_at
              ? new Date(event!.data.attributes.renews_at).toISOString()
              : null,
            updated_at: new Date().toISOString(),
          })
          .eq('lemon_squeezy_subscription_id', subscriptionId);
        break;

      case 'subscription_cancelled':
      case 'subscription_expired':
        console.log(`[Webhook] Processing ${eventName} - Subscription ID: ${subscriptionId}`);
        await supabase
          .from('user_subscriptions')
          .update({
            status: 'cancelled',
            updated_at: new Date().toISOString(),
          })
          .eq('lemon_squeezy_subscription_id', subscriptionId);
        break;

      case 'subscription_payment_success':
        console.log(`[Webhook] Processing subscription_payment_success - Subscription ID: ${subscriptionId}`);
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
        console.log(`[Webhook] Unhandled event type: ${eventName}`);
    }

    // Log structured event summary at end
    logEventSummary('END', eventName, {
      result: 'success',
      processingTimeMs: Date.now() - startTime,
    });

    // Log successful event to database
    await logWebhookEvent(
      supabase, eventName, event!, userEmail, userId, subscriptionId, customerId, orderId,
      'success', null, Date.now() - startTime
    );

    return new Response(
      JSON.stringify({ received: true }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    
    logEventSummary('END', eventName, {
      result: 'error',
      errorMessage: `${error}`,
      processingTimeMs: Date.now() - startTime,
    });
    
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
      console.error('[Webhook] Failed to log error event:', logError);
    }
    
    return new Response(
      JSON.stringify({ error: 'Error procesando webhook' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
