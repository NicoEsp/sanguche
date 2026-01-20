-- Permitir que usuarios anónimos lean cursos publicados para el sitemap
-- Esto es seguro porque solo expone información ya pública (slug, updated_at)
CREATE POLICY "courses_public_select_published" 
ON public.courses 
FOR SELECT 
TO anon
USING (status IN ('published', 'coming_soon'));