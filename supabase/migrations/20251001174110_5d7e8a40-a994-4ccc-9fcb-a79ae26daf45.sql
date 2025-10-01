-- SECURITY: Reforzar políticas RLS para storage buckets

-- Asegurar que private-resources solo sea accesible por usuarios autenticados con permisos
-- Las políticas para private-resources deben ser más restrictivas

-- Política para leer archivos privados: solo usuarios premium con permisos específicos
CREATE POLICY "Premium users can view their accessible private resources"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'private-resources' 
  AND auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM public.user_subscriptions us
    JOIN public.profiles p ON p.id = us.user_id
    WHERE p.user_id = auth.uid()
    AND us.plan = 'premium'
    AND us.status = 'active'
  )
);

-- Solo admins pueden subir archivos al bucket privado
CREATE POLICY "Only admins can upload to private resources"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'private-resources'
  AND public.is_admin_jwt()
);

-- Solo admins pueden actualizar archivos privados
CREATE POLICY "Only admins can update private resources"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'private-resources'
  AND public.is_admin_jwt()
);

-- Solo admins pueden eliminar archivos privados
CREATE POLICY "Only admins can delete private resources"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'private-resources'
  AND public.is_admin_jwt()
);

-- SECURITY: Añadir índices para mejorar rendimiento de queries de seguridad
CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user_plan_status 
ON public.user_subscriptions(user_id, plan, status);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id 
ON public.profiles(user_id);

-- SECURITY: Añadir constraint para asegurar que los nombres son válidos
-- (esto ayuda a prevenir inyección y datos inválidos)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'check_name_length' 
    AND conrelid = 'public.profiles'::regclass
  ) THEN
    ALTER TABLE public.profiles 
    ADD CONSTRAINT check_name_length 
    CHECK (name IS NULL OR length(name) <= 255);
  END IF;
END $$;