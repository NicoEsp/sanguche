-- Add last_mentoria_date column to profiles
ALTER TABLE profiles 
ADD COLUMN last_mentoria_date timestamp with time zone;

-- Migrate existing data: set last_mentoria_date for users who already completed mentoria
UPDATE profiles
SET last_mentoria_date = updated_at
WHERE mentoria_completed = true 
  AND last_mentoria_date IS NULL;