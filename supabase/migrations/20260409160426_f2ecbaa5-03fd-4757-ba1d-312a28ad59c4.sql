
ALTER TABLE public.exclusive_sessions
  ADD COLUMN IF NOT EXISTS agenda jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS speaker_name text,
  ADD COLUMN IF NOT EXISTS speaker_bio text,
  ADD COLUMN IF NOT EXISTS speaker_image_url text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS learning_outcomes text;
