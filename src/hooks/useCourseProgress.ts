import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserCourseProgress, CourseProgress, LessonWithProgress, CourseLesson } from "@/types/courses";
import { useUserProfile } from "@/hooks/useUserProfile";
import { attachProgress, summarizeCourseProgress } from "@/utils/courseProgress";

export function useCourseProgress(courseId: string, lessons: CourseLesson[] = []) {
  const { profile } = useUserProfile();
  const profileId = profile?.id;
  const queryClient = useQueryClient();

  // OPTIMIZED: Added staleTime/gcTime for better caching
  const progressQuery = useQuery({
    queryKey: ["course-progress", courseId, profileId],
    queryFn: async (): Promise<UserCourseProgress[]> => {
      if (!profileId) return [];

      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return [];

      // El filtro por user_id va explícito y no delegado a la RLS: un admin
      // tiene una policy que le deja ver todas las filas, así que sin esto
      // vería el progreso de todos mezclado como si fuera propio.
      const { data, error } = await supabase
        .from("user_course_progress")
        .select("*")
        .eq("user_id", profileId)
        .in("lesson_id", lessonIds);

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching course progress:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!profileId && !!courseId && lessons.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const progressStats = summarizeCourseProgress(lessons, progressQuery.data);
  const lessonsWithProgress = attachProgress(lessons, progressQuery.data);

  return {
    ...progressQuery,
    progressStats,
    lessonsWithProgress,
  };
}

export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const profileId = profile?.id;

  return useMutation({
    mutationFn: async ({
      lessonId,
      progressSeconds,
      completed,
    }: {
      lessonId: string;
      progressSeconds?: number;
      completed?: boolean;
    }) => {
      if (!profileId) throw new Error("Profile not found");

      // El filtro por user_id va explícito y no delegado a la RLS: un admin
      // ve todas las filas por policy, así que sin esto maybeSingle revienta
      // en cuanto otra persona tenga progreso en la misma lección.
      const { data: existingProgress, error: fetchError } = await supabase
        .from("user_course_progress")
        .select("*")
        .eq("user_id", profileId)
        .eq("lesson_id", lessonId)
        .maybeSingle();

      if (fetchError) {
        if (import.meta.env.DEV) console.error("Error fetching existing progress:", fetchError);
        throw fetchError;
      }

      const updateData: Record<string, unknown> = {};
      if (progressSeconds !== undefined) {
        updateData.progress_seconds = progressSeconds;
      }
      if (completed) {
        updateData.completed_at = new Date().toISOString();
      }

      if (existingProgress) {
        // Update existing
        const { data, error } = await supabase
          .from("user_course_progress")
          .update(updateData)
          .eq("id", existingProgress.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        const { data, error } = await supabase
          .from("user_course_progress")
          .insert({
            user_id: profileId,
            lesson_id: lessonId,
            progress_seconds: progressSeconds || 0,
            completed_at: completed ? new Date().toISOString() : null,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-progress"] });
    },
  });
}
