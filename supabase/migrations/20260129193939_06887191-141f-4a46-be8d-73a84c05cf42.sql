-- =============================================
-- FIX 1: course-thumbnails storage bucket
-- Restrict to admin-only access, keep public read
-- =============================================

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can manage course thumbnails" ON storage.objects;

-- Drop existing policies to recreate with proper config
DROP POLICY IF EXISTS "Admins can manage course thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public can view course thumbnails" ON storage.objects;

-- Create admin-only management policy
CREATE POLICY "Admins can manage course thumbnails"
ON storage.objects
FOR ALL
USING (bucket_id = 'course-thumbnails' AND public.is_admin())
WITH CHECK (bucket_id = 'course-thumbnails' AND public.is_admin());

-- Keep public read access for displaying thumbnails
CREATE POLICY "Public can view course thumbnails"
ON storage.objects
FOR SELECT
USING (bucket_id = 'course-thumbnails');

-- =============================================
-- FIX 2: payment_webhook_logs INSERT policy
-- Restrict to service_role only
-- =============================================

-- Drop the overly permissive INSERT policy
DROP POLICY IF EXISTS "Service role can insert webhook logs" ON public.payment_webhook_logs;

-- Create service_role only INSERT policy
CREATE POLICY "Service role can insert webhook logs" 
ON public.payment_webhook_logs 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- =============================================
-- FIX 3: assessments conflicting policies
-- Remove the policy with (false) condition that blocks all access
-- =============================================

-- Drop the conflicting policy that always denies
DROP POLICY IF EXISTS "assessments_deny_anonymous_access" ON public.assessments;