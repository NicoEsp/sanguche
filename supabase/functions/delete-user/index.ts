import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';
import { maskEmail, maskName } from '../_shared/pii.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface DeleteUserRequest {
  profileId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[delete-user] Request received');

    // SECURITY: Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[delete-user] Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's JWT for initial validation
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // Get current user from JWT
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('[delete-user] Failed to get user from JWT:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-user] Request from user: ${user.id}`);

    // SECURITY: Validate admin using is_admin_jwt() RPC
    const { data: isAdmin, error: adminError } = await supabaseClient.rpc('is_admin_jwt', {
      check_user_id: user.id
    });

    if (adminError || !isAdmin) {
      console.error('[delete-user] Admin validation failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Admin privileges required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('[delete-user] Admin validated successfully');

    // Parse request body
    const { profileId }: DeleteUserRequest = await req.json();

    if (!profileId || typeof profileId !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing profileId parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(profileId)) {
      return new Response(
        JSON.stringify({ error: 'Invalid profileId format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[delete-user] Attempting to delete profile: ${profileId}`);

    // Datos para el log de auditoría, en paralelo. El email sale de profiles
    // (lo sincroniza un trigger desde auth.users): antes se pedía a la función
    // get-admin-users, que listaba solo los primeros 50 usuarios, así que el
    // resto quedaba auditado sin email.
    const [
      { data: targetProfile, error: profileError },
      { data: subscription },
      { data: adminProfile },
    ] = await Promise.all([
      supabaseClient
        .from('profiles')
        .select('id, user_id, name, email')
        .eq('id', profileId)
        .single(),
      supabaseClient
        .from('user_subscriptions')
        .select('plan, status')
        .eq('user_id', profileId)
        .maybeSingle(),
      supabaseClient
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single(),
    ]);

    if (profileError || !targetProfile) {
      console.error('[delete-user] Target profile not found:', profileError);
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Prevent admin from deleting themselves
    if (targetProfile.user_id === user.id) {
      console.error('[delete-user] Admin attempted to delete themselves');
      return new Response(
        JSON.stringify({ error: 'Cannot delete your own account' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userEmail = targetProfile.email;

    console.log(`[delete-user] Target user info - Name: ${maskName(targetProfile.name)}, Email: ${maskEmail(userEmail)}`);

    // AUDIT: Log deletion action before performing it
    if (adminProfile) {
      const auditDetails = {
        deleted_user: {
          profile_id: targetProfile.id,
          auth_user_id: targetProfile.user_id,
          name: targetProfile.name,
          email: userEmail,
          subscription_plan: subscription?.plan || 'free',
          subscription_status: subscription?.status || 'active',
        },
        timestamp: new Date().toISOString(),
      };

      await supabaseClient.rpc('log_admin_action', {
        p_admin_user_id: adminProfile.id,
        p_target_user_id: targetProfile.id,
        p_action_type: 'user_deleted',
        p_details: auditDetails
      });
    }

    // DELETION: Use service role key to delete from auth.users
    // This will cascade to profiles and user_subscriptions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log(`[delete-user] Deleting auth user: ${targetProfile.user_id}`);

    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
      targetProfile.user_id
    );

    if (deleteError) {
      console.error('[delete-user] Failed to delete user:', deleteError);
      throw deleteError;
    }

    console.log('[delete-user] User deleted successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('[delete-user] Error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
