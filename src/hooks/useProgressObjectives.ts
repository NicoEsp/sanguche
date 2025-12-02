import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface ProgressObjective {
  id: string;
  title: string;
  summary: string;
  type: string;
  timeframe: 'now' | 'soon' | 'later';
  access_level?: 'free' | 'premium';
  steps: Array<{
    id: string;
    title: string;
    completed: boolean;
    description?: string;
  }>;
  level?: {
    current: number;
    target: number;
    label?: string;
  };
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// SECURITY: Fetch all progress objectives (public read access)
export function useProgressObjectives() {
  return useQuery({
    queryKey: ['progress-objectives'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('progress_objectives')
        .select('id, title, summary, type, timeframe, access_level, steps, level, display_order, is_active, created_at, updated_at')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as ProgressObjective[];
    },
    staleTime: 30 * 60 * 1000, // 30 minutes - catalog rarely changes
    gcTime: 60 * 60 * 1000, // 1 hour in cache
  });
}

// SECURITY: Real-time subscription for progress objectives
export function useProgressObjectivesRealtime() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel('progress_objectives_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'progress_objectives',
        },
        () => {
          // Invalidate query to refetch data
          queryClient.invalidateQueries({ queryKey: ['progress-objectives'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);
}

// SECURITY: Admin-only mutation - Create new objective
export function useCreateProgressObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (objective: Omit<ProgressObjective, 'id' | 'created_at' | 'updated_at'>) => {
      // SECURITY: RLS policy will verify admin status
      const { data, error } = await supabase
        .from('progress_objectives')
        .insert({
          title: objective.title,
          summary: objective.summary,
          type: objective.type,
          timeframe: objective.timeframe,
          access_level: objective.access_level || 'free',
          steps: objective.steps,
          level: objective.level,
          display_order: objective.display_order,
          is_active: true,
        })
        .select()
        .single();

      if (error) {
        // SECURITY: Check for permission denied
        if (error.code === '42501' || error.message.includes('permission')) {
          throw new Error('Unauthorized: Admin privileges required');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-objectives'] });
      toast.success('Objetivo creado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error creating objective:', error);
      toast.error('No se pudo crear el objetivo. Intenta nuevamente.');
    },
  });
}

// SECURITY: Admin-only mutation - Update objective
export function useUpdateProgressObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProgressObjective> & { id: string }) => {
      // SECURITY: RLS policy will verify admin status
      const { data, error } = await supabase
        .from('progress_objectives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === '42501' || error.message.includes('permission')) {
          throw new Error('Unauthorized: Admin privileges required');
        }
        throw error;
      }

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-objectives'] });
      toast.success('Objetivo actualizado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error updating objective:', error);
      toast.error('No se pudo actualizar el objetivo. Intenta nuevamente.');
    },
  });
}

// SECURITY: Admin-only mutation - Soft delete (set is_active = false)
export function useDeleteProgressObjective() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      // SECURITY: Soft delete to preserve data integrity
      const { error } = await supabase
        .from('progress_objectives')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        if (error.code === '42501' || error.message.includes('permission')) {
          throw new Error('Unauthorized: Admin privileges required');
        }
        throw error;
      }

      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-objectives'] });
      toast.success('Objetivo desactivado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error deleting objective:', error);
      toast.error('No se pudo desactivar el objetivo. Intenta nuevamente.');
    },
  });
}

// SECURITY: Admin-only mutation - Reorder objectives
export function useReorderProgressObjectives() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reorderedObjectives: Array<{ id: string; display_order: number }>) => {
      // SECURITY: Batch update display_order
      const updates = reorderedObjectives.map(({ id, display_order }) =>
        supabase
          .from('progress_objectives')
          .update({ display_order })
          .eq('id', id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);

      if (errors.length > 0) {
        const error = errors[0].error!;
        if (error.code === '42501' || error.message.includes('permission')) {
          throw new Error('Unauthorized: Admin privileges required');
        }
        throw error;
      }

      return reorderedObjectives;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progress-objectives'] });
      toast.success('Orden actualizado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error reordering objectives:', error);
      toast.error('No se pudo reordenar los objetivos. Intenta nuevamente.');
    },
  });
}
