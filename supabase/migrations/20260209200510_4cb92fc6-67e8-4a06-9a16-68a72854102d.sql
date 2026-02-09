
-- Make admin_actions_log append-only: remove UPDATE and DELETE for all roles including admins
-- Only SELECT and INSERT should be allowed

-- Drop any existing UPDATE/DELETE policies on admin_actions_log
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies 
    WHERE tablename = 'admin_actions_log' AND schemaname = 'public'
    AND (cmd = 'UPDATE' OR cmd = 'DELETE')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.admin_actions_log', pol.policyname);
  END LOOP;
END $$;

-- Explicitly deny UPDATE and DELETE for all users (append-only)
CREATE POLICY "deny_update_admin_actions_log"
ON public.admin_actions_log
FOR UPDATE
USING (false);

CREATE POLICY "deny_delete_admin_actions_log"
ON public.admin_actions_log
FOR DELETE
USING (false);
