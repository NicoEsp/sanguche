import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";
import type { Course } from "@/types/courses";

type CourseAccessResult = {
  hasAccess: boolean;
  isLoading: boolean;
  reason: "authenticated" | "no_subscription" | "wrong_plan" | "has_access" | "free_course";
  plan: string | null;
};

export function useCourseAccess(courseSlug?: string, course?: Course): CourseAccessResult {
  const { user, isLoading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();

  const isLoading = authLoading || subLoading;
  const plan = subscription?.plan ?? null;

  if (!user) {
    return { hasAccess: false, isLoading, reason: "authenticated", plan };
  }

  // Free courses are accessible to all authenticated users
  if (course?.is_free) {
    return { hasAccess: true, isLoading, reason: "free_course", plan };
  }

  if (!subscription) {
    return { hasAccess: false, isLoading, reason: "no_subscription", plan };
  }

  // cursos_all and repremium have access to all courses
  if (plan === "cursos_all" || plan === "repremium") {
    return { hasAccess: true, isLoading, reason: "has_access", plan };
  }

  // curso_estrategia only has access to the estrategia course
  if (plan === "curso_estrategia") {
    const hasAccess = courseSlug === "estrategia-producto-principiantes" || !courseSlug;
    return { 
      hasAccess, 
      isLoading, 
      reason: hasAccess ? "has_access" : "wrong_plan",
      plan
    };
  }

  // free and premium don't have course access
  return { hasAccess: false, isLoading, reason: "wrong_plan", plan };
}
