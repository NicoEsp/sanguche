-- ============================================
-- SECURITY FIX: Admin Assessment Access & Enhanced Log Protection
-- ============================================

-- 1. Allow admins to view all assessments (fixes permission denied errors)
CREATE POLICY "Admins can view all assessments"
ON public.assessments
FOR SELECT
USING (is_admin());

-- 2. Add explicit RESTRICTIVE policy for admin_actions_log to prevent non-admin access
CREATE POLICY "Deny non-admin authenticated users from admin logs"
ON public.admin_actions_log
AS RESTRICTIVE
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());