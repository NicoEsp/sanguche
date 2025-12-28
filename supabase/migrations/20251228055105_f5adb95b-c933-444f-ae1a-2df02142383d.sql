-- Add position column for ordering objectives within timeframes
ALTER TABLE user_progress_objectives 
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Initialize positions based on created_at for each user/timeframe combination
UPDATE user_progress_objectives upo
SET position = subq.row_num - 1
FROM (
  SELECT id, ROW_NUMBER() OVER (
    PARTITION BY user_id, timeframe 
    ORDER BY created_at ASC
  ) as row_num
  FROM user_progress_objectives
) subq
WHERE upo.id = subq.id;