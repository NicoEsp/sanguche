-- Add DELETE policy for assessments table
-- Only admins can delete assessments to preserve user evaluation history
CREATE POLICY "Only admins can delete assessments"
ON assessments FOR DELETE
TO authenticated
USING (is_admin());