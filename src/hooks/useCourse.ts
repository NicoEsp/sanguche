import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CourseWithLessons } from "@/types/courses";

export function useCourse(slug: string) {
  return useQuery({
    queryKey: ["course", slug],
    queryFn: async (): Promise<CourseWithLessons | null> => {
      // Fetch course
      const { data: course, error: courseError } = await supabase
        .from("courses")
        .select("*")
        .eq("slug", slug)
        .eq("is_published", true)
        .single();

      if (courseError) {
        if (courseError.code === "PGRST116") {
          return null; // Not found
        }
        if (import.meta.env.DEV) console.error("Error fetching course:", courseError);
        throw courseError;
      }

      // Fetch lessons
      const { data: lessons, error: lessonsError } = await supabase
        .from("course_lessons")
        .select("*")
        .eq("course_id", course.id)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (lessonsError) {
        if (import.meta.env.DEV) console.error("Error fetching lessons:", lessonsError);
        throw lessonsError;
      }

      // Fetch exercises
      const { data: exercises, error: exercisesError } = await supabase
        .from("course_exercises")
        .select("*")
        .eq("course_id", course.id)
        .eq("is_published", true)
        .order("order_index", { ascending: true });

      if (exercisesError) {
        if (import.meta.env.DEV) console.error("Error fetching exercises:", exercisesError);
        throw exercisesError;
      }

      return {
        ...course,
        lessons: lessons || [],
        exercises: exercises || [],
      };
    },
    enabled: !!slug,
  });
}
