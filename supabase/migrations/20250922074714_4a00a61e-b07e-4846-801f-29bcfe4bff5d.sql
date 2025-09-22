-- CRITICAL FIX: Replace broken user_roles policies with functional role-based access
-- The previous policies blocked ALL access, making the role system unusable

-- Drop the broken policy that blocks all access
DROP POLICY IF EXISTS "Only admins can manage roles" ON public.user_roles;

-- Create proper policies for role management

-- 1. Allow users to view their own roles (read-only for regular users)
CREATE POLICY "Users can view their own roles" 
ON public.user_roles 
FOR SELECT 
USING (
    user_id IN (
        SELECT profiles.id 
        FROM public.profiles 
        WHERE profiles.user_id = auth.uid()
    )
);

-- 2. Allow admins to view all roles
CREATE POLICY "Admins can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (public.is_admin());

-- 3. Allow admins to insert new roles
CREATE POLICY "Admins can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (public.is_admin());

-- 4. Allow admins to update existing roles
CREATE POLICY "Admins can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

-- 5. Allow admins to delete roles
CREATE POLICY "Admins can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (public.is_admin());

-- 6. Allow service role (for system operations like user creation) to manage roles
CREATE POLICY "Service role can manage roles" 
ON public.user_roles 
FOR ALL 
USING (auth.role() = 'service_role') 
WITH CHECK (auth.role() = 'service_role');

-- Update the create_admin_user function to work with the new policies
-- Also add a simpler version that can be used during initial setup
CREATE OR REPLACE FUNCTION public.create_admin_user(admin_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_id UUID;
    admin_count INTEGER;
BEGIN
    -- Get profile ID for the user
    SELECT id INTO profile_id 
    FROM public.profiles 
    WHERE user_id = admin_user_id;
    
    IF profile_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found for user_id: %', admin_user_id;
    END IF;
    
    -- Count existing admins
    SELECT COUNT(*) INTO admin_count 
    FROM public.user_roles 
    WHERE role = 'admin';
    
    -- If no admins exist, allow creation (bootstrap scenario)
    -- If admins exist, only allow if current user is admin
    IF admin_count > 0 AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Only existing admins can create new admin users';
    END IF;
    
    -- Insert admin role (ignore if already exists)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (profile_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a bootstrap function that can create the first admin without role checks
-- This should only be used once during initial setup
CREATE OR REPLACE FUNCTION public.bootstrap_first_admin(admin_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    profile_id UUID;
    admin_count INTEGER;
BEGIN
    -- Check if any admins already exist
    SELECT COUNT(*) INTO admin_count 
    FROM public.user_roles 
    WHERE role = 'admin';
    
    IF admin_count > 0 THEN
        RAISE EXCEPTION 'Admin users already exist. Use create_admin_user() function instead.';
    END IF;
    
    -- Get profile ID for the user
    SELECT id INTO profile_id 
    FROM public.profiles 
    WHERE user_id = admin_user_id;
    
    IF profile_id IS NULL THEN
        RAISE EXCEPTION 'User profile not found for user_id: %', admin_user_id;
    END IF;
    
    -- Insert the first admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (profile_id, 'admin');
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;