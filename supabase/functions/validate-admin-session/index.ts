import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

interface AdminValidationResponse {
  isAdmin: boolean;
  validationToken: string;
  expiresAt: number;
  userId?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token from request
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
      return new Response(
        JSON.stringify({ 
          isAdmin: false, 
          error: 'No authorization header',
          validationToken: '',
          expiresAt: 0
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get user from token
    const { data: { user }, error: userError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (userError || !user) {
      console.error('❌ Invalid token or user not found:', userError);
      return new Response(
        JSON.stringify({ 
          isAdmin: false, 
          error: 'Invalid token',
          validationToken: '',
          expiresAt: 0
        }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const clientIP = req.headers.get('x-forwarded-for') || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    const userAgent = req.headers.get('user-agent') || 'unknown';

    console.log(`🔐 Admin validation request from user: ${user.id}, IP: ${clientIP}`);

    // Direct database query to check admin role - BYPASS RLS
    const { data: adminCheck, error: adminError } = await supabase
      .from('user_roles')
      .select('role, user_id, profiles!inner(user_id)')
      .eq('profiles.user_id', user.id)
      .eq('role', 'admin')
      .single();

    const isAdmin = !adminError && adminCheck !== null;

    // Generate validation token (server-side only)
    const validationToken = isAdmin 
      ? `admin_${user.id}_${Date.now()}_${crypto.randomUUID()}`
      : '';
    
    // Token expires in 2 minutes
    const expiresAt = isAdmin ? Date.now() + (2 * 60 * 1000) : 0;

    // Log security event
    if (isAdmin) {
      await supabase.from('security_audit').insert({
        user_id: user.id,
        action: 'admin_validation_success',
        resource_type: 'admin_access',
        ip_address: clientIP,
        user_agent: userAgent,
      });
      console.log(`✅ Admin validation SUCCESS for user: ${user.id}`);
    } else {
      await supabase.from('security_audit').insert({
        user_id: user.id,
        action: 'admin_validation_failed',
        resource_type: 'admin_access',
        ip_address: clientIP,
        user_agent: userAgent,
      });
      console.log(`⚠️ Admin validation FAILED for user: ${user.id}`);
    }

    const response: AdminValidationResponse = {
      isAdmin,
      validationToken,
      expiresAt,
      userId: user.id,
    };

    return new Response(
      JSON.stringify(response),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('❌ Unexpected error in validate-admin-session:', error);
    return new Response(
      JSON.stringify({ 
        isAdmin: false, 
        error: 'Internal server error',
        validationToken: '',
        expiresAt: 0
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
