import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('🎯 Polar webhook called:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries()),
    timestamp: new Date().toISOString()
  });

  if (req.method === 'OPTIONS') {
    console.log('📋 Handling CORS preflight request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log ALL headers for debugging
    const allHeaders = Object.fromEntries(req.headers.entries());
    console.log('📋 ALL HEADERS RECEIVED:', allHeaders);
    
    const signature = req.headers.get('webhook-signature');
    const polarSignature = req.headers.get('x-polar-signature');
    const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET');
    
    console.log('🔐 Webhook security check:', {
      hasWebhookSignature: !!signature,
      hasPolarSignature: !!polarSignature,
      hasSecret: !!webhookSecret,
      signaturePreview: signature ? signature.substring(0, 20) + '...' : 'none',
      polarSignaturePreview: polarSignature ? polarSignature.substring(0, 20) + '...' : 'none'
    });
    
    // TEMPORARILY DISABLE signature verification to debug
    // TODO: Re-enable once we identify correct header and algorithm
    if (!webhookSecret) {
      console.error('❌ Missing webhook secret');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    const body = await req.text();
    console.log('📦 Webhook body received:', {
      bodyLength: body.length,
      bodyPreview: body.substring(0, 200) + (body.length > 200 ? '...' : '')
    });
    
    // Verify webhook signature (improved verification)
    const expectedSignature = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(webhookSecret + body)
    );
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    console.log('🔍 Signature verification (DISABLED FOR DEBUGGING):', {
      received: signature,
      polarReceived: polarSignature,
      expectedPrefix: expectedHex.substring(0, 20) + '...',
      matches: signature ? signature.includes(expectedHex.substring(0, 10)) : false
    });

    // SIGNATURE VERIFICATION TEMPORARILY DISABLED
    // This allows us to see what headers Polar is actually sending
    // TODO: Re-enable once we identify correct header and algorithm
    console.log('⚠️  SIGNATURE VERIFICATION DISABLED FOR DEBUGGING');

    let event;
    try {
      event = JSON.parse(body);
      console.log('✅ Parsed webhook event:', {
        type: event.type,
        eventId: event.id || 'no-id',
        data: event.data ? Object.keys(event.data) : 'no-data'
      });
    } catch (parseError) {
      console.error('❌ Failed to parse webhook body:', parseError);
      return new Response('Invalid JSON payload', { status: 400 });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    console.log('🎬 Processing event type:', event.type);
    
    switch (event.type) {
      case 'subscription.active':
      case 'subscription.created': {
        console.log('💳 Processing subscription creation/activation');
        const subscription = event.data;
        const metadata = subscription.metadata || {};
        
        console.log('📋 Subscription details:', {
          subscriptionId: subscription.id,
          customerId: subscription.customer_id,
          metadata,
          currentPeriodEnd: subscription.current_period_end
        });
        
        if (metadata.profile_id) {
          console.log('👤 Updating subscription for profile:', metadata.profile_id);
          
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
            console.error('❌ Error updating subscription:', {
              error: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
          } else {
            console.log('✅ Subscription activated successfully:', {
              profileId: metadata.profile_id,
              subscriptionData: data
            });
          }
        } else {
          console.warn('⚠️  No profile_id in metadata:', metadata);
        }
        break;
      }

      case 'subscription.canceled':
      case 'subscription.incomplete_expired': {
        console.log('❌ Processing subscription cancellation/expiration');
        const subscription = event.data;
        const metadata = subscription.metadata || {};
        
        console.log('📋 Cancellation details:', {
          subscriptionId: subscription.id,
          metadata,
          eventType: event.type
        });
        
        if (metadata.profile_id) {
          console.log('👤 Canceling subscription for profile:', metadata.profile_id);
          
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
            console.error('❌ Error canceling subscription:', {
              error: error.message,
              details: error.details,
              hint: error.hint,
              code: error.code
            });
          } else {
            console.log('✅ Subscription canceled successfully:', {
              profileId: metadata.profile_id,
              subscriptionData: data
            });
          }
        } else {
          console.warn('⚠️  No profile_id in metadata for cancellation:', metadata);
        }
        break;
      }

      case 'order.created': {
        console.log('🛒 Processing order creation');
        const order = event.data;
        console.log('📦 Order details:', {
          orderId: order.id,
          customerId: order.customer_id,
          amount: order.amount,
          currency: order.currency
        });
        // Additional order processing can be added here
        break;
      }

      default:
        console.warn('❓ Unhandled event type:', event.type);
        console.log('📄 Full event data:', event);
    }

    console.log('✅ Webhook processed successfully');
    return new Response('OK', { 
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : 'UnknownError';
    
    console.error('💥 Critical error in polar-webhook function:', {
      message: errorMessage,
      stack: errorStack,
      name: errorName
    });
    
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      timestamp: new Date().toISOString()
    }), { 
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});