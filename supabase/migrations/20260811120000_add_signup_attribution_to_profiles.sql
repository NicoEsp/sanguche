-- Atribución de origen del usuario al registrarse.
--
-- Guarda el primer toque (UTMs + landing + referrer) en el perfil para poder
-- responder de dónde salió cada cohorte. El origen se escribe una sola vez:
-- una vez que el perfil tiene signup_attribution_at, no se pisa más.

-- 1. Columnas de atribución -------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS signup_utm_source     text,
  ADD COLUMN IF NOT EXISTS signup_utm_medium     text,
  ADD COLUMN IF NOT EXISTS signup_utm_campaign   text,
  ADD COLUMN IF NOT EXISTS signup_utm_content    text,
  ADD COLUMN IF NOT EXISTS signup_utm_term       text,
  ADD COLUMN IF NOT EXISTS signup_landing_page   text,
  ADD COLUMN IF NOT EXISTS signup_referrer       text,
  ADD COLUMN IF NOT EXISTS signup_attribution_at timestamptz;

COMMENT ON COLUMN public.profiles.signup_attribution_at IS
  'Momento en que se registró el origen. Si no es NULL, la atribución ya no se sobreescribe.';

-- Índices parciales: solo interesan las filas que sí tienen origen.
CREATE INDEX IF NOT EXISTS profiles_signup_utm_source_idx
  ON public.profiles (signup_utm_source)
  WHERE signup_utm_source IS NOT NULL;

CREATE INDEX IF NOT EXISTS profiles_signup_utm_campaign_idx
  ON public.profiles (signup_utm_campaign)
  WHERE signup_utm_campaign IS NOT NULL;

-- 2. RPC write-once ---------------------------------------------------------
-- El cliente lo llama en el bootstrap de sesión. Es idempotente: la segunda
-- llamada no hace nada porque signup_attribution_at ya dejó de ser NULL.

CREATE OR REPLACE FUNCTION public.set_signup_attribution(
  p_utm_source   text DEFAULT NULL,
  p_utm_medium   text DEFAULT NULL,
  p_utm_campaign text DEFAULT NULL,
  p_utm_content  text DEFAULT NULL,
  p_utm_term     text DEFAULT NULL,
  p_landing_page text DEFAULT NULL,
  p_referrer     text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN;
  END IF;

  -- Sin ningún dato de origen no vale la pena marcar el perfil como atribuido:
  -- se deja NULL para que un toque posterior con UTMs sí pueda escribirlo.
  IF p_utm_source IS NULL
     AND p_utm_medium IS NULL
     AND p_utm_campaign IS NULL
     AND p_utm_content IS NULL
     AND p_utm_term IS NULL
     AND p_landing_page IS NULL
     AND p_referrer IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.profiles
  SET
    signup_utm_source     = left(p_utm_source, 255),
    signup_utm_medium     = left(p_utm_medium, 255),
    signup_utm_campaign   = left(p_utm_campaign, 255),
    signup_utm_content    = left(p_utm_content, 255),
    signup_utm_term       = left(p_utm_term, 255),
    signup_landing_page   = left(p_landing_page, 500),
    signup_referrer       = left(p_referrer, 500),
    signup_attribution_at = now()
  WHERE user_id = auth.uid()
    AND signup_attribution_at IS NULL;
END;
$function$;

REVOKE ALL ON FUNCTION public.set_signup_attribution(text, text, text, text, text, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_signup_attribution(text, text, text, text, text, text, text) TO authenticated;

-- 3. Trigger de alta --------------------------------------------------------
-- Mismo INSERT de siempre, más el origen que viaja en la metadata del signUp.
-- No se toca ensure_user_defaults(): agregarle argumentos crearía un overload
-- ambiguo y rompería las llamadas sin args que hace el cliente en cada sesión.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    name,
    signup_utm_source,
    signup_utm_medium,
    signup_utm_campaign,
    signup_utm_content,
    signup_utm_term,
    signup_landing_page,
    signup_referrer,
    signup_attribution_at
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'name',
    left(NEW.raw_user_meta_data ->> 'utm_source', 255),
    left(NEW.raw_user_meta_data ->> 'utm_medium', 255),
    left(NEW.raw_user_meta_data ->> 'utm_campaign', 255),
    left(NEW.raw_user_meta_data ->> 'utm_content', 255),
    left(NEW.raw_user_meta_data ->> 'utm_term', 255),
    left(NEW.raw_user_meta_data ->> 'landing_page', 500),
    left(NEW.raw_user_meta_data ->> 'referrer', 500),
    CASE
      WHEN NEW.raw_user_meta_data ->> 'utm_source' IS NOT NULL
        OR NEW.raw_user_meta_data ->> 'referrer' IS NOT NULL
        OR NEW.raw_user_meta_data ->> 'landing_page' IS NOT NULL
      THEN now()
    END
  );

  -- Create default free subscription
  INSERT INTO public.user_subscriptions (user_id, plan, status)
  VALUES (
    (SELECT id FROM public.profiles WHERE user_id = NEW.id),
    'free',
    'active'
  );

  RETURN NEW;
END;
$function$;
