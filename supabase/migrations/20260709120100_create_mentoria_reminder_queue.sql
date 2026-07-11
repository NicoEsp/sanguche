-- Tracks monthly mentoría-reminder emails sent by send-mentoria-reminder-emails
-- (D1). One reminder per user per calendar month — UNIQUE(user_id, period)
-- keeps the monthly cron idempotent even if it runs more than once.
--
-- period is the current 'YYYY-MM' at send time.

CREATE TABLE public.mentoria_reminder_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period text NOT NULL,
  plan text,
  email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE(user_id, period)
);

ALTER TABLE public.mentoria_reminder_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage" ON public.mentoria_reminder_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_view" ON public.mentoria_reminder_queue
  FOR SELECT USING (public.is_admin());
