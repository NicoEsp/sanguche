-- Rotate scheduled-blog cron job after Lovable breach (2026-04).
-- The previous migration hardcoded the anon JWT in plain SQL. This migration
-- drops that job and recreates it reading the token from Supabase Vault so
-- future rotations do not require editing migrations.
--
-- PREREQUISITE (run once in SQL Editor, AFTER rotating the anon key):
--   SELECT vault.create_secret(
--     '<NEW_ANON_KEY_JWT>',
--     'scheduled_blog_cron_token',
--     'Anon key used by the publish-scheduled-blog cron job'
--   );
-- If the secret already exists, update it with:
--   UPDATE vault.secrets
--   SET secret = '<NEW_ANON_KEY_JWT>'
--   WHERE name = 'scheduled_blog_cron_token';

-- Unschedule the previous (leaked-token) cron job if present.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'publish-scheduled-blog-posts') THEN
    PERFORM cron.unschedule('publish-scheduled-blog-posts');
  END IF;
END $$;

-- Recreate the cron job resolving the bearer token from Vault at call time.
SELECT cron.schedule(
  'publish-scheduled-blog-posts',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url := 'https://lgscevufwnetegglgpnw.supabase.co/functions/v1/publish-scheduled-blog',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (
        SELECT decrypted_secret
        FROM vault.decrypted_secrets
        WHERE name = 'scheduled_blog_cron_token'
        LIMIT 1
      )
    ),
    body := jsonb_build_object('time', now()::text)
  ) AS request_id;
  $cron$
);
