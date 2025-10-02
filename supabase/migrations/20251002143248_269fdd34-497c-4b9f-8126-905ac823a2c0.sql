-- SECURITY: Create server-side admin validation function that checks JWT metadata
-- This function restricts admin access to nicolassespindola@gmail.com only
CREATE OR REPLACE FUNCTION public.is_admin_jwt(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  -- Extract email from JWT metadata
  user_email := auth.jwt() ->> 'email';
  
  -- SECURITY: Triple verification:
  -- 1. User must have admin role in user_roles table
  -- 2. Email must match nicolassespindola@gmail.com
  -- 3. If check_user_id provided, must match auth.uid()
  RETURN (
    public.is_admin() 
    AND user_email = 'nicolassespindola@gmail.com'
    AND (check_user_id IS NULL OR check_user_id = auth.uid())
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.is_admin_jwt(UUID) TO authenticated;