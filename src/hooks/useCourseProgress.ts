import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { UserCourseProgress, CourseProgress, LessonWithProgress, CourseLesson } from "@/types/courses";
import { useAuth } from "@/hooks/useAuth";

export function useCourseProgress(courseId: string, lessons: CourseLesson[] = []) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // OPTIMIZED: Added staleTime/gcTime for better caching
  const progressQuery = useQuery({
    queryKey: ["course-progress", courseId, user?.id],
    queryFn: async (): Promise<UserCourseProgress[]> => {
      if (!user) return [];

      const lessonIds = lessons.map((l) => l.id);
      if (lessonIds.length === 0) return [];

      const { data, error } = await supabase
        .from("user_course_progress")
        .select("*")
        .in("lesson_id", lessonIds);

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

  // Calculate progress stats
  const progressStats: CourseProgress = {
    totalLessons: lessons.length,
    completedLessons: progressQuery.data?.filter((p) => p.completed_at !== null).length || 0,
    progressPercentage: lessons.length > 0
      ? Math.round(((progressQuery.data?.filter((p) => p.completed_at !== null).length || 0) / lessons.length) * 100)
      : 0,
    isCompleted: lessons.length > 0 && 
      (progressQuery.data?.filter((p) => p.completed_at !== null).length || 0) === lessons.length,
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
      const { data: existingProgress, error: fetchError } = await supabase
        .from("user_course_progress")
        .select("*")
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
        // Insert new - need to get profile id first
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .single();

        if (!profile) throw new Error("Profile not found");

        const { data, error } = await supabase
          .from("user_course_progress")
          .insert({
            user_id: profile.id,
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
