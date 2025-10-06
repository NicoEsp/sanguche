-- Fix log_admin_action to get admin profile ID automatically
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_target_user_id uuid, 
  p_action_type text, 
  p_details jsonb DEFAULT NULL::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  log_id UUID;
  admin_profile_id UUID;
BEGIN
  -- Get admin's profile ID directly from auth.uid()
  SELECT id INTO admin_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();

  IF admin_profile_id IS NULL THEN
    RAISE EXCEPTION 'Admin profile not found for user %', auth.uid();
  END IF;

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
$function$;

-- Update admin_update_mentoria_status to use new log_admin_action signature
CREATE OR REPLACE FUNCTION public.admin_update_mentoria_status(
  p_target_profile_id uuid, 
  p_new_status boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;
  
  -- Update mentoria status
  UPDATE public.profiles
  SET mentoria_completed = p_new_status
  WHERE id = p_target_profile_id;
  
  -- Log action (admin_profile_id is now obtained automatically)
  PERFORM public.log_admin_action(
    p_target_profile_id,
    'mentoria_status_updated',
    jsonb_build_object('new_status', p_new_status)
  );
  
  RETURN jsonb_build_object('success', true, 'new_status', p_new_status);
END;
$function$;

-- Update admin_update_subscription to use new log_admin_action signature
CREATE OR REPLACE FUNCTION public.admin_update_subscription(
  p_target_profile_id uuid, 
  p_new_plan subscription_plan, 
  p_notes text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_old_plan subscription_plan;
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;
  
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
  
  -- Log admin action (admin_profile_id is now obtained automatically)
  PERFORM public.log_admin_action(
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
$function$;

-- Update admin_toggle_user_role to use new log_admin_action signature
CREATE OR REPLACE FUNCTION public.admin_toggle_user_role(
  p_target_profile_id uuid, 
  p_role app_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_role_exists BOOLEAN;
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;
  
  -- Check if role exists
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = p_target_profile_id AND role = p_role
  ) INTO v_role_exists;
  
  IF v_role_exists THEN
    -- Remove role
    DELETE FROM public.user_roles
    WHERE user_id = p_target_profile_id AND role = p_role;
    
    -- Log action (admin_profile_id is now obtained automatically)
    PERFORM public.log_admin_action(
      p_target_profile_id,
      'role_removed',
      jsonb_build_object('role', p_role)
    );
    
    RETURN jsonb_build_object('success', true, 'action', 'removed', 'role', p_role);
  ELSE
    -- Add role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (p_target_profile_id, p_role);
    
    -- Log action (admin_profile_id is now obtained automatically)
    PERFORM public.log_admin_action(
      p_target_profile_id,
      'role_added',
      jsonb_build_object('role', p_role)
    );
    
    RETURN jsonb_build_object('success', true, 'action', 'added', 'role', p_role);
  END IF;
END;
$function$;