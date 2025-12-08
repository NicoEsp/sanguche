-- Crear bucket para recursos del Starter Pack
INSERT INTO storage.buckets (id, name, public)
VALUES ('starterpack', 'starterpack', true)
ON CONFLICT (id) DO NOTHING;

-- Política: Cualquiera puede ver archivos del bucket (para recursos públicos)
CREATE POLICY "Anyone can view starterpack files"
ON storage.objects FOR SELECT
USING (bucket_id = 'starterpack');

-- Política: Solo admins pueden subir/modificar/eliminar archivos
CREATE POLICY "Admins can manage starterpack files"
ON storage.objects FOR ALL
USING (bucket_id = 'starterpack' AND public.is_admin())
WITH CHECK (bucket_id = 'starterpack' AND public.is_admin());