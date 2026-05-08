-- Tracks emails sent by send-exercise-emails (cron-windowed) so the cron is
-- safely re-runnable and a network blip doesn't double-mail anyone.
--
-- Idempotency key: (user_id, first_exercise_id) — each batch is identified by
-- the oldest exercise included. Rerunning the cron over the same time window
-- finds the same first_exercise_id and the unique index rejects the duplicate.

CREATE TABLE public.exercise_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  first_exercise_id uuid NOT NULL,
  exercise_ids uuid[] NOT NULL,
  exercise_count integer NOT NULL,
  email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE(user_id, first_exercise_id)
);

ALTER TABLE public.exercise_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage" ON public.exercise_email_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_view" ON public.exercise_email_queue
  FOR SELECT USING (public.is_admin());
