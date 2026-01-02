-- Add RLS policy for checkout_rate_limit table
-- This table is only accessed by edge functions using service role key
-- Regular users should NOT have any access to this table

CREATE POLICY "Service role manages rate limits"
ON public.checkout_rate_limit
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');