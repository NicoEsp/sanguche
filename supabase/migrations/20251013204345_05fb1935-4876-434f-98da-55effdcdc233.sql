-- Create enum for access_level
CREATE TYPE progress_objective_access_level AS ENUM ('free', 'premium');

-- Add access_level column to progress_objectives
ALTER TABLE progress_objectives
ADD COLUMN access_level progress_objective_access_level NOT NULL DEFAULT 'free';

-- Create index for better performance
CREATE INDEX idx_progress_objectives_access_level 
ON progress_objectives(access_level, is_active);

-- Update RLS policy to filter by subscription
DROP POLICY IF EXISTS "Anyone can view active objectives" ON progress_objectives;

CREATE POLICY "Users view objectives based on subscription"
ON progress_objectives
FOR SELECT
USING (
  is_active = true 
  AND (
    access_level = 'free' 
    OR has_active_premium()
    OR is_admin()
  )
);