import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { resourceId } = await req.json();
    if (!resourceId) {
      throw new Error('Missing resourceId parameter');
    }

    // Get resource details
    const { data: resource, error: resourceError } = await supabase
      .from('resources')
      .select('*')
      .eq('id', resourceId)
      .eq('is_active', true)
      .single();

    if (resourceError || !resource) {
      throw new Error('Resource not found');
    }

    // Check access level
    if (resource.access_level === 'premium') {
      // Verify user has premium subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile) {
        throw new Error('Profile not found');
      }

      const { data: subscription } = await supabase
        .from('user_subscriptions')
        .select('plan, status')
        .eq('user_id', profile.id)
        .single();

      if (!subscription || subscription.plan !== 'premium' || subscription.status !== 'active') {
        throw new Error('Premium subscription required');
      }
    }

    // Generate signed URL (24 hours)
    const { data: signedData, error: signError } = await supabase.storage
      .from(resource.bucket_name)
      .createSignedUrl(resource.file_url, 86400);

    if (signError) {
      console.error('Error creating signed URL:', signError);
      throw new Error('Failed to generate access URL');
    }

    console.log(`[SUCCESS] Generated signed URL for resource ${resourceId} - user ${user.id}`);

    return new Response(
      JSON.stringify({ signedUrl: signedData.signedUrl }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[ERROR] get-resource-access:', error);
    
    return new Response(
      JSON.stringify({ error: 'Error al acceder al recurso' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    );
  }
});
