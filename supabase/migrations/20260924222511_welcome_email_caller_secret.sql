-- Solo el trigger puede disparar send-welcome-email.
--
-- La función corre con verify_jwt = false porque el trigger la llama por pg_net
-- y no tiene un JWT de servicio que mandar (guardarlo en el SQL lo dejaría en
-- el repo). Hasta ahora cualquiera con el id de un perfil con plan activo podía
-- llamarla. Con esta migración:
--   * se genera un secreto aleatorio en Vault (welcome_email_secret);
--   * el trigger lo manda en el header x-welcome-secret;
--   * la función lo valida con welcome_email_secret_matches(), que solo puede
--     ejecutar service_role: el secreto no sale de la base ni hay que copiarlo
--     a los secrets de la función.
--
-- ORDEN: aplicar esta migración ANTES de desplegar la versión de
-- send-welcome-email que exige el header. Al revés, la función rechazaría las
-- llamadas del trigger hasta que esto esté aplicado.

-- 1. El secreto se genera acá, así nadie tiene que manejarlo a mano.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM vault.secrets WHERE name = 'welcome_email_secret') THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'welcome_email_secret',
      'Header x-welcome-secret: autentica al trigger notify_welcome_email ante send-welcome-email'
    );
  END IF;
END $$;

-- 2. Validación para la edge function. Compara los hashes y no los textos, para
-- que el tiempo de respuesta no dé pistas sobre el secreto.
CREATE OR REPLACE FUNCTION public.welcome_email_secret_matches(p_secret text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(
    extensions.digest(p_secret, 'sha256') = extensions.digest(
      (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'welcome_email_secret' LIMIT 1),
      'sha256'
    ),
    false
  );
$$;

REVOKE ALL ON FUNCTION public.welcome_email_secret_matches(text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.welcome_email_secret_matches(text) TO service_role;

-- 3. El trigger manda el secreto. Deja de mandar el JWT anon: con
-- verify_jwt = false el gateway no lo mira. El resto no cambia.
CREATE OR REPLACE FUNCTION public.notify_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  caller_secret text;
BEGIN
  IF NEW.plan NOT IN ('premium', 'repremium', 'productprepa_business', 'productastic_review')
     OR NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Skip pure renewals: same plan, still active.
    IF OLD.plan = NEW.plan AND OLD.status = 'active' THEN
      RETURN NEW;
    END IF;

    -- Skip premium ↔ repremium transitions: they share the same welcome
    -- (category 'premium'), so the edge function would dedup anyway; we
    -- avoid the unnecessary HTTP call here.
    IF OLD.plan IN ('premium', 'repremium') AND OLD.status = 'active'
       AND NEW.plan IN ('premium', 'repremium') THEN
      RETURN NEW;
    END IF;
  END IF;

  SELECT decrypted_secret INTO caller_secret
  FROM vault.decrypted_secrets
  WHERE name = 'welcome_email_secret'
  LIMIT 1;

  IF caller_secret IS NULL OR caller_secret = '' THEN
    -- Nunca se aborta el alta del plan por no poder mandar la bienvenida.
    RAISE WARNING 'notify_welcome_email: falta el secreto welcome_email_secret en Vault; no se mandó la bienvenida de %', NEW.user_id;
    RETURN NEW;
  END IF;

  PERFORM net.http_post(
    url := 'https://lgscevufwnetegglgpnw.supabase.co/functions/v1/send-welcome-email',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-welcome-secret', caller_secret
    ),
    body := jsonb_build_object('user_id', NEW.user_id, 'plan', NEW.plan)
  );

  RETURN NEW;
END;
$$;
