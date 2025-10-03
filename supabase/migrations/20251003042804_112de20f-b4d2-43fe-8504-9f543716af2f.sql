-- SECURITY FIX: Block anonymous access to subscription data
-- This prevents hackers from querying sensitive billing information

CREATE POLICY "Deny anonymous access to subscriptions"
ON public.user_subscriptions
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);