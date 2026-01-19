-- =====================================
-- FIX: course_lessons RLS policies
-- =====================================

-- Eliminar políticas restrictivas que bloquean todo
DROP POLICY IF EXISTS "course_lessons_deny_anonymous" ON public.course_lessons;
DROP POLICY IF EXISTS "course_lessons_require_auth" ON public.course_lessons;

-- =====================================
-- FIX: course_exercises RLS policies  
-- =====================================

-- Eliminar políticas restrictivas que bloquean todo
DROP POLICY IF EXISTS "course_exercises_deny_anonymous" ON public.course_exercises;
DROP POLICY IF EXISTS "course_exercises_require_auth" ON public.course_exercises;