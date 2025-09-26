-- Revoke all permissions from anon role on assessments table
REVOKE ALL ON public.assessments FROM anon;

-- Add explicit deny policy for unauthenticated users
DROP POLICY IF EXISTS "Deny anonymous access to assessments" ON public.assessments;
CREATE POLICY "Deny anonymous access to assessments" 
ON public.assessments 
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);

-- Ensure authenticated users can only access their own assessments or shared ones
DROP POLICY IF EXISTS "Users can view their own assessments" ON public.assessments;
CREATE POLICY "Users can view their own assessments" 
ON public.assessments 
FOR SELECT 
TO authenticated
USING (
  user_id IN (
    SELECT profiles.id 
    FROM profiles 
    WHERE profiles.user_id = auth.uid()
  )
);

-- Keep the LinkedIn share policy but make it more restrictive - authenticated users only
DROP POLICY IF EXISTS "Anonymous users can view assessments via linkedin share" ON public.assessments;
CREATE POLICY "Authenticated users can view shared assessments via linkedin" 
ON public.assessments 
FOR SELECT 
TO authenticated
USING (
  id IN (
    SELECT linkedin_shares.assessment_id
    FROM linkedin_shares
    WHERE linkedin_shares.access_expires_at > now()
  )
);

-- Add audit logging function for assessment access
CREATE OR REPLACE FUNCTION public.log_assessment_access()
RETURNS TRIGGER AS $$
BEGIN
  -- Log assessment access for security monitoring
  IF TG_OP = 'SELECT' THEN
    PERFORM public.log_security_event(
      auth.uid(),
      'assessment_viewed',
      'assessment',
      NEW.id,
      inet_client_addr(),
      current_setting('request.headers', true)::json->>'user-agent'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;