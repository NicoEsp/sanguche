-- ============================================
-- SECURITY FIX: Restrict resources access based on access_level
-- ============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Anyone can view active resources" ON public.resources;

-- Create granular access policies based on access_level field

-- 1. Public resources: Anyone can view (anonymous + authenticated)
CREATE POLICY "Public resources are viewable by everyone"
ON public.resources
FOR SELECT
USING (
  is_active = true 
  AND access_level = 'public'
);

-- 2. Authenticated resources: Only logged-in users
CREATE POLICY "Authenticated resources require login"
ON public.resources
FOR SELECT
USING (
  is_active = true 
  AND access_level = 'authenticated'
  AND auth.uid() IS NOT NULL
);

-- 3. Premium resources: Only users with active premium subscription
CREATE POLICY "Premium resources require active subscription"
ON public.resources
FOR SELECT
USING (
  is_active = true 
  AND access_level = 'premium'
  AND auth.uid() IS NOT NULL
  AND public.has_active_premium()
);

-- ============================================
-- ADDITIONAL SECURITY FIXES
-- ============================================

-- Add explicit anonymous denial for profiles table
CREATE POLICY "Deny all anonymous access to profiles"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add explicit anonymous denial for assessments table (redundant but explicit)
CREATE POLICY "Strengthen anonymous denial for assessments"
ON public.assessments
FOR ALL
TO anon
USING (false)
WITH CHECK (false);