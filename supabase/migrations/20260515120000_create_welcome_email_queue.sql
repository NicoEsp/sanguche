-- Tracks welcome emails sent by send-welcome-email when a user enters an
-- active Premium or RePremium subscription for the first time.
-- One email per user_id, ever — UNIQUE prevents the trigger from re-firing on
-- renewals, upgrades (Premium → RePremium), or repurchases.

CREATE TABLE public.welcome_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan text NOT NULL,
  email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE(user_id)
);

ALTER TABLE public.welcome_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage" ON public.welcome_email_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_view" ON public.welcome_email_queue
  FOR SELECT USING (public.is_admin());
