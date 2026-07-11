-- Schedule the send-mentoria-reminder-emails edge function to run monthly.
--
-- HOW TO APPLY:
-- Run this script ONCE from the Supabase SQL Editor after the
-- send-mentoria-reminder-emails edge function has been deployed.
--
-- Why this isn't a migration:
-- pg_cron jobs are environment-specific (we don't want this scheduled in
-- preview branches or local dev), and the bearer token below is the project
-- anon key — fine to leave hardcoded (anon key is public by design, same
-- pattern as send-exercise-emails / send-discount-email).
--
-- Schedule: 08:00 UTC on the 1st of every month (~05:00 Argentina). The
-- function is idempotent per (user, YYYY-MM) via mentoria_reminder_queue, so a
-- manual re-run the same month is safe.

-- Unschedule any previous version of this job (idempotent re-run)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-mentoria-reminder-emails') THEN
    PERFORM cron.unschedule('send-mentoria-reminder-emails');
  END IF;
END $$;

SELECT cron.schedule(
  'send-mentoria-reminder-emails',
  '0 8 1 * *',
  $cron$
  SELECT net.http_post(
    url := 'https://lgscevufwnetegglgpnw.supabase.co/functions/v1/send-mentoria-reminder-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc2NldnVmd25ldGVnZ2xncG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI5NzQsImV4cCI6MjA3NDA5ODk3NH0.LXqu7Vdp-IVvD6E-K3PIeaCgHKV-OJ69ugNhnd2zH5I"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $cron$
);

-- Verify
SELECT jobid, schedule, command, active FROM cron.job WHERE jobname = 'send-mentoria-reminder-emails';
