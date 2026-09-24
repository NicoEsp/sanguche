import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserCourseProgress, CourseProgress, LessonWithProgress, CourseLesson } from "@/types/courses";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";

export function useCourseProgress(courseId: string, lessons: CourseLesson[] = []) {
  const { user } = useAuth();

  // OPTIMIZED: Added staleTime/gcTime for better caching
  const progressQuery = useQuery({
    queryKey: ["course-progress", courseId, user?.id],
    queryFn: async (): Promise<UserCourseProgress[]> => {
      if (!user) return [];

      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return [];

      // Filtrado por el usuario y no solo por la RLS: un admin puede leer el
      // progreso de todos y veía como completadas lecciones de otras personas.
      const { data, error } = await supabase
        .from("user_course_progress")
        .select("*, profiles!inner(user_id)")
        .in("lesson_id", lessonIds)
        .eq("profiles.user_id", user.id);

      if (error) {
        if (import.meta.env.DEV) console.error("Error fetching course progress:", error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user && !!courseId && lessons.length > 0,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const completedLessons = progressQuery.data?.filter((p) => p.completed_at !== null).length || 0;

  // Calculate progress stats
  const progressStats: CourseProgress = {
    totalLessons: lessons.length,
    completedLessons,
    progressPercentage: lessons.length > 0
      ? Math.round((completedLessons / lessons.length) * 100)
      : 0,
    isCompleted: lessons.length > 0 && completedLessons === lessons.length,
  };

  // Get lessons with progress attached
  const lessonsWithProgress: LessonWithProgress[] = lessons.map((lesson) => {
    const progress = progressQuery.data?.find((p) => p.lesson_id === lesson.id) || null;
    return {
      ...lesson,
      progress,
      isCompleted: progress?.completed_at !== null,
    };
  });

  return {
    ...progressQuery,
    progressStats,
    lessonsWithProgress,
  };
}

export function useUpdateLessonProgress() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useUserProfile();

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
      // Un solo upsert sobre (user_id, lesson_id), que es única. Antes eran
      // hasta tres round trips en fila (buscar el progreso, buscar el perfil,
      // escribir), y las dos búsquedas iban sin filtro por usuario: para un
      // admin, que por RLS ve todas las filas, fallaban.
      let profileId = profile?.id;
      if (!profileId) {
        if (!user) throw new Error("No hay usuario autenticado");
        const { data, error } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .single();
        if (error || !data) throw error ?? new Error("Profile not found");
        profileId = data.id;
      }

      // Solo van las columnas que cambian: en el upsert, las que no están en
      // el payload no se tocan si la fila ya existe.
      const row: {
        user_id: string;
        lesson_id: string;
        progress_seconds?: number;
        completed_at?: string;
      } = { user_id: profileId, lesson_id: lessonId };
      if (progressSeconds !== undefined) row.progress_seconds = progressSeconds;
      if (completed) row.completed_at = new Date().toISOString();

      const { data, error } = await supabase
        .from("user_course_progress")
        .upsert(row, { onConflict: "user_id,lesson_id" })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["course-progress"] });
    },
  });
}
