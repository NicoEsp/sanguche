-- Tracks subscription-lifecycle emails sent from the lemon-squeezy-webhook:
--   email_type = 'payment_failed'  → C1 dunning (one per subscription per day)
--   email_type = 'cancelled'       → C2 cancellation / win-back (one per sub)
--
-- Idempotency is enforced by the UNIQUE dedup_key, which the webhook composes:
--   dunning:<subscription_id>:<YYYY-MM-DD>
--   cancel:<subscription_id>
-- so duplicate webhook deliveries never double-send.

CREATE TABLE public.subscription_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  lemon_squeezy_subscription_id text,
  email_type text NOT NULL,
  dedup_key text NOT NULL,
  email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE(dedup_key)
);

CREATE INDEX idx_subscription_email_queue_user
  ON public.subscription_email_queue(user_id);

ALTER TABLE public.subscription_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage" ON public.subscription_email_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_view" ON public.subscription_email_queue
  FOR SELECT USING (public.is_admin());
