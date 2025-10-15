-- Remove the vulnerable policy that allows users to update their own subscriptions
-- This prevents users from manipulating subscription status, plan, trial periods, or payment IDs
DROP POLICY IF EXISTS "user_subscriptions_update_own" ON public.user_subscriptions;

-- Subscriptions can now only be modified by:
-- 1. Admins (via user_subscriptions_update_admin policy)
-- 2. Service role (via backend edge functions)
-- This ensures all subscription changes go through proper server-side validation