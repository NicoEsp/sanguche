-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule cleanup job to run every hour
SELECT cron.schedule(
  'cleanup-old-checkout-rate-limits',
  '0 * * * *', -- Every hour at minute 0
  $$
  SELECT public.clean_old_rate_limits();
  $$
);