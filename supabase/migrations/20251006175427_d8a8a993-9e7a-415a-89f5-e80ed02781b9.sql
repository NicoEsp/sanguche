-- Fix assessments INSERT policy
-- The issue: is_assessment_owner() can't validate ownership during INSERT because the row doesn't exist yet
-- Solution: Directly verify the user_id matches the authenticated user's profile

DROP POLICY IF EXISTS "assessments_insert_own" ON public.assessments;

CREATE POLICY "assessments_insert_own"
ON public.assessments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
  AND auth.uid() IS NOT NULL
);

-- Add comment explaining the fix
COMMENT ON POLICY "assessments_insert_own" ON public.assessments IS 
'Allows authenticated users to insert assessments only for their own profile. 
Direct validation avoids recursive RLS issues that would occur with is_assessment_owner() during INSERT.';