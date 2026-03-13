const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Lemon Squeezy variant IDs for each plan (from lemon-squeezy-checkout)
const VARIANT_IDS = {
  premium: '1071322',
  repremium: '1170898',
  curso_estrategia: '1170897',
  cursos_all: '1170900',
};

// Fallback prices in case API fails (all in ARS)
const FALLBACK_PRICES = {
  premium: { amount: 5000000, formatted: '$ 50.000', currency: 'ARS' },
  repremium: { amount: 12000000, formatted: '$ 120.000', currency: 'ARS' },
  curso_estrategia: { amount: 4900000, formatted: '$ 49.000', currency: 'ARS' },
  cursos_all: { amount: 7500000, formatted: '$ 75.000', currency: 'ARS' },
};

// In-memory cache
let cachedPricing: any = null;
let cacheTimestamp = 0;
const CACHE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

interface VariantPricing {
  amount: number;
  formatted: string;
  currency: string;
}

function formatPrice(priceInCents: number): string {
  // All prices are in ARS cents
  const amount = priceInCents / 100;
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

async function fetchVariantPrice(variantId: string, apiKey: string): Promise<VariantPricing | null> {
  try {
    const response = await fetch(`https://api.lemonsqueezy.com/v1/variants/${variantId}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Accept': 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    });

    if (!response.ok) {
      console.error(`Failed to fetch variant ${variantId}:`, response.status);
      return null;
    }

    const data = await response.json();
    const priceInCents = data.data?.attributes?.price || 0;
    
    console.log(`Variant ${variantId} price:`, priceInCents, 'cents');
    
    return {
      amount: priceInCents,
      formatted: formatPrice(priceInCents),
      currency: 'ARS', // Store is configured in ARS
    };
  } catch (error) {
    console.error(`Error fetching variant ${variantId}:`, error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Pricing config requested');

    const now = Date.now();
    
    // Return cached data if still valid
    if (cachedPricing && (now - cacheTimestamp) < CACHE_DURATION_MS) {
      console.log('Returning cached pricing');
      return new Response(
        JSON.stringify(cachedPricing),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Cache-Control': 'public, max-age=300'
          }
        }
      );
    }

    const apiKey = Deno.env.get('LEMON_SQUEEZY_API_KEY');
    
    if (!apiKey) {
      console.warn('LEMON_SQUEEZY_API_KEY not set, using fallback prices');
      return new Response(
        JSON.stringify({
          plans: FALLBACK_PRICES,
          lastUpdated: new Date().toISOString(),
          source: 'fallback'
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          }
        }
      );
    }

    // Fetch all variant prices in parallel
    const [premium, repremium, cursoEstrategia, cursosAll] = await Promise.all([
      fetchVariantPrice(VARIANT_IDS.premium, apiKey),
      fetchVariantPrice(VARIANT_IDS.repremium, apiKey),
      fetchVariantPrice(VARIANT_IDS.curso_estrategia, apiKey),
      fetchVariantPrice(VARIANT_IDS.cursos_all, apiKey),
    ]);

    const plans = {
      premium: premium || FALLBACK_PRICES.premium,
      repremium: repremium || FALLBACK_PRICES.repremium,
      curso_estrategia: cursoEstrategia || FALLBACK_PRICES.curso_estrategia,
      cursos_all: cursosAll || FALLBACK_PRICES.cursos_all,
    };

    const response = {
      plans,
      lastUpdated: new Date().toISOString(),
      source: 'lemonsqueezy'
    };

    // Update cache
    cachedPricing = response;
    cacheTimestamp = now;

    console.log('Returning pricing from Lemon Squeezy:', JSON.stringify(plans, null, 2));

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300'
        }
      }
    );
  } catch (error) {
    console.error('Error in pricing-config:', error);
    
    // Return fallback on error
    return new Response(
      JSON.stringify({
        plans: FALLBACK_PRICES,
        lastUpdated: new Date().toISOString(),
        source: 'fallback',
        error: (error as Error).message
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
