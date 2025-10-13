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

    // Get subscription with Polar ID (server-side only)
    const { data: subscription, error: subError } = await supabase
      .from('user_subscriptions')
      .select('polar_subscription_id, status, plan')
      .eq('user_id', profile.id)
      .single();

    if (subError || !subscription) {
      console.error('Subscription error:', subError);
      throw new Error('Subscription not found');
    }

    if (subscription.plan !== 'premium' || subscription.status !== 'active') {
      throw new Error('No active premium subscription found');
    }

    if (!subscription.polar_subscription_id) {
      throw new Error('No Polar subscription ID found');
    }

    // Cancel subscription in Polar
    const polarAccessToken = Deno.env.get('POLAR_ACCESS_TOKEN');
    if (!polarAccessToken) {
      throw new Error('Polar access token not configured');
    }

    console.log('Canceling Polar subscription:', subscription.polar_subscription_id);

    const polarResponse = await fetch(
      `https://api.polar.sh/v1/subscriptions/${subscription.polar_subscription_id}/cancel`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${polarAccessToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!polarResponse.ok) {
      const errorText = await polarResponse.text();
      console.error('Polar API error:', errorText);
      throw new Error(`Failed to cancel subscription in Polar: ${errorText}`);
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
