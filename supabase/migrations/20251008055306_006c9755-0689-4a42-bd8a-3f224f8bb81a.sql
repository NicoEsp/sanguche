-- ============================================================================
-- SECURITY FIX: Remove user self-subscription vulnerability
-- ============================================================================
-- CRITICAL: Users should NEVER be able to create their own subscriptions
-- Only service_role (triggers/webhooks) and admins can create subscriptions

-- 1. Remove dangerous policy that allows users to insert subscriptions
DROP POLICY IF EXISTS "user_subscriptions_insert_own" ON public.user_subscriptions;

-- Add security documentation
COMMENT ON TABLE public.user_subscriptions IS 
'SECURITY: Subscriptions can only be created by:
1. Trigger handle_new_user() (creates free plan on signup)
2. Polar webhook (activates premium on payment)
3. Admin function admin_update_subscription()
Users cannot insert their own subscriptions to prevent self-service premium upgrades.';

-- ============================================================================
-- SECURITY IMPROVEMENT: Refactor confusing anonymous denial policies
-- ============================================================================
-- Replace 'USING (false)' pattern with explicit authentication checks
-- This is more maintainable and follows Supabase best practices

-- 2. Refactor profiles table policies
DROP POLICY IF EXISTS "Deny all anonymous access to profiles" ON public.profiles;

CREATE POLICY "profiles_require_authentication"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

COMMENT ON POLICY "profiles_require_authentication" ON public.profiles IS
'RESTRICTIVE policy: Ensures ALL operations require authentication.
This policy is evaluated in addition to permissive policies with AND logic.';

-- 3. Refactor admin_actions_log table policies  
DROP POLICY IF EXISTS "Deny anonymous access to admin logs" ON public.admin_actions_log;

CREATE POLICY "admin_logs_require_authentication"
ON public.admin_actions_log
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

COMMENT ON POLICY "admin_logs_require_authentication" ON public.admin_actions_log IS
'RESTRICTIVE policy: Ensures ALL operations require authentication.
Combined with admin-only policies to prevent anonymous access.';
