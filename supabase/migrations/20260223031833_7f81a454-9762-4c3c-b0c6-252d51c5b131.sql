-- Enable extensions if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create cron job to publish scheduled blog posts every 5 minutes
SELECT cron.schedule(
  'publish-scheduled-blog-posts',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://lgscevufwnetegglgpnw.supabase.co/functions/v1/publish-scheduled-blog',
      -- Token removed after Lovable breach. The active cron job is re-created
      -- with Vault-managed auth by migration 20260420000000_rotate_cron_secrets.sql.
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer TOKEN_ROTATED_SEE_LATER_MIGRATION"}'::jsonb,
      body := concat('{"time": "', now(), '"}')::jsonb
    ) AS request_id;
  $$
);