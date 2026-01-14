-- Permitir a usuarios anónimos ver recursos activos de descargables
CREATE POLICY "Public can view active downloadables"
ON public.downloadable_resources FOR SELECT
TO anon
USING (is_active = true);