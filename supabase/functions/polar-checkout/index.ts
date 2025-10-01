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
    const { userId } = await req.json();
    
    // SECURITY: Input validation
    if (!userId || typeof userId !== 'string' || userId.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Valid User ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // SECURITY: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid User ID format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const polarAccessToken = Deno.env.get('POLAR_ACCESS_TOKEN');
    if (!polarAccessToken) {
      return new Response(
        JSON.stringify({ error: 'Polar access token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile and email from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email from auth.users table
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
    
    if (authError || !authUser?.user?.email) {
      // SECURITY: Don't expose detailed error information
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, user_id')
      .eq('user_id', userId)
      .single();

    if (!profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // First, get the product details to find the correct price_id
    const productResponse = await fetch('https://api.polar.sh/v1/products/0e76f08a-fe1e-4533-a173-fbfc3da81c49', {
      headers: {
        'Authorization': `Bearer ${polarAccessToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!productResponse.ok) {
      // SECURITY: Log error without exposing response data
      console.error('Failed to fetch product details:', productResponse.status);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch product details' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const productData = await productResponse.json();
    
    // Extract the price_id from the product
    const priceId = productData.prices?.[0]?.id;
    if (!priceId) {
      return new Response(
        JSON.stringify({ error: 'Product configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Polar checkout session with product_price_id
    const checkoutData = {
      product_price_id: priceId,
      success_url: `${req.headers.get('origin')}/mentoria?success=true`,
      customer_email: authUser.user.email,
      metadata: {
        profile_id: profile.id,
        user_id: userId
      }
    };

    // SECURITY: Log action without exposing sensitive data
    console.log('Creating Polar checkout session for user');

    const response = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${polarAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      // SECURITY: Log error without exposing API response
      console.error('Polar API error:', response.status);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutSession = await response.json();
    console.log('Polar checkout session created successfully');

    return new Response(
      JSON.stringify({ checkoutUrl: checkoutSession.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    // SECURITY: Log error without exposing detailed information
    console.error('Error in polar-checkout function:', error instanceof Error ? error.name : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});