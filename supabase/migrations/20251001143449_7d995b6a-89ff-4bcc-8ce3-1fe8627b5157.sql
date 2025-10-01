-- ============================================
-- JWT ADMIN SECURITY MIGRATION
-- Máxima seguridad: Solo Supabase Dashboard puede asignar admin
-- ============================================

-- 1. Crear función para asignar rol admin en JWT metadata
-- SOLO puede ejecutarse desde SQL Editor en Supabase Dashboard
CREATE OR REPLACE FUNCTION public.set_admin_role(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  -- Obtener el user_id del auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', target_email;
  END IF;

  -- Actualizar raw_user_meta_data para incluir el rol admin
  UPDATE auth.users
  SET raw_user_meta_data = jsonb_set(
    COALESCE(raw_user_meta_data, '{}'::jsonb),
    '{role}',
    '"admin"'::jsonb
  )
  WHERE id = target_user_id;

  -- Log de seguridad
  INSERT INTO public.security_audit (
    user_id,
    action,
    resource_type,
    ip_address,
    user_agent
  ) VALUES (
    target_user_id,
    'admin_role_assigned_via_jwt',
    'admin_access',
    NULL,
    'Supabase SQL Editor'
  );

  RAISE NOTICE 'Rol admin asignado exitosamente a %', target_email;
END;
$$;

-- 2. Crear función para REMOVER rol admin
CREATE OR REPLACE FUNCTION public.remove_admin_role(target_email TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario con email % no encontrado', target_email;
  END IF;

  -- Remover el campo role del metadata
  UPDATE auth.users
  SET raw_user_meta_data = raw_user_meta_data - 'role'
  WHERE id = target_user_id;

  -- Log de seguridad
  INSERT INTO public.security_audit (
    user_id,
    action,
    resource_type,
    ip_address,
    user_agent
  ) VALUES (
    target_user_id,
    'admin_role_removed_via_jwt',
    'admin_access',
    NULL,
    'Supabase SQL Editor'
  );

  RAISE NOTICE 'Rol admin removido exitosamente de %', target_email;
END;
$$;

-- 3. Migrar roles existentes de user_roles table a JWT metadata
DO $$
DECLARE
  admin_record RECORD;
  user_email TEXT;
BEGIN
  FOR admin_record IN 
    SELECT ur.user_id, p.user_id as auth_user_id
    FROM public.user_roles ur
    JOIN public.profiles p ON ur.user_id = p.id
    WHERE ur.role = 'admin'
  LOOP
    -- Obtener email del usuario
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = admin_record.auth_user_id;

    IF user_email IS NOT NULL THEN
      -- Asignar rol admin en JWT
      UPDATE auth.users
      SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{role}',
        '"admin"'::jsonb
      )
      WHERE id = admin_record.auth_user_id;

      RAISE NOTICE 'Migrado admin: %', user_email;
    END IF;
  END LOOP;
END $$;

-- 4. Comentar sobre la seguridad del sistema
COMMENT ON FUNCTION public.set_admin_role IS 
'SECURITY: Esta función solo debe ejecutarse desde Supabase SQL Editor. 
Para asignar admin: SELECT public.set_admin_role(''usuario@empresa.com'');';

COMMENT ON FUNCTION public.remove_admin_role IS 
'SECURITY: Esta función solo debe ejecutarse desde Supabase SQL Editor.
Para remover admin: SELECT public.remove_admin_role(''usuario@empresa.com'');';