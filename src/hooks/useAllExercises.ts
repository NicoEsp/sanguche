import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ExerciseWithUser {
  id: string;
  user_id: string;
  exercise_title: string;
  exercise_description: string | null;
  exercise_type: string | null;
  status: string | null;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  submission_date: string | null;
  submission_text: string | null;
  admin_feedback: string | null;
  user_name: string | null;
  user_email: string | null;
}

export function useAllExercises() {
  return useQuery({
    queryKey: ['all-exercises'],
    queryFn: async (): Promise<ExerciseWithUser[]> => {
      // First get all exercises
      const { data: exercises, error: exercisesError } = await supabase
        .from('user_exercises')
        .select('*')
        .order('created_at', { ascending: false });

      if (exercisesError) throw exercisesError;
      if (!exercises || exercises.length === 0) return [];

      // Get unique user IDs
      const userIds = [...new Set(exercises.map(e => e.user_id))];

      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map for quick lookup
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine exercises with user info
      return exercises.map(exercise => ({
        ...exercise,
        user_name: profileMap.get(exercise.user_id)?.name || null,
        user_email: profileMap.get(exercise.user_id)?.email || null,
      }));
    },
  });
}
