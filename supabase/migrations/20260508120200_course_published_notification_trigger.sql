-- Fires send-course-published-emails whenever a course flips from
-- is_published=false to is_published=true. Catches both publish paths:
--   1. Cron (publish-scheduled-courses) on `coming_soon` → `published`
--   2. Manual edit from AdminCourses.tsx that sets status='published'
--
-- We hardcode the anon key here (same pattern as the other cron jobs in this
-- project — anon key is public by design). The receiving edge function has
-- verify_jwt = false; the header is required by net.http_post but unused.

CREATE OR REPLACE FUNCTION public.notify_course_published()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://lgscevufwnetegglgpnw.supabase.co/functions/v1/send-course-published-emails',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxnc2NldnVmd25ldGVnZ2xncG53Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg1MjI5NzQsImV4cCI6MjA3NDA5ODk3NH0.LXqu7Vdp-IVvD6E-K3PIeaCgHKV-OJ69ugNhnd2zH5I"}'::jsonb,
    body := jsonb_build_object('course_id', NEW.id)
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_course_published ON public.courses;

CREATE TRIGGER trigger_notify_course_published
AFTER UPDATE OF is_published ON public.courses
FOR EACH ROW
WHEN (NEW.is_published = true AND COALESCE(OLD.is_published, false) = false)
EXECUTE FUNCTION public.notify_course_published();
