import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify user
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('Auth error:', userError);
      throw new Error('Unauthorized');
    }

    console.log('Canceling subscription for user:', user.id);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('Profile error:', profileError);
      throw new Error('Profile not found');
    }

    // Get subscription with Lemon Squeezy ID (server-side only)
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('lemon_squeezy_subscription_id, status, plan')
      .eq('user_id', profile.id)
      .single();

    if (subError || !subscription) {
      console.error('Subscription error:', subError);
      throw new Error('Subscription not found');
    }

    if (subscription.plan !== 'premium' || subscription.status !== 'active') {
      throw new Error('No active premium subscription found');
    }

    if (!subscription.lemon_squeezy_subscription_id) {
      throw new Error('No Lemon Squeezy subscription ID found');
    }

    // Cancel subscription in Lemon Squeezy
    const lemonSqueezyApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
    if (!lemonSqueezyApiKey) {
      throw new Error('Lemon Squeezy API key not configured');
    }

    console.log('Canceling Lemon Squeezy subscription:', subscription.lemon_squeezy_subscription_id);

    const lemonSqueezyResponse = await fetch(
      `https://api.lemonsqueezy.com/v1/subscriptions/${subscription.lemon_squeezy_subscription_id}`,
      {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${lemonSqueezyApiKey}`,
          'Accept': 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      }
    );

    if (!lemonSqueezyResponse.ok) {
      const errorText = await lemonSqueezyResponse.text();
      console.error('Lemon Squeezy API error:', errorText);
      throw new Error(`Failed to cancel subscription in Lemon Squeezy: ${errorText}`);
    }

    // Update subscription status in database
    const { error: updateError } = await supabase
      .from('user_subscriptions')
      .update({ status: 'cancelled' })
      .eq('user_id', profile.id);

    if (updateError) {
      console.error('Database update error:', updateError);
      throw new Error('Failed to update subscription status');
    }

    console.log('Subscription cancelled successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in cancel-subscription:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
