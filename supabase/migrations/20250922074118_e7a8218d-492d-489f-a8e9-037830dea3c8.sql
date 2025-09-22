-- Fix security warning: Function Search Path Mutable
-- Update the log_security_event function to have a proper search_path

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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;