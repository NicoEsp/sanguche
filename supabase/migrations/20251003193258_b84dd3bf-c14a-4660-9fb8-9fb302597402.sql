-- ============================================
-- SECURITY FIX: Restrict Assessment Deletion to Admins Only
-- ============================================

-- Add RESTRICTIVE policy to explicitly deny non-admin users from deleting assessments
CREATE POLICY "Restrict non-admin deletes on assessments"
ON public.assessments
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (is_admin());