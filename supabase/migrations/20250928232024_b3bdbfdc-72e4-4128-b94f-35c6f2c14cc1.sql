-- Create exercise_requests table to store user email submissions for exercises
CREATE TABLE public.exercise_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  email text NOT NULL,
  exercise_id text NOT NULL DEFAULT 'general',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  -- Foreign key to profiles table
  CONSTRAINT exercise_requests_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.exercise_requests ENABLE ROW LEVEL SECURITY;

-- Create policies for exercise_requests
CREATE POLICY "Users can view their own exercise requests" 
ON public.exercise_requests 
FOR SELECT 
USING (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Users can create their own exercise requests" 
ON public.exercise_requests 
FOR INSERT 
WITH CHECK (user_id IN (
  SELECT id FROM public.profiles WHERE user_id = auth.uid()
));

CREATE POLICY "Admins can view all exercise requests" 
ON public.exercise_requests 
FOR ALL 
USING (is_admin());

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_exercise_requests_updated_at
BEFORE UPDATE ON public.exercise_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for better performance
CREATE INDEX idx_exercise_requests_user_id ON public.exercise_requests(user_id);
CREATE INDEX idx_exercise_requests_created_at ON public.exercise_requests(created_at);