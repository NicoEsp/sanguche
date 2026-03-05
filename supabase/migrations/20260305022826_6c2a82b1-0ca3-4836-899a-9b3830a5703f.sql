
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Table to track sent discount emails
CREATE TABLE public.discount_email_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  email text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'sent',
  error_message text,
  assessment_data jsonb,
  UNIQUE(assessment_id)
);

ALTER TABLE public.discount_email_queue ENABLE ROW LEVEL SECURITY;

-- Only service_role can manage (for edge function)
CREATE POLICY "service_role_manage" ON public.discount_email_queue
  FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');

-- Admins can view
CREATE POLICY "admin_view" ON public.discount_email_queue
  FOR SELECT USING (public.is_admin());
