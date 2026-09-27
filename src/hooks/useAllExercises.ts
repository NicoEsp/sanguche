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
      // Ejercicios con su usuario en un solo request. Antes eran dos en fila
      // y el segundo mandaba todos los ids en la URL (.in): con un par de
      // cientos de usuarios con ejercicios, la URL pasaba el límite y la
      // pantalla fallaba. La tabla tiene dos FKs a profiles, de ahí el nombre.
      const { data, error } = await supabase
        .from('user_exercises')
        .select('*, owner:profiles!exercise_requests_user_id_fkey(name, email)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data ?? []).map(({ owner, ...exercise }) => ({
        ...exercise,
        user_name: owner?.name || null,
        user_email: owner?.email || null,
      }));
    },
  });
}
