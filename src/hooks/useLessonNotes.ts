import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useUserProfile } from './useUserProfile';

interface LessonNote {
  id: string;
  user_id: string;
  lesson_id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function useLessonNote(lessonId: string | null) {
  const { profile } = useUserProfile();

  return useQuery({
    queryKey: ['lesson-note', lessonId, profile?.id],
    queryFn: async () => {
      if (!profile?.id || !lessonId) return null;

      const { data, error } = await supabase
        .from('lesson_notes')
        .select('*')
        .eq('user_id', profile.id)
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (error) throw error;
      return data as LessonNote | null;
    },
    enabled: !!profile?.id && !!lessonId,
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useUpdateLessonNote() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();

  return useMutation({
    mutationFn: async ({ lessonId, content }: { lessonId: string; content: string }) => {
      if (!profile?.id) throw new Error('No profile found');

      const { data, error } = await supabase
        .from('lesson_notes')
        .upsert(
          {
            user_id: profile.id,
            lesson_id: lessonId,
            content,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,lesson_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['lesson-note', variables.lessonId, profile?.id], data);
    },
  });
}
