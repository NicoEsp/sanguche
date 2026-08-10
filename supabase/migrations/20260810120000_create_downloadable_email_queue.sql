-- Tracks "new premium downloadable" emails sent by send-downloadable-emails.
--
-- Idempotency key: (user_id, resource_id).
--
-- Note this differs from exercise_email_queue, which keys a whole batch by its
-- oldest row. That works there because each user's exercises are their own. A
-- downloadable announcement is a broadcast: every premium user receives the
-- SAME set of resources, so a resource created near a cron boundary would land
-- in two consecutive windows under two different batch keys and go out twice.
-- Keying per resource makes the send exactly-once per (user, resource) no
-- matter how the windows overlap.

CREATE TABLE public.downloadable_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_id uuid NOT NULL REFERENCES public.downloadable_resources(id) ON DELETE CASCADE,
  email text NOT NULL,
  -- Nullable and undefaulted, unlike the sibling queues. Those insert their row
  -- after the send, so now() is the delivery time. This one claims the row
  -- BEFORE sending, and also seeds 'backfill' rows that never send at all — a
  -- default here would stamp a delivery time on both. The function sets it
  -- explicitly once Resend confirms.
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE(user_id, resource_id)
);

-- The function loads a user's already-announced resource ids on every run.
CREATE INDEX idx_downloadable_email_queue_user
  ON public.downloadable_email_queue(user_id);

ALTER TABLE public.downloadable_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage" ON public.downloadable_email_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_view" ON public.downloadable_email_queue
  FOR SELECT USING (public.is_admin());

-- Backfill so the first cron run can only ever announce genuinely new uploads.
--
-- The function looks back 24h to be self-healing across cron outages. Without
-- this seed, any premium resource uploaded in the 24h before deploy would be
-- announced as new on the very first run. Marking every existing resource as
-- already-announced for every current premium/RePremium user closes that hole.
INSERT INTO public.downloadable_email_queue (user_id, resource_id, email, status)
SELECT p.id, d.id, p.email, 'backfill'
FROM public.profiles p
JOIN public.user_subscriptions s
  ON s.user_id = p.id
 AND s.plan IN ('premium', 'repremium')
 AND (s.status = 'active' OR s.is_comped)
CROSS JOIN public.downloadable_resources d
WHERE p.email IS NOT NULL
  AND d.is_active
  AND d.condition_domain IS NULL
  AND d.access_level = 'premium'
ON CONFLICT (user_id, resource_id) DO NOTHING;
