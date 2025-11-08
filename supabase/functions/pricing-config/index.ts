const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Pricing config requested');

    // Get pricing from environment variables with defaults
    const currency = Deno.env.get('PRICING_CURRENCY') || 'ARS';
    const amount = parseInt(Deno.env.get('PRICING_AMOUNT') || '50000');

    // Format the price
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

    const response = {
      currency,
      amount,
      formatted,
      lastUpdated: new Date().toISOString()
    };

    console.log('Returning pricing:', response);

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0'
        }
      }
    );
  } catch (error) {
    console.error('Error in pricing-config:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
