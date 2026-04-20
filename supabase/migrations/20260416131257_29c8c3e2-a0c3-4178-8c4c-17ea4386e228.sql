DROP POLICY IF EXISTS "Public can view public downloadables" ON public.downloadable_resources;

CREATE POLICY "Anon can view active downloadables metadata"
ON public.downloadable_resources
FOR SELECT
TO anon
USING (is_active = true);