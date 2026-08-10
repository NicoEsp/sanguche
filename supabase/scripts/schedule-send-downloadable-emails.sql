-- Schedule the send-downloadable-emails edge function to run every 15 minutes.
--
-- HOW TO APPLY:
-- Run this script ONCE from the Supabase SQL Editor after the
-- send-downloadable-emails edge function has been deployed AND the
-- 20260810120000_create_downloadable_email_queue migration has been applied.
--
-- Applying it before the migration is harmless but pointless: the function
-- would fail on the missing queue table on every run until the table exists.
--
-- Why this isn't a migration:
-- pg_cron jobs are environment-specific (we don't want this scheduled in
-- preview branches or local dev), and the bearer token below is the project
-- anon key — fine to leave hardcoded (anon key is public by design, same
-- pattern as send-exercise-emails / send-mentoria-reminder-emails), but easier
-- to manage outside of versioned migrations.

-- Unschedule any previous version of this job (idempotent re-run)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-downloadable-emails') THEN
    PERFORM cron.unschedule('send-downloadable-emails');
  END IF;
END $$;

SELECT cron.schedule(
  'send-downloadable-emails',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://lgscevufwnetegglgpnw.supabase.co/functions/v1/send-downloadable-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc2NldnVmd25ldGVnZ2xncG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI5NzQsImV4cCI6MjA3NDA5ODk3NH0.LXqu7Vdp-IVvD6E-K3PIeaCgHKV-OJ69ugNhnd2zH5I"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $cron$
);

-- Verify
SELECT jobid, schedule, command, active FROM cron.job WHERE jobname = 'send-downloadable-emails';
