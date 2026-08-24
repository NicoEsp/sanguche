/**
 * Quién puede ver qué curso. Regla pura, sin hooks ni Supabase, para que se
 * pueda evaluar curso por curso y testear sin levantar el cliente.
 *
 * Vive acá y no en useCourseAccess.ts porque ese módulo importa
 * useSubscription, que importa el cliente de Supabase y explota al importarse
 * sin credenciales.
 */

export type CourseAccessReason =
  | "authenticated"
  | "no_subscription"
  | "wrong_plan"
  | "has_access"
  | "free_course";

export type CourseAccess = {
  hasAccess: boolean;
  reason: CourseAccessReason;
  plan: string | null;
};

/** El único curso que abre el plan curso_estrategia. */
export const CURSO_ESTRATEGIA_SLUG = "estrategia-producto-principiantes";

export type CourseAccessInput = {
  isAuthenticated: boolean;
  hasSubscription: boolean;
  plan: string | null;
  /** Sin slug la pregunta es "¿tiene acceso a algún curso pago?" (banners). */
  courseSlug?: string;
  isFreeCourse?: boolean;
};

export function resolveCourseAccess({
  isAuthenticated,
  hasSubscription,
  plan,
  courseSlug,
  isFreeCourse,
}: CourseAccessInput): CourseAccess {
  if (!isAuthenticated) {
    return { hasAccess: false, reason: "authenticated", plan };
  }

  // Los cursos gratis los abre cualquier usuario autenticado.
  if (isFreeCourse) {
    return { hasAccess: true, reason: "free_course", plan };
  }

  if (!hasSubscription) {
    return { hasAccess: false, reason: "no_subscription", plan };
  }

  // cursos_all y repremium abren todo el catálogo.
  if (plan === "cursos_all" || plan === "repremium") {
    return { hasAccess: true, reason: "has_access", plan };
  }

  // curso_estrategia abre sólo el suyo. Sin slug se responde la pregunta
  // global —tiene acceso a algún curso— que es true.
  if (plan === "curso_estrategia") {
    const hasAccess = !courseSlug || courseSlug === CURSO_ESTRATEGIA_SLUG;
    return { hasAccess, reason: hasAccess ? "has_access" : "wrong_plan", plan };
  }

  // free y premium no incluyen cursos.
  return { hasAccess: false, reason: "wrong_plan", plan };
}
