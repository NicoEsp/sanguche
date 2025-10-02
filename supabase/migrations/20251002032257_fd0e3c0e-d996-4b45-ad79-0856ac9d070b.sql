-- SECURITY: Create server-side validation functions that cannot be bypassed
-- These replace client-side checks that can be manipulated via localStorage

-- 1. is_admin() - Validates admin role from user_roles table (not JWT)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_profile_id UUID;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO current_user_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF current_user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has admin role in user_roles table
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = current_user_profile_id
      AND role = 'admin'
  );
END;
$$;

-- 2. has_active_premium() - Validates active premium subscription
CREATE OR REPLACE FUNCTION public.has_active_premium()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_profile_id UUID;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO current_user_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF current_user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has active premium subscription
  RETURN EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = current_user_profile_id
      AND plan = 'premium'
      AND status = 'active'
  );
END;
$$;

-- 3. admin_update_subscription() - Secure RPC for subscription updates
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  p_target_profile_id UUID,
  p_new_plan subscription_plan,
  p_notes TEXT DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_profile_id UUID;
  v_old_plan subscription_plan;
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;
  
  -- Get admin's profile ID for logging
  SELECT id INTO v_admin_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Get current plan
  SELECT plan INTO v_old_plan
  FROM public.user_subscriptions
  WHERE user_id = p_target_profile_id;
  
  -- Update subscription
  UPDATE public.user_subscriptions
  SET 
    plan = p_new_plan,
    status = 'active',
    updated_at = now()
  WHERE user_id = p_target_profile_id;
  
  -- Log admin action
  PERFORM public.log_admin_action(
    v_admin_profile_id,
    p_target_profile_id,
    'plan_upgrade',
    jsonb_build_object(
      'old_plan', v_old_plan,
      'new_plan', p_new_plan,
      'notes', p_notes
    )
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'old_plan', v_old_plan,
    'new_plan', p_new_plan
  );
END;
$$;

-- 4. admin_toggle_user_role() - Secure RPC for role management
CREATE OR REPLACE FUNCTION public.admin_toggle_user_role(
  p_target_profile_id UUID,
  p_role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_profile_id UUID;
  v_role_exists BOOLEAN;
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;
  
  -- Get admin's profile ID for logging
  SELECT id INTO v_admin_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Check if role exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_target_profile_id AND role = p_role
  ) INTO v_role_exists;
  
  IF v_role_exists THEN
    -- Remove role
    DELETE FROM public.user_roles
    WHERE user_id = p_target_profile_id AND role = p_role;
    
    -- Log action
    PERFORM public.log_admin_action(
      v_admin_profile_id,
      p_target_profile_id,
      'role_removed',
      jsonb_build_object('role', p_role)
    );
    
    RETURN jsonb_build_object('success', true, 'action', 'removed', 'role', p_role);
  ELSE
    -- Add role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_target_profile_id, p_role);
    
    -- Log action
    PERFORM public.log_admin_action(
      v_admin_profile_id,
      p_target_profile_id,
      'role_added',
      jsonb_build_object('role', p_role)
    );
    
    RETURN jsonb_build_object('success', true, 'action', 'added', 'role', p_role);
  END IF;
END;
$$;

-- 5. admin_update_mentoria_status() - Secure RPC for mentoria status
CREATE OR REPLACE FUNCTION public.admin_update_mentoria_status(
  p_target_profile_id UUID,
  p_new_status BOOLEAN
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_profile_id UUID;
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;
  
  -- Get admin's profile ID for logging
  SELECT id INTO v_admin_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Update mentoria status
  UPDATE public.profiles
  SET mentoria_completed = p_new_status
  WHERE id = p_target_profile_id;
  
  -- Log action
  PERFORM public.log_admin_action(
    v_admin_profile_id,
    p_target_profile_id,
    'mentoria_status_updated',
    jsonb_build_object('new_status', p_new_status)
  );
  
  RETURN jsonb_build_object('success', true, 'new_status', p_new_status);
END;
$$;