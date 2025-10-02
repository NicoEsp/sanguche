import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

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
    console.log('[get-admin-users] Starting request');

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[get-admin-users] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with user's JWT
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // SECURITY: Verify caller is admin using is_admin_jwt()
    const { data: isAdminData, error: adminCheckError } = await supabaseClient.rpc('is_admin_jwt');
    
    if (adminCheckError) {
      console.error('[get-admin-users] Admin check error:', adminCheckError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin validation failed' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!isAdminData) {
      console.warn('[get-admin-users] Unauthorized access attempt');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[get-admin-users] Admin validated, fetching user emails');

    // Create admin client using service role key
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all auth users
    const { data: authUsers, error: usersError } = await adminClient.auth.admin.listUsers();
    
    if (usersError) {
      console.error('[get-admin-users] Error fetching users:', usersError);
      return new Response(
        JSON.stringify({ error: 'Error fetching users' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Extract only necessary data (user_id and email)
    const userEmails = authUsers.users.map(user => ({
      user_id: user.id,
      email: user.email,
    }));

    console.log(`[get-admin-users] Successfully fetched ${userEmails.length} user emails`);

    return new Response(
      JSON.stringify({ users: userEmails }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[get-admin-users] Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
