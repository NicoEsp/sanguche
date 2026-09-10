-- Extend send-welcome-email to also cover ProductPrepa for B2B and
-- Productastic Review. Until now, welcome_email_queue had UNIQUE(user_id),
-- enforcing "one welcome per user, ever" — fine when only Premium/RePremium
-- triggered it, but it would block the B2B and Review welcomes from being
-- sent to a user who already received a Premium welcome.
--
-- New rule: one welcome per (user, welcome category), where Premium and
-- RePremium share the same category ('premium', since the email body is the
-- same for both tiers). B2B and Review each get their own category. The edge
-- function normalizes 'repremium' → 'premium' before writing to the queue
-- so the unique key works as expected.
--
-- We also extend the trigger to fire on the two new plans and skip the
-- premium ↔ repremium transition (since they share the same welcome) plus
-- plain renewals (same plan, still active).

-- 1. Normalize existing rows so the new unique key is self-consistent.
UPDATE public.welcome_email_queue
   SET plan = 'premium'
 WHERE plan = 'repremium';

-- 2. Swap the unique constraint.
ALTER TABLE public.welcome_email_queue
  DROP CONSTRAINT IF EXISTS welcome_email_queue_user_id_key;

ALTER TABLE public.welcome_email_queue
  ADD CONSTRAINT welcome_email_queue_user_id_plan_key UNIQUE (user_id, plan);

-- 3. Update the trigger to cover B2B and Review.
CREATE OR REPLACE FUNCTION public.notify_welcome_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
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

  PERFORM net.http_post(
    url := 'https://lgscevufwnetegglgpnw.supabase.co/functions/v1/send-welcome-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc2NldnVmd25ldGVnZ2xncG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI5NzQsImV4cCI6MjA3NDA5ODk3NH0.LXqu7Vdp-IVvD6E-K3PIeaCgHKV-OJ69ugNhnd2zH5I"}'::jsonb,
    body := jsonb_build_object('user_id', NEW.user_id, 'plan', NEW.plan)
  );

  RETURN NEW;
END;
$$;
