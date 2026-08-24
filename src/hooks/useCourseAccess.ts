import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types/courses";
import { resolveCourseAccess, type CourseAccess } from "@/utils/courseAccess";

type CourseAccessResult = CourseAccess & { isLoading: boolean };

/**
 * Evalúa el acceso de varios cursos con una sola lectura de sesión y
 * suscripción. Lo usa el catálogo, que necesita el candado curso por curso:
 * con el acceso global un suscriptor de curso_estrategia veía todo abierto.
 */
export function useCourseAccessResolver() {
  const { user, isLoading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();

  return {
    isLoading: authLoading || subLoading,
    plan: subscription?.plan ?? null,
    resolve: (courseSlug?: string, isFreeCourse?: boolean) =>
      resolveCourseAccess({
        isAuthenticated: !!user,
        hasSubscription: !!subscription,
        plan: subscription?.plan ?? null,
        courseSlug,
        isFreeCourse,
      }),
  };
}

export function useCourseAccess(courseSlug?: string, course?: Course): CourseAccessResult {
  const { isLoading, resolve } = useCourseAccessResolver();
  return { isLoading, ...resolve(courseSlug, course?.is_free) };
}
