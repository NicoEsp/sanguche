-- Recorrido de mentoría: minutos 1:1 acumulados por persona.
-- No hace falta una tabla nueva: alcanza con un contador de sesiones en profiles,
-- porque las sesiones tienen una duración estándar (45 min) y ya guardamos la fecha
-- de la última en last_mentoria_date.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS mentoria_sessions_count integer NOT NULL DEFAULT 0;

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_mentoria_sessions_count_non_negative;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_mentoria_sessions_count_non_negative
  CHECK (mentoria_sessions_count >= 0);

COMMENT ON COLUMN public.profiles.mentoria_sessions_count IS
  'Sesiones 1:1 registradas por un admin. Los minutos del recorrido se derivan multiplicando por la duración estándar de la sesión (45 min).';

-- Backfill: quien ya tenía la mentoría marcada como completada hizo al menos una sesión.
UPDATE public.profiles
SET mentoria_sessions_count = 1
WHERE mentoria_completed = true
  AND mentoria_sessions_count = 0;

-- Registrar (o descontar, si hubo un error de carga) una sesión 1:1.
CREATE OR REPLACE FUNCTION public.admin_log_mentoria_session(
  p_target_profile_id uuid,
  p_delta integer DEFAULT 1,
  p_session_date timestamp with time zone DEFAULT now()
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_count integer;
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  IF p_delta NOT IN (-1, 1) THEN
    RAISE EXCEPTION 'Invalid delta: only -1 or 1 are allowed';
  END IF;

  UPDATE public.profiles
  SET
    mentoria_sessions_count = GREATEST(mentoria_sessions_count + p_delta, 0),
    -- La mentoría queda "completada" mientras haya al menos una sesión registrada.
    mentoria_completed = GREATEST(mentoria_sessions_count + p_delta, 0) > 0,
    -- Descontar una sesión mal cargada no debería reescribir la fecha de la anterior.
    last_mentoria_date = CASE
      WHEN p_delta > 0 THEN p_session_date
      ELSE last_mentoria_date
    END,
    updated_at = now()
  WHERE id = p_target_profile_id
  RETURNING mentoria_sessions_count INTO v_new_count;

  IF v_new_count IS NULL THEN
    RAISE EXCEPTION 'Profile not found: %', p_target_profile_id;
  END IF;

  PERFORM public.log_admin_action(
    p_target_profile_id,
    'mentoria_session_logged',
    jsonb_build_object('delta', p_delta, 'new_count', v_new_count)
  );

  RETURN jsonb_build_object('success', true, 'sessions_count', v_new_count);
END;
$function$;

REVOKE ALL ON FUNCTION public.admin_log_mentoria_session(uuid, integer, timestamp with time zone) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_log_mentoria_session(uuid, integer, timestamp with time zone) TO authenticated;

-- El toggle de la lista de usuarios sigue existiendo: que deje el contador coherente.
CREATE OR REPLACE FUNCTION public.admin_update_mentoria_status(
  p_target_profile_id uuid,
  p_new_status boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- SECURITY: Verify caller is admin
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin privileges required';
  END IF;

  -- Update mentoria status
  UPDATE public.profiles
  SET
    mentoria_completed = p_new_status,
    mentoria_sessions_count = CASE
      WHEN p_new_status AND mentoria_sessions_count = 0 THEN 1
      WHEN NOT p_new_status THEN 0
      ELSE mentoria_sessions_count
    END,
    last_mentoria_date = CASE
      WHEN p_new_status AND last_mentoria_date IS NULL THEN now()
      ELSE last_mentoria_date
    END
  WHERE id = p_target_profile_id;

  -- Log action (admin_profile_id is now obtained automatically)
  PERFORM public.log_admin_action(
    p_target_profile_id,
    'mentoria_status_updated',
    jsonb_build_object('new_status', p_new_status)
  );

  RETURN jsonb_build_object('success', true, 'new_status', p_new_status);
END;
$function$;
