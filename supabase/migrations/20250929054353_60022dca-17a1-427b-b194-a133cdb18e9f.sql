-- Remove the email column from exercise_requests table
-- This eliminates redundant storage of email addresses and reduces security risk
-- The email can be obtained from auth.users when needed

ALTER TABLE public.exercise_requests 
DROP COLUMN email;