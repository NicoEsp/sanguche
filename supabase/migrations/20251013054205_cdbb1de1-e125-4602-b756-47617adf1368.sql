-- Add locking system columns to user_progress_objectives
ALTER TABLE public.user_progress_objectives 
ADD COLUMN is_locked BOOLEAN DEFAULT false,
ADD COLUMN locked_at TIMESTAMP WITH TIME ZONE;

-- Create index for better query performance
CREATE INDEX idx_user_progress_is_locked 
ON public.user_progress_objectives(user_id, is_locked);

-- Add comment for documentation
COMMENT ON COLUMN public.user_progress_objectives.is_locked IS 'Indicates if the user has finalized their career path map';
COMMENT ON COLUMN public.user_progress_objectives.locked_at IS 'Timestamp when the career path was locked/finalized';