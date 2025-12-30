import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/hooks/useAuth";

type CourseAccessResult = {
  hasAccess: boolean;
  isLoading: boolean;
  reason: "authenticated" | "no_subscription" | "wrong_plan" | "has_access";
};

export function useCourseAccess(courseSlug?: string): CourseAccessResult {
  const { user, isLoading: authLoading } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();

  const isLoading = authLoading || subLoading;

  if (!user) {
    return { hasAccess: false, isLoading, reason: "authenticated" };
  }

  if (!subscription) {
    return { hasAccess: false, isLoading, reason: "no_subscription" };
  }

  const plan = subscription.plan;

  // cursos_all and repremium have access to all courses
  if (plan === "cursos_all" || plan === "repremium") {
    return { hasAccess: true, isLoading, reason: "has_access" };
  }

  // curso_estrategia only has access to the estrategia course
  if (plan === "curso_estrategia") {
    const hasAccess = courseSlug === "estrategia-producto-principiantes" || !courseSlug;
    return { 
      hasAccess, 
      isLoading, 
      reason: hasAccess ? "has_access" : "wrong_plan" 
    };
  }

  // free and premium don't have course access
  return { hasAccess: false, isLoading, reason: "wrong_plan" };
}
