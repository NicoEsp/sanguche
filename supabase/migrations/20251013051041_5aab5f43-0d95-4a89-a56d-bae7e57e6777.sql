-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN email TEXT;

-- Create or replace function to sync email from auth.users to profiles
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Update profile email when user is created or email is updated
  UPDATE public.profiles
  SET email = NEW.email
  WHERE user_id = NEW.id;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users to sync email
DROP TRIGGER IF EXISTS on_auth_user_email_sync ON auth.users;
CREATE TRIGGER on_auth_user_email_sync
  AFTER INSERT OR UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- Migrate existing emails from auth.users to profiles
UPDATE public.profiles p
SET email = (
  SELECT email 
  FROM auth.users u 
  WHERE u.id = p.user_id
)
WHERE p.email IS NULL;