import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { maskEmail } from '../_shared/pii.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
  // El preflight se cachea: sin esto el navegador lo repite en cada intento.
  'Access-Control-Max-Age': '86400',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });

// Planes que se venden con checkout creado por API. B2B y Productastic Review
// usan checkouts hosteados (src/lib/directCheckout.ts) y no pasan por acá.
const VARIANT_CONFIG: Record<string, { variantId: string; purchaseType: 'subscription' | 'one_time' }> = {
  'premium': { variantId: '1071322', purchaseType: 'subscription' },
  'repremium': { variantId: '1170898', purchaseType: 'subscription' },
  'curso_estrategia': { variantId: '1170897', purchaseType: 'one_time' },
  'cursos_all': { variantId: '1170900', purchaseType: 'one_time' },
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate limiting: máximo 3 checkouts por email/usuario cada 10 minutos
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 3;

const SITE_URL = 'https://productprepa.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, plan = 'premium', warmup } = await req.json();

    // El front manda esto al pasar el mouse o tocar el botón de compra: levanta
    // el worker (cold start) y deja cacheado el preflight antes del clic real.
    // Sale antes de tocar la base, así que no cuenta para el rate limit.
    if (warmup === true) {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    // hasOwn: con un lookup directo, plan = "constructor" pasaba la validación.
    const config = typeof plan === 'string' && Object.hasOwn(VARIANT_CONFIG, plan)
      ? VARIANT_CONFIG[plan]
      : undefined;
    if (!config) {
      console.error('[Checkout] Invalid plan requested:', plan);
      return json({ error: 'Plan inválido' }, 400);
    }

    // SECURITY: Must have either userId or email
    if ((!userId && !email) || (email && typeof email !== 'string')) {
      return json({ error: 'Valid User ID or Email is required' }, 400);
    }

    // SECURITY: Validate UUID format if userId provided
    if (userId && !UUID_REGEX.test(userId)) {
      return json({ error: 'Invalid User ID format' }, 400);
    }

    // SECURITY: Validate email format if provided
    if (email && !EMAIL_REGEX.test(email)) {
      return json({ error: 'Invalid email format' }, 400);
    }

    const lemonSqueezyApiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
    if (!lemonSqueezyApiKey) {
      return json({ error: 'Lemon Squeezy API key not configured' }, 500);
    }

    const lemonSqueezyStoreId = Deno.env.get('LEMON_SQUEEZY_STORE_ID');
    if (!lemonSqueezyStoreId) {
      return json({ error: 'Lemon Squeezy Store ID not configured' }, 500);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const identifier: string = userId || email;
    const isAnonymousCheckout = !userId;

    // Todo lo que no depende entre sí sale junto: antes eran cuatro round trips
    // en fila (rate limit, escritura del rate limit, usuario, perfil) antes de
    // siquiera llamar a LemonSqueezy.
    //
    // SECURITY: con userId, el usuario sale del JWT del request y no del body.
    // La función no exige JWT (acepta compras anónimas), así que antes
    // cualquiera que tuviera el id de otra cuenta podía armar un checkout con
    // su email y su nombre. getUser cuesta lo mismo que el getUserById de antes.
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const [rateLimitResult, authResult, profileResult] = await Promise.all([
      supabase
        .from('checkout_rate_limit')
        .select('request_count, first_request_at')
        .eq('identifier', identifier)
        .maybeSingle(),
      userId ? supabase.auth.getUser(token) : null,
      userId
        ? supabase.from('profiles').select('name').eq('user_id', userId).maybeSingle()
        : null,
    ]);

    const rateLimitData = rateLimitResult.data;
    const now = Date.now();
    const timeSinceFirst = rateLimitData
      ? now - new Date(rateLimitData.first_request_at).getTime()
      : Infinity;

    if (rateLimitData && timeSinceFirst < RATE_LIMIT_WINDOW_MS && rateLimitData.request_count >= RATE_LIMIT_MAX_REQUESTS) {
      const waitTime = Math.ceil((RATE_LIMIT_WINDOW_MS - timeSinceFirst) / 1000 / 60);
      console.warn(`[Rate Limit] Blocked checkout attempt. Attempts: ${rateLimitData.request_count}, Wait: ${waitTime}min`);
      return json({
        error: 'Demasiados intentos de checkout',
        message: `Por favor espera ${waitTime} minutos antes de intentar nuevamente.`,
        retry_after: waitTime
      }, 429);
    }

    let checkoutEmail: string = email;
    let userName = '';

    if (userId) {
      const authUser = authResult?.data?.user;
      if (authResult?.error || !authUser?.email || authUser.id !== userId) {
        return json({ error: 'User not found' }, 404);
      }

      const profile = profileResult?.data;
      if (!profile) {
        return json({ error: 'User profile not found' }, 404);
      }

      checkoutEmail = authUser.email;
      userName = profile.name || '';
    }

    const nowIso = new Date(now).toISOString();
    const rateLimitWrite = !rateLimitData
      ? supabase.from('checkout_rate_limit').insert({
          identifier,
          request_count: 1,
          first_request_at: nowIso,
          last_request_at: nowIso
        })
      : timeSinceFirst >= RATE_LIMIT_WINDOW_MS
        // Si pasó la ventana, resetear contador
        ? supabase.from('checkout_rate_limit').update({
            request_count: 1,
            first_request_at: nowIso,
            last_request_at: nowIso
          }).eq('identifier', identifier)
        : supabase.from('checkout_rate_limit').update({
            request_count: rateLimitData.request_count + 1,
            last_request_at: nowIso
          }).eq('identifier', identifier);

    // Generar un checkout_intent_id único para tracking
    const checkoutIntentId = crypto.randomUUID();
    const origin = req.headers.get('origin') || SITE_URL;

    console.log(
      `[Checkout] Plan: ${plan}, Variant: ${config.variantId}, Anonymous: ${isAnonymousCheckout}, ` +
      `Email: ${maskEmail(checkoutEmail)}, Intent: ${checkoutIntentId}`
    );

    // El email no viaja en el redirect: /welcome no lo usa y así no queda en
    // el historial, en los logs ni en el referer.
    const redirectParams = new URLSearchParams({
      success: 'true',
      anonymous: String(isAnonymousCheckout),
      intent: checkoutIntentId,
      plan,
    });

    const checkoutData = {
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: checkoutEmail,
            ...(userName && { name: userName }),
            custom: {
              anonymous_checkout: String(isAnonymousCheckout),
              checkout_intent_id: checkoutIntentId,
              plan: plan,
              purchase_type: config.purchaseType,
              created_at: nowIso
            }
          },
          product_options: {
            redirect_url: `${origin}/welcome?${redirectParams.toString()}`
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
              id: config.variantId
            }
          }
        }
      }
    };

    // La escritura del rate limit corre en paralelo con LemonSqueezy: nada de
    // lo que sigue depende de ella, pero se espera antes de responder.
    const [response] = await Promise.all([
      fetch('https://api.lemonsqueezy.com/v1/checkouts', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${lemonSqueezyApiKey}`,
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json',
        },
        body: JSON.stringify(checkoutData),
        signal: AbortSignal.timeout(15_000),
      }).catch((error: Error) => error),
      Promise.resolve(rateLimitWrite).then(({ error }) => {
        if (error) console.error('[Rate Limit] Could not record attempt:', error.message);
      }),
    ]);

    if (response instanceof Error) {
      if (response.name === 'TimeoutError' || response.name === 'AbortError') {
        console.error('Lemon Squeezy API timeout después de 15 segundos');
        return json({
          error: 'La solicitud de checkout ha excedido el tiempo límite. Por favor intenta nuevamente.'
        }, 504);
      }
      throw response;
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Lemon Squeezy API Error] Status:', response.status, response.statusText);
      console.error('[Lemon Squeezy API Error] Variant ID:', config.variantId, 'Email:', maskEmail(checkoutEmail));
      console.error('[Lemon Squeezy API Error] Response body:', errorText);

      // Return generic user-friendly error (technical details logged above)
      return json({
        error: 'No pudimos procesar tu solicitud de pago. Intenta nuevamente en unos minutos.'
      }, response.status);
    }

    const checkoutSession = await response.json();
    const checkoutUrl = checkoutSession?.data?.attributes?.url;
    if (!checkoutUrl) {
      // Log only the response shape (no values) to diagnose without leaking
      // customer PII (checkoutSession.data.attributes contains checkout_data.email).
      const shape = {
        topLevelKeys: Object.keys(checkoutSession ?? {}),
        dataKeys: Object.keys(checkoutSession?.data ?? {}),
        attributeKeys: Object.keys(checkoutSession?.data?.attributes ?? {}),
        dataType: checkoutSession?.data?.type ?? null,
        dataId: checkoutSession?.data?.id ?? null,
      };
      console.error('[Lemon Squeezy API Error] Response 200 but missing data.attributes.url');
      console.error('[Lemon Squeezy API Error] Response shape:', JSON.stringify(shape));
      return json({ error: 'No pudimos procesar tu solicitud de pago. Intenta nuevamente en unos minutos.' }, 502);
    }

    console.log('[Lemon Squeezy API Success] Session ID:', checkoutSession.data?.id);
    return json({ checkoutUrl });

  } catch (error) {
    console.error('Error in lemon-squeezy-checkout function:', error instanceof Error ? error.message : 'Unknown error');
    return json({ error: 'Internal server error' }, 500);
  }
});
