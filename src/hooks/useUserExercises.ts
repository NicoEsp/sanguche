import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface UserExercise {
  id: string;
  user_id: string;
  exercise_title: string;
  exercise_description: string | null;
  exercise_type: 'case_study' | 'practical' | 'theoretical';
  delivery_method: 'in_app';
  attachment_url: string | null;
  due_date: string | null;
  submission_text: string | null;
  submission_date: string | null;
  admin_feedback: string | null;
  status: 'assigned' | 'in_progress' | 'submitted' | 'reviewed';
  assigned_by_admin: string | null;
  created_at: string;
  updated_at: string;
}

// Hook para admin: obtener ejercicios de un usuario específico
export function useUserExercises(userId: string | null) {
  return useQuery({
    queryKey: ['user-exercises', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_exercises')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserExercise[];
    },
    enabled: !!userId
  });
}

// Hook para usuario: obtener sus propios ejercicios
export function useMyExercises() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['my-exercises'],
    queryFn: async () => {
      if (!user) return [];
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();
      
      if (!profile) return [];
      
      const { data, error } = await supabase
        .from('user_exercises')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as UserExercise[];
    },
    enabled: !!user
  });
}

// Mutation para crear ejercicio (admin)
export function useCreateExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (exercise: Omit<UserExercise, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await supabase
        .from('user_exercises')
        .insert([exercise])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-exercises'] });
      toast({
        title: "Ejercicio creado",
        description: "El ejercicio fue asignado correctamente"
      });
    },
    onError: (error) => {
      console.error('Error creating exercise:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo crear el ejercicio. Intenta nuevamente."
      });
    }
  });
}

// Mutation para actualizar ejercicio (admin o user)
export function useUpdateExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<UserExercise> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_exercises')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-exercises'] });
      queryClient.invalidateQueries({ queryKey: ['my-exercises'] });
      toast({
        title: "Ejercicio actualizado",
        description: "Los cambios fueron guardados correctamente"
      });
    },
    onError: (error) => {
      console.error('Error updating exercise:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el ejercicio. Intenta nuevamente."
      });
    }
  });
}

// Mutation para eliminar ejercicio (admin)
export function useDeleteExercise() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_exercises')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-exercises'] });
      toast({
        title: "Ejercicio eliminado",
        description: "El ejercicio fue eliminado correctamente"
      });
    },
    onError: (error) => {
      console.error('Error deleting exercise:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el ejercicio. Intenta nuevamente."
      });
    }
  });
}
