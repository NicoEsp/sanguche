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
    const { userId, email } = await req.json();
    
    // SECURITY: Must have either userId or email
    if ((!userId && !email) || (email && typeof email !== 'string')) {
      return new Response(
        JSON.stringify({ error: 'Valid User ID or Email is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    
    // SECURITY: Validate UUID format if userId provided
    if (userId) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return new Response(
          JSON.stringify({ error: 'Invalid User ID format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // SECURITY: Validate email format if provided
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: 'Invalid email format' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const lemonSqueezyApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
    if (!lemonSqueezyApiKey) {
      return new Response(
        JSON.stringify({ error: 'Lemon Squeezy API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lemonSqueezyStoreId = Deno.env.get('LEMON_SQUEEZY_STORE_ID');
    if (!lemonSqueezyStoreId) {
      return new Response(
        JSON.stringify({ error: 'Lemon Squeezy Store ID not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get user profile and email from Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let checkoutEmail = email;
    let userName = '';
    let isAnonymousCheckout = !userId;

    if (userId) {
      // Authenticated user flow
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(userId);
      
      if (authError || !authUser?.user?.email) {
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

      checkoutEmail = authUser.user.email;
      userName = profile.name || '';
    }
    // If no userId, we're using the email provided (anonymous checkout)

    // Lemon Squeezy Variant ID for Premium Plan
    const variantId = '1071322';

    // Create Lemon Squeezy checkout
    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: checkoutEmail,
            name: userName,
            custom: {
              anonymous_checkout: String(isAnonymousCheckout)
            }
          },
          product_options: {
            redirect_url: `${req.headers.get('origin')}/welcome?success=true&anonymous=${String(isAnonymousCheckout)}`
          }
        },
        relationships: {
          store: {
            data: {
              type: 'stores',
              id: lemonSqueezyStoreId
            }
          },
          variant: {
            data: {
              type: 'variants',
              id: variantId
            }
          }
        }
      }
    };

    console.log('Creating Lemon Squeezy checkout session for user');

    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lemonSqueezyApiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify(checkoutData),
    });

    if (!response.ok) {
      console.error('Lemon Squeezy API error:', response.status);
      const errorText = await response.text();
      console.error('Error details:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutSession = await response.json();
    console.log('Lemon Squeezy checkout session created successfully');

    return new Response(
      JSON.stringify({ checkoutUrl: checkoutSession.data.attributes.url }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in lemon-squeezy-checkout function:', error instanceof Error ? error.message : 'Unknown error');
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
