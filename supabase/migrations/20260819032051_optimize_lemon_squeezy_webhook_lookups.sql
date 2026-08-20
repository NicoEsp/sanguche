-- Optimización del hot path del webhook de LemonSqueezy.
--
-- Antes de esta migración, cada evento resolvía al usuario así:
--   1. SELECT sobre public.profiles por email  -> seq scan (no había índice)
--   2. si no había profile, paginaba auth.users vía la Admin API de GoTrue
--      (hasta 20 páginas de 50 = 1000 usuarios, ~20 round trips HTTP secuenciales)
--
-- El paso 2 era el costo dominante para compradores nuevos y además estaba
-- roto: ya hay más de 1000 usuarios en auth.users, así que un usuario que
-- cayera fuera de las primeras 1000 filas no se encontraba, createUser
-- devolvía `email_exists` y el webhook terminaba en 500 ("User exists but
-- could not be retrieved").
--
-- Acá lo reemplazamos por una sola RPC que resuelve profile + auth user en un
-- único round trip, y agregamos los índices que faltaban.

-- ── Índices ────────────────────────────────────────────────────────────────
-- El webhook busca por email en cada evento (y en cada reintento de LS).
CREATE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles (email);

-- Usado por resolve_user_by_email(), que compara case-insensitive para no
-- crear un profile duplicado cuando LemonSqueezy manda el mail con otra
-- capitalización que la que usó el signup.
CREATE INDEX IF NOT EXISTS idx_profiles_email_lower
  ON public.profiles (lower(email));

-- FK sin índice de cobertura (detectado por el performance advisor).
CREATE INDEX IF NOT EXISTS idx_payment_webhook_logs_user_id
  ON public.payment_webhook_logs (user_id);

-- ── RPC de resolución de usuario ───────────────────────────────────────────
-- SECURITY DEFINER porque necesita leer auth.users, que no está expuesto vía
-- PostgREST. Devuelve una sola fila; cualquiera de los dos campos puede venir
-- en NULL:
--   profile_id NULL + auth_user_id NOT NULL -> el auth user existe pero le
--     falta el profile (trigger handle_new_user deshabilitado o fallado)
--   ambos NULL -> usuario nuevo, hay que crearlo
CREATE OR REPLACE FUNCTION public.resolve_user_by_email(p_email text)
RETURNS TABLE (profile_id uuid, auth_user_id uuid)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT
    (
      SELECT p.id
      FROM public.profiles p
      WHERE lower(p.email) = lower(p_email)
      ORDER BY p.created_at
      LIMIT 1
    ),
    (
      SELECT u.id
      FROM auth.users u
      WHERE lower(u.email) = lower(p_email)
      ORDER BY u.created_at
      LIMIT 1
    );
$$;

-- Sólo las edge functions (service_role) pueden invocarla: expone la
-- existencia de cuentas por email, así que no va para anon/authenticated.
REVOKE ALL ON FUNCTION public.resolve_user_by_email(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_user_by_email(text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_user_by_email(text) TO service_role;

COMMENT ON FUNCTION public.resolve_user_by_email(text) IS
  'Resuelve profile.id y auth.users.id a partir de un email (case-insensitive) en un solo round trip. Usada por el webhook de LemonSqueezy para evitar paginar la Admin API de GoTrue.';
