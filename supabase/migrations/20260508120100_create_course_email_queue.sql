-- Tracks "new course published" emails sent by send-course-published-emails.
-- One email per (user_id, course_id) — the unique index prevents duplicates if
-- the trigger fires twice or the function retries.

CREATE TABLE public.course_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_manage" ON public.course_email_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "admin_view" ON public.course_email_queue
  FOR SELECT USING (public.is_admin());
