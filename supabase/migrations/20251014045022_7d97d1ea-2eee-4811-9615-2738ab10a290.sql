-- Add restrictive policy to deny anonymous access to progress_objectives
-- This protects proprietary learning curriculum from competitors

CREATE POLICY "progress_objectives_deny_anonymous" 
ON public.progress_objectives 
AS RESTRICTIVE 
FOR ALL 
USING (auth.uid() IS NOT NULL);