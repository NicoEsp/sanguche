-- Fires send-welcome-email whenever a user_subscriptions row enters
-- (plan IN ('premium','repremium'), status = 'active') from outside that state.
-- Covers both paths:
--   1. INSERT (first-ever subscription for the user_id)
--   2. UPDATE where the previous state was not premium/repremium+active (i.e.
--      reactivation, upgrade from a non-premium plan, etc.)
-- Skipped on UPDATEs that keep the user in the same active premium/repremium
-- state (renewals via subscription_payment_success, current_period_end bumps).
--
-- The edge function also pre-checks the UNIQUE(user_id) constraint on
-- welcome_email_queue, so a user only ever receives one welcome mail.
--
-- Anon key is hardcoded here for the same reason as in
-- course_published_notification_trigger: the receiving function has
-- verify_jwt = false and the header is required by net.http_post.

CREATE OR REPLACE FUNCTION public.notify_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF NEW.plan NOT IN ('premium', 'repremium') OR NEW.status <> 'active' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF COALESCE(OLD.plan, '') IN ('premium', 'repremium')
       AND COALESCE(OLD.status, '') = 'active' THEN
      RETURN NEW;
    END IF;
  END IF;

  PERFORM net.http_post(
    url := 'https://lgscevufwnetegglgpnw.supabase.co/functions/v1/send-welcome-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc2NldnVmd25ldGVnZ2xncG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI5NzQsImV4cCI6MjA3NDA5ODk3NH0.LXqu7Vdp-IVvD6E-K3PIeaCgHKV-OJ69ugNhnd2zH5I"}'::jsonb,
    body := jsonb_build_object('user_id', NEW.user_id, 'plan', NEW.plan)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_welcome_email ON public.user_subscriptions;

CREATE TRIGGER trigger_notify_welcome_email
AFTER INSERT OR UPDATE ON public.user_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.notify_welcome_email();
