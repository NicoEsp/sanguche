-- Sprint 1: PDF Security + Plan Management + Audit Log

-- 1. Create private storage bucket for new resources
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'private-resources',
  'private-resources',
  false,
  52428800, -- 50MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
);

-- 2. Add access_level to resources table
CREATE TYPE resource_access_level AS ENUM ('public', 'authenticated', 'premium');

ALTER TABLE public.resources
ADD COLUMN access_level resource_access_level NOT NULL DEFAULT 'public',
ADD COLUMN bucket_name text NOT NULL DEFAULT 'resources';

-- 3. Create admin_actions_log table
CREATE TABLE public.admin_actions_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_actions_log
ALTER TABLE public.admin_actions_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view all audit logs"
ON public.admin_actions_log
FOR SELECT
TO authenticated
USING (public.is_admin());

-- Service role and admins can insert audit logs
CREATE POLICY "Service role and admins can insert audit logs"
ON public.admin_actions_log
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() OR auth.role() = 'service_role');

-- 4. RLS policies for private-resources bucket
CREATE POLICY "Authenticated users can view private resources based on access level"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'private-resources' AND (
    -- Public resources are always accessible
    EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.file_url = storage.objects.name
      AND r.access_level = 'public'
      AND r.is_active = true
    )
    OR
    -- Authenticated resources require login
    EXISTS (
      SELECT 1 FROM public.resources r
      WHERE r.file_url = storage.objects.name
      AND r.access_level = 'authenticated'
      AND r.is_active = true
    )
    OR
    -- Premium resources require premium subscription
    EXISTS (
      SELECT 1 FROM public.resources r
      JOIN public.user_subscriptions us ON us.user_id = (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
      WHERE r.file_url = storage.objects.name
      AND r.access_level = 'premium'
      AND r.is_active = true
      AND us.plan = 'premium'
      AND us.status = 'active'
    )
  )
);

-- Admins can upload to private-resources bucket
CREATE POLICY "Admins can upload to private resources"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'private-resources' AND public.is_admin()
);

-- Admins can update private resources
CREATE POLICY "Admins can update private resources"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'private-resources' AND public.is_admin());

-- Admins can delete private resources
CREATE POLICY "Admins can delete private resources"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'private-resources' AND public.is_admin());

-- 5. Create index for better performance on admin_actions_log
CREATE INDEX idx_admin_actions_log_admin_user_id ON public.admin_actions_log(admin_user_id);
CREATE INDEX idx_admin_actions_log_target_user_id ON public.admin_actions_log(target_user_id);
CREATE INDEX idx_admin_actions_log_created_at ON public.admin_actions_log(created_at DESC);

-- 6. Create function to log admin actions
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_user_id UUID,
  p_target_user_id UUID,
  p_action_type TEXT,
  p_details JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  -- Verify admin status
  IF NOT public.is_admin(p_admin_user_id) THEN
    RAISE EXCEPTION 'User is not an admin';
  END IF;

  INSERT INTO public.admin_actions_log (
    admin_user_id,
    target_user_id,
    action_type,
    details
  ) VALUES (
    p_admin_user_id,
    p_target_user_id,
    p_action_type,
    p_details
  ) RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;