import type {
  CourseLesson,
  CourseProgress,
  LessonWithProgress,
  UserCourseProgress,
} from "@/types/courses";

/**
 * Cómo se lee el progreso de un curso a partir de las filas guardadas.
 *
 * Pura y fuera del hook para poder testearla: useCourseProgress importa el
 * cliente de Supabase, que explota al importarse sin credenciales.
 */

/** Una lección cuenta como vista sólo si tiene fecha de completado. */
const isLessonCompleted = (row?: UserCourseProgress | null) => !!row?.completed_at;

export function summarizeCourseProgress(
  lessons: CourseLesson[],
  rows: UserCourseProgress[] = [],
): CourseProgress {
  // Se cuentan las lecciones del curso, no las filas: una fila huérfana de una
  // lección despublicada no debería empujar el porcentaje por encima de 100.
  const completed = lessons.filter((lesson) =>
    isLessonCompleted(rows.find((r) => r.lesson_id === lesson.id)),
  ).length;

  return {
    totalLessons: lessons.length,
    completedLessons: completed,
    progressPercentage: lessons.length > 0 ? Math.round((completed / lessons.length) * 100) : 0,
    isCompleted: lessons.length > 0 && completed === lessons.length,
  };
}

export function attachProgress(
  lessons: CourseLesson[],
  rows: UserCourseProgress[] = [],
): LessonWithProgress[] {
  return lessons.map((lesson) => {
    const progress = rows.find((r) => r.lesson_id === lesson.id) || null;
    return {
      ...lesson,
      progress,
      // Sin fila, `progress?.completed_at` es undefined. Con la comparación
      // `!== null` eso daba true y marcaba como vista toda lección sin
      // registro: la tarjeta decía 0/6 y las seis aparecían tildadas.
      isCompleted: isLessonCompleted(progress),
    };
  });
}
