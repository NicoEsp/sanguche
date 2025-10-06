-- ============================================
-- SECURITY FIX: Strengthen user_subscriptions RLS policies
-- ============================================

-- Drop existing deny policy and recreate as RESTRICTIVE
DROP POLICY IF EXISTS "Deny anonymous access to subscriptions" ON public.user_subscriptions;

-- Create RESTRICTIVE policy to explicitly block all anonymous access
CREATE POLICY "Block all anonymous access to subscriptions"
ON public.user_subscriptions
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add additional RESTRICTIVE policy to ensure authenticated users are truly authenticated
CREATE POLICY "Require authentication for subscription access"
ON public.user_subscriptions
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Verify existing user policies are properly scoped (they already check user_id against profiles)
-- The following policies remain unchanged but are listed for reference:
-- "Users can view their own subscription" - SELECT with profile check
-- "Users can insert their own subscription" - INSERT with profile check  
-- "Users can update their own subscription" - UPDATE with profile check
-- "Admins can view all subscriptions" - SELECT for admins