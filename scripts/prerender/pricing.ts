import { FALLBACK_PRICES, type PlanPricing, type PricingKey } from '../../src/constants/planesContent';

/**
 * Precios vigentes, en build time, para el HTML estático de /planes.
 *
 * Los precios no viven en el código: los trae la edge function pricing-config
 * desde Lemon Squeezy. Se le piden a ella y no a Lemon Squeezy directo porque
 * pricing-config ya tiene la API key, el mapa de variantes y un cache.
 *
 * Ventana de desactualización: entre que cambiás un precio en Lemon Squeezy y
 * el próximo deploy, un crawler ve el precio del último build. Se cierra
 * redeployando al cambiar precios. El navegador siempre muestra el precio vivo,
 * así que a una persona nunca le llega uno viejo.
 *
 * Un fallo acá no corta el build: se avisa fuerte y se usan los precios de
 * respaldo del repo. Publicar la página sin precios sería peor, que es
 * exactamente el estado del que venimos.
 */

const env = (...names: string[]) => names.map((n) => process.env[n]).find(Boolean);

export async function fetchPricing(): Promise<Record<PricingKey, PlanPricing>> {
  const url = env('VITE_SUPABASE_URL', 'SUPABASE_URL');
  const key = env('VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY');

  if (!url || !key) {
    console.warn('[prerender] Sin credenciales de Supabase: /planes usa los precios de respaldo.');
    return FALLBACK_PRICES;
  }

  try {
    const response = await fetch(`${url.replace(/\/+$/, '')}/functions/v1/pricing-config`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      signal: AbortSignal.timeout(15_000),
    });

    if (!response.ok) {
      console.warn(
        `[prerender] pricing-config respondió ${response.status}: /planes usa los precios de respaldo.`
      );
      return FALLBACK_PRICES;
    }

    const data = await response.json();
    const plans = data?.plans as Partial<Record<PricingKey, PlanPricing>> | undefined;

    // `source: 'fallback'` significa que la propia función no pudo hablar con
    // Lemon Squeezy. Sus valores de respaldo son los mismos que los de acá, pero
    // conviene que quede dicho en el log del build.
    if (data?.source === 'fallback') {
      console.warn('[prerender] pricing-config no pudo consultar Lemon Squeezy (source: fallback).');
    }

    if (!plans?.premium?.formatted) {
      console.warn('[prerender] Respuesta de pricing-config sin precios: se usan los de respaldo.');
      return FALLBACK_PRICES;
    }

    const prices = { ...FALLBACK_PRICES, ...plans };
    console.log(
      `✓ Precios para /planes: Premium ${prices.premium.formatted}, ` +
        `RePremium ${prices.repremium.formatted} (fuente: ${data.source ?? 'desconocida'})`
    );
    return prices;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    console.warn(`[prerender] No se pudo consultar pricing-config (${reason}): precios de respaldo.`);
    return FALLBACK_PRICES;
  }
}
