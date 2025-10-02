-- Drop existing permissive policies on admin_actions_log
DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.admin_actions_log;
DROP POLICY IF EXISTS "Service role and admins can insert audit logs" ON public.admin_actions_log;

-- Create RESTRICTIVE policy to deny all anonymous access
CREATE POLICY "Deny anonymous access to admin logs"
ON public.admin_actions_log
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Create policy allowing only admins to view audit logs
CREATE POLICY "Only admins can view audit logs"
ON public.admin_actions_log
FOR SELECT
TO authenticated
USING (public.is_admin_jwt());

-- Create policy allowing admins and service role to insert audit logs
CREATE POLICY "Only admins and service role can insert audit logs"
ON public.admin_actions_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_jwt() OR auth.role() = 'service_role');

-- Ensure no other operations are allowed (UPDATE, DELETE)
-- By not creating policies for these operations, they are implicitly denied