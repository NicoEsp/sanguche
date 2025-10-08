-- Fix security issue: Consolidate RLS policies on user_subscriptions
-- Remove all existing policies to avoid conflicts

-- Drop ALL existing policies
DROP POLICY IF EXISTS "Block all anonymous access to subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Require authentication for subscription access" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can create their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Users can update their own subscription" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
DROP POLICY IF EXISTS "Admins can update all subscriptions" ON public.user_subscriptions;

-- Create consolidated, clear security policies

-- Policy 1: Users can view ONLY their own subscription
CREATE POLICY "user_subscriptions_select_own"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy 2: Users can insert ONLY their own subscription
CREATE POLICY "user_subscriptions_insert_own"
ON public.user_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy 3: Users can update ONLY their own subscription
CREATE POLICY "user_subscriptions_update_own"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- Policy 4: Admins can view all subscriptions (for admin panel)
CREATE POLICY "user_subscriptions_select_admin"
ON public.user_subscriptions
FOR SELECT
TO authenticated
USING (is_admin());

-- Policy 5: Admins can update all subscriptions (for admin operations)
CREATE POLICY "user_subscriptions_update_admin"
ON public.user_subscriptions
FOR UPDATE
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Ensure RLS is enabled
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Add security documentation comment
COMMENT ON TABLE public.user_subscriptions IS 'SECURITY: Contains sensitive payment data (polar_subscription_id, polar_customer_id). RLS policies ensure only subscription owner and verified admins can access this data.';