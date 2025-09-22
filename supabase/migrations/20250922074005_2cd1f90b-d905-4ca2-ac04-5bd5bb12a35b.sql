-- Critical Security Fix: Make user_id NOT NULL in assessments table
-- This prevents orphaned assessments and ensures proper user association

-- First, update any existing assessments with NULL user_id to reference a system user
-- or remove them if they're invalid (for this example, we'll remove them)
DELETE FROM public.assessments WHERE user_id IS NULL;

-- Now make user_id NOT NULL
ALTER TABLE public.assessments 
ALTER COLUMN user_id SET NOT NULL;

-- Add foreign key constraint to ensure referential integrity
ALTER TABLE public.assessments 
ADD CONSTRAINT fk_assessments_user_id 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Update RLS policies to remove NULL checks since user_id is now required
DROP POLICY IF EXISTS "Users can create assessments" ON public.assessments;

CREATE POLICY "Users can create assessments" 
ON public.assessments 
FOR INSERT 
WITH CHECK (user_id IN ( 
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

-- Enhance LinkedIn shares security with better access control
-- Add rate limiting by adding a unique constraint on user_id and date
CREATE UNIQUE INDEX idx_linkedin_shares_user_date 
ON public.linkedin_shares (user_id, DATE(shared_at))
WHERE user_id IS NOT NULL;

-- Add audit trail table for security monitoring
CREATE TABLE public.security_audit (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit table
ALTER TABLE public.security_audit ENABLE ROW LEVEL SECURITY;

-- Only allow users to view their own audit logs
CREATE POLICY "Users can view their own audit logs" 
ON public.security_audit 
FOR SELECT 
USING (user_id IN ( 
  SELECT profiles.id
  FROM profiles
  WHERE profiles.user_id = auth.uid()
));

-- System can insert audit logs (will be handled by edge functions)
CREATE POLICY "System can insert audit logs" 
ON public.security_audit 
FOR INSERT 
WITH CHECK (true);

-- Create function to log security events
CREATE OR REPLACE FUNCTION public.log_security_event(
  p_user_id UUID,
  p_action TEXT,
  p_resource_type TEXT,
  p_resource_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
BEGIN
  INSERT INTO public.security_audit (
    user_id, action, resource_type, resource_id, ip_address, user_agent
  ) VALUES (
    p_user_id, p_action, p_resource_type, p_resource_id, p_ip_address, p_user_agent
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;