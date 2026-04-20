
-- 1. Fix lesson_notes: drop permissive deny_anonymous and recreate as RESTRICTIVE
DROP POLICY IF EXISTS "lesson_notes_deny_anonymous" ON public.lesson_notes;

CREATE POLICY "lesson_notes_deny_anonymous"
ON public.lesson_notes
AS RESTRICTIVE
FOR ALL
TO public
USING (auth.uid() IS NOT NULL);

-- 2a. Fix downloadable_resources SELECT policies to respect access_level
DROP POLICY IF EXISTS "Authenticated users can view active downloadables" ON public.downloadable_resources;
DROP POLICY IF EXISTS "Public can view active downloadables" ON public.downloadable_resources;

-- Public/anon can only see public-level resources (none currently, but future-proof)
CREATE POLICY "Public can view public downloadables"
ON public.downloadable_resources
FOR SELECT
TO anon
USING (is_active = true AND access_level = 'public');

-- Authenticated users see public + authenticated resources, premium only if they have premium
CREATE POLICY "Authenticated users can view allowed downloadables"
ON public.downloadable_resources
FOR SELECT
TO authenticated
USING (
  is_active = true
  AND (
    access_level IN ('public', 'authenticated')
    OR (access_level = 'premium' AND public.has_active_premium())
    OR public.is_admin()
  )
);

-- 2b. Fix downloads storage bucket policy
DROP POLICY IF EXISTS "Authenticated users can download files" ON storage.objects;

CREATE POLICY "Authenticated users can download files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'downloads'
  AND (
    EXISTS (
      SELECT 1 FROM public.downloadable_resources dr
      WHERE dr.file_path = name
        AND dr.is_active = true
        AND (
          dr.access_level IN ('public', 'authenticated')
          OR (dr.access_level = 'premium' AND public.has_active_premium())
        )
    )
    OR public.is_admin()
  )
);

-- 3. Fix private-resources bucket: scope to user_dedicated_resources
DROP POLICY IF EXISTS "Premium users can view their accessible private resources" ON storage.objects;

CREATE POLICY "Users can view their dedicated private resources"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-resources'
  AND (
    EXISTS (
      SELECT 1 FROM public.user_dedicated_resources udr
      JOIN public.profiles p ON p.id = udr.user_id
      WHERE p.user_id = auth.uid()
        AND udr.file_url = name
    )
    OR public.is_admin()
  )
);

-- 4. Add admin-only SELECT policy for course_waitlist
CREATE POLICY "Admins can view course waitlist"
ON public.course_waitlist
FOR SELECT
TO authenticated
USING (public.is_admin());
