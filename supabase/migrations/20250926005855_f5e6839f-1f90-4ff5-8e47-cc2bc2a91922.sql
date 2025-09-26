-- Add mentoria_completed field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN mentoria_completed boolean NOT NULL DEFAULT false;

-- Add index for better performance on admin queries
CREATE INDEX idx_profiles_mentoria_completed ON public.profiles(mentoria_completed);