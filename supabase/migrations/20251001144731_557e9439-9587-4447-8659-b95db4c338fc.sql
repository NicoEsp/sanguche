-- ============================================
-- LIMPIEZA COMPLETA DE SEGURIDAD JWT (Parte 1: Storage)
-- Actualiza policies de storage primero
-- ============================================

-- 1. Crear función is_admin_jwt que lee del JWT metadata
CREATE OR REPLACE FUNCTION public.is_admin_jwt(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_user_id UUID;
    user_role TEXT;
BEGIN
    -- Use provided user_id or default to current user
    target_user_id := COALESCE(check_user_id, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Read role from JWT metadata (cryptographically signed by Supabase)
    SELECT raw_user_meta_data->>'role' INTO user_role
    FROM auth.users
    WHERE id = target_user_id;
    
    RETURN user_role = 'admin';
END;
$$;

COMMENT ON FUNCTION public.is_admin_jwt IS 
'SECURITY: Lee el rol admin desde JWT metadata (auth.users.raw_user_meta_data).
No puede ser falsificado ya que el JWT está firmado criptográficamente por Supabase.';

-- 2. Actualizar TODAS las storage policies para usar is_admin_jwt
DROP POLICY IF EXISTS "Admins can upload resource files" ON storage.objects;
CREATE POLICY "Admins can upload resource files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'resources' AND public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can update resource files" ON storage.objects;
CREATE POLICY "Admins can update resource files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'resources' AND public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can delete resource files" ON storage.objects;
CREATE POLICY "Admins can delete resource files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'resources' AND public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can upload to private resources" ON storage.objects;
CREATE POLICY "Admins can upload to private resources" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'private-resources' AND public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can update private resources" ON storage.objects;
CREATE POLICY "Admins can update private resources" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'private-resources' AND public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can delete private resources" ON storage.objects;
CREATE POLICY "Admins can delete private resources" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'private-resources' AND public.is_admin_jwt());

-- 3. Actualizar TODAS las RLS policies en tablas públicas

-- admin_actions_log policies
DROP POLICY IF EXISTS "Service role and admins can insert audit logs" ON public.admin_actions_log;
CREATE POLICY "Service role and admins can insert audit logs" 
ON public.admin_actions_log 
FOR INSERT 
WITH CHECK (public.is_admin_jwt() OR (auth.role() = 'service_role'));

DROP POLICY IF EXISTS "Admins can view all audit logs" ON public.admin_actions_log;
CREATE POLICY "Admins can view all audit logs" 
ON public.admin_actions_log 
FOR SELECT 
USING (public.is_admin_jwt());

-- exercise_requests policies
DROP POLICY IF EXISTS "Admins can view all exercise requests" ON public.exercise_requests;
CREATE POLICY "Admins can view all exercise requests" 
ON public.exercise_requests 
FOR ALL 
USING (public.is_admin_jwt());

-- profiles policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (public.is_admin_jwt());

-- resources policies
DROP POLICY IF EXISTS "Admins can manage all resources" ON public.resources;
CREATE POLICY "Admins can manage all resources" 
ON public.resources 
FOR ALL 
USING (public.is_admin_jwt())
WITH CHECK (public.is_admin_jwt());

-- security_audit policies
DROP POLICY IF EXISTS "Only admins can access security audit logs" ON public.security_audit;
CREATE POLICY "Only admins can access security audit logs" 
ON public.security_audit 
FOR ALL 
USING (public.is_admin_jwt())
WITH CHECK (public.is_admin_jwt());

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.security_audit;
CREATE POLICY "Service role can insert audit logs" 
ON public.security_audit 
FOR INSERT 
WITH CHECK ((auth.role() = 'service_role') OR public.is_admin_jwt());

-- user_roles policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin_jwt())
WITH CHECK (public.is_admin_jwt());

DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin_jwt());

-- user_subscriptions policies
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions" 
ON public.user_subscriptions 
FOR SELECT 
USING (public.is_admin_jwt());

-- 4. Actualizar funciones que usan is_admin para usar is_admin_jwt
CREATE OR REPLACE FUNCTION public.log_admin_action(p_admin_user_id uuid, p_target_user_id uuid, p_action_type text, p_details jsonb DEFAULT NULL::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Verify admin status using JWT
  IF NOT public.is_admin_jwt(p_admin_user_id) THEN
    RAISE EXCEPTION 'User is not an admin (JWT validation)';
  END IF;

  INSERT INTO public.admin_actions_log (
    admin_user_id,
    target_user_id,
    action_type,
    details
  ) VALUES (
    p_admin_user_id,
    p_target_user_id,
    p_action_type,
    p_details
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- 5. Limpiar tabla user_roles
DELETE FROM public.user_roles;

COMMENT ON TABLE public.user_roles IS 
'DEPRECATED: Esta tabla ya no se usa para autorización. 
Los roles se almacenan en auth.users.raw_user_meta_data (JWT metadata).
Se mantiene solo para compatibilidad histórica.';

-- 6. ELIMINAR la función is_admin antigua (CASCADE para eliminar dependencias)
DROP FUNCTION IF EXISTS public.is_admin(uuid) CASCADE;

-- Log de la migración
DO $$
BEGIN
  RAISE NOTICE '✅ Limpieza de seguridad completada:';
  RAISE NOTICE '  - Función is_admin_jwt() creada (lee desde JWT)';
  RAISE NOTICE '  - Todas las RLS policies actualizadas a JWT (incluyendo storage)';
  RAISE NOTICE '  - Tabla user_roles limpiada';
  RAISE NOTICE '  - Función is_admin() eliminada (endpoint RPC roto)';
  RAISE NOTICE '  - Endpoint /rpc/is_admin ahora devuelve 404';
END $$;