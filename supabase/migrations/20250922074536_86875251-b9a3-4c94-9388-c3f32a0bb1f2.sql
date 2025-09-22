-- CRITICAL SECURITY FIX: Restrict security_audit table access to administrators only
-- Remove user access policy and implement proper admin controls

-- Drop the overly permissive policy that allows users to view their own audit logs
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.security_audit;

-- First, create a user_roles table for proper role management (if it doesn't exist)
DO $$ 
BEGIN
    -- Check if user_roles table exists, create if not
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') THEN
        -- Create enum for roles
        CREATE TYPE public.app_role AS ENUM ('admin', 'user');
        
        -- Create user_roles table
        CREATE TABLE public.user_roles (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
            role app_role NOT NULL DEFAULT 'user',
            created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
            UNIQUE (user_id, role)
        );
        
        -- Enable RLS on user_roles
        ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
        
        -- Only admins can manage roles
        CREATE POLICY "Only admins can manage roles" 
        ON public.user_roles 
        FOR ALL 
        USING (false) 
        WITH CHECK (false);
    END IF;
END $$;

-- Create security definer function to check admin role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
DECLARE
    target_user_id UUID;
BEGIN
    -- Use provided user_id or default to current user
    target_user_id := COALESCE(check_user_id, auth.uid());
    
    IF target_user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has admin role
    RETURN EXISTS (
        SELECT 1 
        FROM public.user_roles ur
        JOIN public.profiles p ON ur.user_id = p.id
        WHERE p.user_id = target_user_id 
        AND ur.role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create admin-only access policy for security_audit
CREATE POLICY "Only admins can access security audit logs" 
ON public.security_audit 
FOR ALL 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- Update the system insert policy to be more restrictive
DROP POLICY IF EXISTS "System can insert audit logs" ON public.security_audit;

-- Create a more secure policy for system inserts (via edge functions with service role)
CREATE POLICY "Service role can insert audit logs" 
ON public.security_audit 
FOR INSERT 
WITH CHECK (auth.role() = 'service_role' OR public.is_admin());

-- Add function to safely create first admin user (can only be called once per user)
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_id UUID;
    admin_count INTEGER;
BEGIN
    -- Security check: only allow if no admins exist or if called by existing admin
    SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
    
    IF admin_count > 0 AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only existing admins can create new admin users';
    END IF;
    
    -- Get profile ID for the user
    SELECT id INTO profile_id 
    FROM public.profiles 
    WHERE user_id = admin_user_id;
    
    IF profile_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    
    -- Insert admin role (ignore if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (profile_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;