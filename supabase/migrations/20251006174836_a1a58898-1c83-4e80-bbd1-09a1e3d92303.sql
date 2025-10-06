-- Security Enhancement for assessments table
-- This migration adds stronger RLS protection using security definer functions

-- 1. Create security definer function to check assessment ownership
CREATE OR REPLACE FUNCTION public.is_assessment_owner(assessment_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_profile_id UUID;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO current_user_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  -- Check if the assessment belongs to current user
  RETURN (assessment_user_id = current_user_profile_id);
END;
$$;

-- 2. Drop existing redundant policies
DROP POLICY IF EXISTS "Deny anonymous access to assessments" ON public.assessments;
DROP POLICY IF EXISTS "Strengthen anonymous denial for assessments" ON public.assessments;
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Users can create assessments" ON public.assessments;
DROP POLICY IF EXISTS "Users can update their own assessments" ON public.assessments;
DROP POLICY IF EXISTS "Restrict non-admin deletes on assessments" ON public.assessments;

-- 3. Create consolidated, more secure policies

-- Block ALL anonymous access (no auth.uid())
CREATE POLICY "assessments_deny_anonymous"
ON public.assessments
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- Users can SELECT only their own assessments
CREATE POLICY "assessments_select_own"
ON public.assessments
FOR SELECT
TO authenticated
USING (
  public.is_assessment_owner(user_id)
  OR public.is_admin()
);

-- Users can INSERT only for themselves
CREATE POLICY "assessments_insert_own"
ON public.assessments
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_assessment_owner(user_id)
  AND auth.uid() IS NOT NULL
);

-- Users can UPDATE only their own assessments
CREATE POLICY "assessments_update_own"
ON public.assessments
FOR UPDATE
TO authenticated
USING (public.is_assessment_owner(user_id))
WITH CHECK (public.is_assessment_owner(user_id));

-- Only admins can DELETE assessments
CREATE POLICY "assessments_delete_admin_only"
ON public.assessments
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 4. Add comment documenting security considerations
COMMENT ON TABLE public.assessments IS 
'Contains user assessment data. Uses security definer functions for ownership validation. 
SECURITY NOTE: Consider encrypting sensitive JSONB fields (assessment_result, assessment_values) 
at the application level before storing for additional data protection.';