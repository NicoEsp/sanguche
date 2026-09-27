import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { ProgressObjective } from '@/types/progress';

export interface UserProgressObjective extends Omit<ProgressObjective, 'mentorNotes' | 'dueDate'> {
  user_id: string;
  objective_id: string | null;
  assigned_by_admin: string | null;
  due_date: string | null;
  mentor_notes: string | null;
  created_at: string;
  updated_at: string;
  is_locked: boolean;
  locked_at: string | null;
  position: number;
}

type ObjectivesCache = UserProgressObjective[] | undefined;

/**
 * Un canal realtime por usuario, compartido por todos los componentes que usan
 * el hook. /progreso lo monta dos veces (la página y useRecommendedObjectives):
 * con un canal por instancia, realtime-js devolvía el mismo canal a la segunda,
 * que le agregaba su listener después del subscribe(), y al confirmar el join
 * el cliente veía más listeners que el servidor y se desuscribía. /progreso se
 * quedaba sin actualizaciones en vivo.
 */
const objectiveChannels = new Map<string, { channel: RealtimeChannel; users: number }>();

function subscribeToObjectives(userId: string, queryClient: QueryClient): () => void {
  const existing = objectiveChannels.get(userId);
  if (existing) {
    existing.users++;
  } else {
    const channel = supabase
      .channel(`user-objectives-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_progress_objectives',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          queryClient.setQueryData(['user-progress-objectives', userId], (old: ObjectivesCache) => {
            if (!old) return old;

            if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
              const row = payload.new as UserProgressObjective;
              // Reemplazo por id también en el INSERT: la mutación que creó el
              // objetivo ya invalidó la query, y si el refetch llegó antes que
              // el evento la fila estaría dos veces.
              const exists = old.some((obj) => obj.id === row.id);
              if (payload.eventType === 'UPDATE' && !exists) return old;
              return exists ? old.map((obj) => (obj.id === row.id ? row : obj)) : [...old, row];
            }
            if (payload.eventType === 'DELETE') {
              const removedId = (payload.old as Partial<UserProgressObjective>).id;
              return old.filter((obj) => obj.id !== removedId);
            }
            return old;
          });
        }
      )
      .subscribe();
    objectiveChannels.set(userId, { channel, users: 1 });
  }

  return () => {
    const entry = objectiveChannels.get(userId);
    if (!entry) return;
    entry.users--;
    if (entry.users === 0) {
      objectiveChannels.delete(userId);
      supabase.removeChannel(entry.channel);
    }
  };
}

/**
 * Query de los objetivos del usuario (userId es el id del perfil). La usan el
 * hook y el prefetch del sidebar: la copia que tenía el sidebar ordenaba
 * distinto y, si fallaba, dejaba en caché una lista vacía.
 */
export const userProgressObjectivesQuery = (userId: string | undefined) => ({
  queryKey: ['user-progress-objectives', userId] as const,
  queryFn: async (): Promise<UserProgressObjective[]> => {
    if (!userId) return [];

    const { data, error } = await supabase
      .from('user_progress_objectives')
      .select('id, user_id, objective_id, title, summary, type, timeframe, steps, status, due_date, mentor_notes, assigned_by_admin, created_at, updated_at, is_locked, locked_at, source, level, position')
      .eq('user_id', userId)
      .order('timeframe', { ascending: true })
      .order('position', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data as unknown as UserProgressObjective[];
  },
  staleTime: 2 * 60 * 1000,
});

// Fetch user's progress objectives
export function useUserProgressObjectives(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    ...userProgressObjectivesQuery(userId),
    enabled: !!userId,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Realtime maneja updates
  });

  useEffect(() => {
    if (!userId) return;
    return subscribeToObjectives(userId, queryClient);
  }, [userId, queryClient]);

  return query;
}

// Update user objective (admin can update all, users only custom)
export function useUpdateUserObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      userId,
      updates,
    }: {
      id: string;
      userId: string;
      updates: Record<string, any>;
    }) => {
      const { data, error } = await supabase
        .from('user_progress_objectives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    // Los updates optimistas y los errores los maneja cada llamada. Acá se deja
    // en caché la fila que devolvió la base, sin depender de que llegue el
    // evento de realtime (si el websocket no conecta, el cambio no se veía).
    onSuccess: (data, { userId }) => {
      queryClient.setQueryData<UserProgressObjective[]>(['user-progress-objectives', userId], (old) =>
        old?.map((obj) => (obj.id === data.id ? { ...obj, ...(data as unknown as UserProgressObjective) } : obj))
      );
    },
  });
}

// Delete user objective (admin can delete all, users only custom)
export function useDeleteUserObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, userId }: { id: string; userId: string }) => {
      const { error } = await supabase
        .from('user_progress_objectives')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress-objectives', variables.userId] });
      toast.success('Objetivo eliminado');
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        console.error('Error deleting objective:', error);
      }
      toast.error('No se pudo eliminar el objetivo. Intenta nuevamente.');
    },
  });
}

// Create custom user objective
export function useCreateUserObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      title,
      summary,
      type,
      timeframe,
      steps,
      dueDate,
      objectiveId = null,
      source = 'custom',
      status = 'not-started',
      mentorNotes = null,
    }: {
      userId: string;
      title: string;
      summary: string;
      type: string;
      timeframe: 'now' | 'soon' | 'later';
      steps: Array<{ id: string; title: string; completed: boolean }>;
      dueDate?: string;
      objectiveId?: string | null;
      source?: ProgressObjective['source'];
      status?: ProgressObjective['status'];
      mentorNotes?: string | null;
    }) => {
      const { data, error } = await supabase
        .from('user_progress_objectives')
        .insert({
          user_id: userId,
          objective_id: objectiveId,
          title,
          summary,
          type,
          steps,
          timeframe,
          source,
          status,
          due_date: dueDate || null,
          mentor_notes: mentorNotes,
          assigned_by_admin: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress-objectives', variables.userId] });
      const message = variables.objectiveId
        ? 'Objetivo agregado a tu Career Path'
        : 'Objetivo personalizado creado';
      toast.success(message);
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        console.error('Error creating custom objective:', error);
      }
      toast.error('No se pudo crear el objetivo. Intenta nuevamente.');
    },
  });
}
