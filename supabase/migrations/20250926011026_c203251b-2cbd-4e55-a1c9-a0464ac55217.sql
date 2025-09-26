-- Add RLS policies for administrators to access all profiles
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE USING (is_admin());

-- Add RLS policy for administrators to view all subscriptions
CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
    FOR SELECT USING (is_admin());