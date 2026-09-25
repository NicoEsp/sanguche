import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CourseWithLessons } from "@/types/courses";

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: async (): Promise<CourseWithLessons | null> => {
      // Curso, lecciones y ejercicios en un solo request: antes eran tres en
      // fila (las lecciones y los ejercicios esperaban el id del curso). Los
      // filtros sobre los embeds recortan esas listas, no el curso.
      const { data, error } = await supabase
        .from("courses")
        .select("*, course_lessons(*), course_exercises(*)")
        .eq("slug", slug)
        .eq("is_published", true)
        .eq("course_lessons.is_published", true)
        .eq("course_exercises.is_published", true)
        .order("order_index", { referencedTable: "course_lessons", ascending: true })
        .order("order_index", { referencedTable: "course_exercises", ascending: true })
        .maybeSingle();

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching course:", error);
        throw error;
      }

      if (!data) return null; // Not found

      const { course_lessons, course_exercises, ...course } = data;
      return {
        ...course,
        lessons: (course_lessons ?? []).map((l) => ({
          ...l,
          video_type: l.video_type as 'external' | 'storage',
        })),
        exercises: course_exercises ?? [],
      };
    },
    enabled: !!slug,
  });
}
