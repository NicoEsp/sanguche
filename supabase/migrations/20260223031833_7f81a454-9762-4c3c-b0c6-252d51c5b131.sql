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
      headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc2NldnVmd25ldGVnZ2xncG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI5NzQsImV4cCI6MjA3NDA5ODk3NH0.LXqu7Vdp-IVvD6E-K3PIeaCgHKV-OJ69ugNhnd2zH5I"}'::jsonb,
      body := concat('{"time": "', now(), '"}')::jsonb
    ) AS request_id;
  $$
);