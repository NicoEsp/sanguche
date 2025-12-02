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

    // Rate limiting: Max 3 requests por email/userId en 10 minutos
    const identifier = userId || email!;
    const rateLimitWindow = 10 * 60 * 1000; // 10 minutos en ms
    const maxRequests = 3;

    // Check rate limit
    const { data: rateLimitData } = await supabase
      .from('checkout_rate_limit')
      .select('request_count, first_request_at, last_request_at')
      .eq('identifier', identifier)
      .single();

    if (rateLimitData) {
      const timeSinceFirst = Date.now() - new Date(rateLimitData.first_request_at).getTime();
      
      // Si está dentro de la ventana y excede el límite
      if (timeSinceFirst < rateLimitWindow && rateLimitData.request_count >= maxRequests) {
        const waitTime = Math.ceil((rateLimitWindow - timeSinceFirst) / 1000 / 60);
        
        console.warn(`[Rate Limit] Blocked checkout attempt for ${identifier}`);
        console.warn(`[Rate Limit] Attempts: ${rateLimitData.request_count}, Wait: ${waitTime}min`);
        
        return new Response(
          JSON.stringify({ 
            error: 'Demasiados intentos de checkout',
            message: `Por favor espera ${waitTime} minutos antes de intentar nuevamente.`,
            retry_after: waitTime
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Si pasó la ventana, resetear contador
      if (timeSinceFirst >= rateLimitWindow) {
        await supabase
          .from('checkout_rate_limit')
          .update({
            request_count: 1,
            first_request_at: new Date().toISOString(),
            last_request_at: new Date().toISOString()
          })
          .eq('identifier', identifier);
      } else {
        // Incrementar contador
        await supabase
          .from('checkout_rate_limit')
          .update({
            request_count: rateLimitData.request_count + 1,
            last_request_at: new Date().toISOString()
          })
          .eq('identifier', identifier);
      }
    } else {
      // Primera vez, crear entry
      await supabase
        .from('checkout_rate_limit')
        .insert({
          identifier,
          request_count: 1,
          first_request_at: new Date().toISOString(),
          last_request_at: new Date().toISOString()
        });
    }

    console.log(`[Rate Limit] Checkout allowed for ${identifier}`);

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

    // Generar un checkout_intent_id único para tracking
    const checkoutIntentId = crypto.randomUUID();

    console.log('[Checkout Intent] Generated ID:', checkoutIntentId);
    console.log('[Checkout Intent] Email:', checkoutEmail);

    // Create Lemon Squeezy checkout
    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: checkoutEmail,
            name: userName,
          custom: {
            anonymous_checkout: String(isAnonymousCheckout),
            checkout_intent_id: checkoutIntentId,
            created_at: new Date().toISOString()
          }
        },
        product_options: {
          redirect_url: `${req.headers.get('origin')}/welcome?success=true&anonymous=${String(isAnonymousCheckout)}&intent=${checkoutIntentId}&email=${encodeURIComponent(checkoutEmail)}`
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
    console.log('[Checkout Request] Variant ID:', variantId);
    console.log('[Checkout Request] Email:', checkoutEmail);
    console.log('[Checkout Request] Is anonymous:', isAnonymousCheckout);

    // Crear AbortController para timeout de 15 segundos
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let response;
    try {
      response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lemonSqueezyApiKey}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
        body: JSON.stringify(checkoutData),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        console.error('Lemon Squeezy API timeout después de 15 segundos');
        return new Response(
          JSON.stringify({ 
            error: 'La solicitud de checkout ha excedido el tiempo límite. Por favor intenta nuevamente.' 
          }),
          { status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw error;
    }

    if (!response.ok) {
      console.error('[Lemon Squeezy API Error] Status:', response.status, response.statusText);
      console.error('[Lemon Squeezy API Error] Request was for email:', checkoutEmail);
      console.error('[Lemon Squeezy API Error] Variant ID:', variantId);
      
      const errorText = await response.text();
      console.error('[Lemon Squeezy API Error] Response body:', errorText);
      
      // Intentar parsear como JSON para más detalles
      let parsedError = null;
      try {
        parsedError = JSON.parse(errorText);
        console.error('[Lemon Squeezy API Error] Parsed JSON:', JSON.stringify(parsedError, null, 2));
      } catch (e) {
        console.error('[Lemon Squeezy API Error] Response is not valid JSON');
      }
      
      // Return generic user-friendly error (technical details logged above)
      return new Response(
        JSON.stringify({ 
          error: 'No pudimos procesar tu solicitud de pago. Intenta nuevamente en unos minutos.'
        }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const checkoutSession = await response.json();
    console.log('[Lemon Squeezy API Success] Checkout session created');
    console.log('[Lemon Squeezy API Success] Session ID:', checkoutSession.data?.id);
    console.log('[Lemon Squeezy API Success] Checkout URL generated for:', checkoutEmail);

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
