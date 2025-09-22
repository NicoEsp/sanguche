import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get('webhook-signature');
    const webhookSecret = Deno.env.get('POLAR_WEBHOOK_SECRET');
    
    if (!signature || !webhookSecret) {
      console.error('Missing signature or webhook secret');
      return new Response('Unauthorized', { status: 401 });
    }

    const body = await req.text();
    
    // Verify webhook signature (basic implementation)
    const expectedSignature = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(webhookSecret + body)
    );
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    // Simple signature verification - in production you might want more robust verification
    if (!signature.includes(expectedHex.substring(0, 10))) {
      console.error('Invalid webhook signature');
      return new Response('Invalid signature', { status: 401 });
    }

    const event = JSON.parse(body);
    console.log('Received Polar webhook event:', event.type, event);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case 'subscription.active':
      case 'subscription.created': {
        const subscription = event.data;
        const metadata = subscription.metadata || {};
        
        if (metadata.profile_id) {
          const { error } = await supabase
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
            });

          if (error) {
            console.error('Error updating subscription:', error);
          } else {
            console.log('Subscription activated for profile:', metadata.profile_id);
          }
        }
        break;
      }

      case 'subscription.canceled':
      case 'subscription.incomplete_expired': {
        const subscription = event.data;
        const metadata = subscription.metadata || {};
        
        if (metadata.profile_id) {
          const { error } = await supabase
            .from('user_subscriptions')
            .update({
              plan: 'free',
              status: 'active',
              polar_subscription_id: subscription.id,
            })
            .eq('user_id', metadata.profile_id);

          if (error) {
            console.error('Error canceling subscription:', error);
          } else {
            console.log('Subscription canceled for profile:', metadata.profile_id);
          }
        }
        break;
      }

      case 'order.created': {
        const order = event.data;
        console.log('Order created:', order.id, 'for customer:', order.customer_id);
        // Additional order processing can be added here
        break;
      }

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response('OK', { status: 200 });

  } catch (error) {
    console.error('Error in polar-webhook function:', error);
    return new Response('Internal error', { status: 500 });
  }
});