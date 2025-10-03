-- Remove duplicate PERMISSIVE DELETE policy on assessments table
-- Keep the RESTRICTIVE policy which provides better security
DROP POLICY "Only admins can delete assessments" ON public.assessments;