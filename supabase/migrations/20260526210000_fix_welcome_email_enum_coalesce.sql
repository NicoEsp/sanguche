-- Fix: notify_welcome_email() threw "invalid input value for enum
-- subscription_plan: """ on every UPDATE that moved a row into
-- (plan IN ('premium','repremium'), status = 'active').
--
-- The previous version guarded the "already active premium" case with
-- COALESCE(OLD.plan, '') / COALESCE(OLD.status, ''). Because plan and status
-- are enum columns, Postgres coerces the '' literal to the enum type, and ''
-- is not a valid label -> the AFTER trigger raised, which aborted the whole
-- upsert. The Lemon Squeezy webhook does not inspect the upsert result, so the
-- failure was silent: it logged success while the row stayed unchanged.
--
-- Impact: existing users upgrading from a non-premium plan and any
-- reactivation/recovery (inactive/cancelled/expired -> active) never got
-- status='active' written, leaving paying users stuck behind the paywall.
-- New users whose first row was INSERTed were unaffected (the OLD guard only
-- runs on UPDATE).
--
-- plan and status are NOT NULL, so no COALESCE is needed: compare the enum
-- columns directly against valid labels.

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

  -- Skip UPDATEs that keep the user in the same active premium/repremium state
  -- (renewals via subscription_payment_success, current_period_end bumps).
  -- OLD is only assigned on UPDATE: keep the OLD.* reads nested inside the
  -- TG_OP guard instead of folding them into one boolean expression, so the
  -- INSERT path never references OLD (Postgres does not guarantee AND
  -- short-circuit evaluation order for that purpose).
  IF TG_OP = 'UPDATE' THEN
    IF OLD.plan IN ('premium', 'repremium')
       AND OLD.status = 'active' THEN
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
