-- Agregar función has_active_premium al control de versiones
-- Esta función verifica si el usuario actual tiene una suscripción premium activa
CREATE OR REPLACE FUNCTION public.has_active_premium()
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_profile_id UUID;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO current_user_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF current_user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if user has active premium subscription (incluye todos los planes premium)
  RETURN EXISTS (
    SELECT 1
    FROM public.user_subscriptions
    WHERE user_id = current_user_profile_id
      AND plan IN ('premium', 'repremium', 'cursos_all', 'curso_estrategia')
      AND status = 'active'
  );
END;
$$;

-- Asegurar permisos de ejecución
GRANT EXECUTE ON FUNCTION public.has_active_premium() TO authenticated, anon;