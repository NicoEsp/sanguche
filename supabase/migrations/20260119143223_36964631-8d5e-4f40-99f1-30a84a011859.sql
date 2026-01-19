-- Eliminar las policies RESTRICTIVE que causan el bloqueo
DROP POLICY IF EXISTS "courses_deny_anonymous" ON public.courses;
DROP POLICY IF EXISTS "courses_require_auth" ON public.courses;

-- Eliminar y recrear la policy de SELECT para usuarios autenticados
DROP POLICY IF EXISTS "courses_select_published_or_coming_soon" ON public.courses;

CREATE POLICY "courses_select_published"
ON public.courses
FOR SELECT
TO authenticated
USING (
  status IN ('published', 'coming_soon')
  OR is_admin()
);