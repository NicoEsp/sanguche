-- Create table for dismissed recommended objectives
CREATE TABLE public.dismissed_recommended_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  objective_key TEXT NOT NULL,  -- Unique key like "discovery_junior_1"
  dismissed_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, objective_key)
);

-- Enable Row Level Security
ALTER TABLE public.dismissed_recommended_objectives ENABLE ROW LEVEL SECURITY;

-- Create helper function to get profile_id from auth.uid()
CREATE OR REPLACE FUNCTION public.get_profile_id_for_auth()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Users can view their own dismissed objectives
CREATE POLICY "Users can view own dismissed objectives" 
ON public.dismissed_recommended_objectives
FOR SELECT USING (user_id = public.get_profile_id_for_auth());

-- Users can dismiss their own objectives
CREATE POLICY "Users can dismiss objectives" 
ON public.dismissed_recommended_objectives
FOR INSERT WITH CHECK (user_id = public.get_profile_id_for_auth());

-- Users can delete their dismissed objectives (in case they want to see them again)
CREATE POLICY "Users can undismiss objectives"
ON public.dismissed_recommended_objectives
FOR DELETE USING (user_id = public.get_profile_id_for_auth());