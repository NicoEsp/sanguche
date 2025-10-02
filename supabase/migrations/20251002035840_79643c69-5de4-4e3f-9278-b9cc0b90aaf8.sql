-- SECURITY REMEDIATION: Unify admin system to use only user_roles table
-- Remove JWT-based admin functions and update all references

-- 1. First, update all storage policies to use is_admin()
DROP POLICY IF EXISTS "Admins can upload resource files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update resource files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete resource files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can upload to private resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can update private resources" ON storage.objects;
DROP POLICY IF EXISTS "Admins can delete private resources" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can upload to private resources" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can update private resources" ON storage.objects;
DROP POLICY IF EXISTS "Only admins can delete private resources" ON storage.objects;

CREATE POLICY "Admins can upload resource files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'resources' AND
  public.is_admin()
);

CREATE POLICY "Admins can update resource files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'resources' AND
  public.is_admin()
);

CREATE POLICY "Admins can delete resource files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'resources' AND
  public.is_admin()
);

CREATE POLICY "Admins can upload to private resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'private-resources' AND
  public.is_admin()
);

CREATE POLICY "Admins can update private resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'private-resources' AND
  public.is_admin()
);

CREATE POLICY "Admins can delete private resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'private-resources' AND
  public.is_admin()
);

-- 2. Update RLS policies on all tables to use is_admin()
DROP POLICY IF EXISTS "Only admins can view audit logs" ON public.admin_actions_log;
DROP POLICY IF EXISTS "Only admins and service role can insert audit logs" ON public.admin_actions_log;

CREATE POLICY "Only admins can view audit logs"
ON public.admin_actions_log
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Only admins and service role can insert audit logs"
ON public.admin_actions_log
FOR INSERT
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;

CREATE POLICY "Admins can manage all resources"
ON public.resources
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Only admins can access security audit logs" ON public.security_audit;
DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.security_audit;

CREATE POLICY "Only admins can access security audit logs"
ON public.security_audit
FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Service role can insert audit logs"
ON public.security_audit
FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR public.is_admin());

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;

CREATE POLICY "Admins can view all subscriptions"
ON public.user_subscriptions
FOR SELECT
USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view all exercise requests" ON public.exercise_requests;

CREATE POLICY "Admins can view all exercise requests"
ON public.exercise_requests
FOR ALL
USING (public.is_admin());

-- 3. Now drop JWT-based admin functions
DROP FUNCTION IF EXISTS public.is_admin_jwt(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.set_admin_role(text) CASCADE;
DROP FUNCTION IF EXISTS public.remove_admin_role(text) CASCADE;

-- 4. Update log_admin_action to use is_admin() instead of is_admin_jwt()
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id uuid,
  p_target_user_id uuid,
  p_action_type text,
  p_details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
  admin_profile_id UUID;
BEGIN
  -- Get admin's profile ID
  SELECT id INTO admin_profile_id
  FROM public.profiles
  WHERE user_id = p_admin_user_id;

  -- SECURITY: Verify admin status using user_roles table
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  INSERT INTO public.admin_actions_log (
    admin_user_id,
    target_user_id,
    action_type,
    details
  ) VALUES (
    admin_profile_id,
    p_target_user_id,
    p_action_type,
    p_details
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- SECURITY NOTE: This migration removes all JWT-based admin validation
-- All admin checks now use ONLY the user_roles table
-- To create the first admin, use: SELECT public.bootstrap_first_admin('[user_id]');