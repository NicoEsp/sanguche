import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { ProgressObjective } from '@/types/progress';

export interface UserProgressObjective extends Omit<ProgressObjective, 'mentorNotes'> {
  user_id: string;
  objective_id: string | null;
  assigned_by_admin: string | null;
  due_date: string | null;
  mentor_notes: string | null;
  created_at: string;
  updated_at: string;
  is_locked: boolean;
  locked_at: string | null;
}

// Fetch user's progress objectives
export function useUserProgressObjectives(userId: string | undefined) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['user-progress-objectives', userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from('user_progress_objectives')
        .select('id, user_id, objective_id, title, summary, type, timeframe, steps, status, due_date, mentor_notes, assigned_by_admin, created_at, updated_at, is_locked, locked_at, source, level')
        .eq('user_id', userId)
        .order('timeframe', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as unknown as UserProgressObjective[];
    },
    enabled: !!userId,
  });

  // Setup realtime subscription
  useEffect(() => {
    if (!userId) return;

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
          console.log('Realtime update for user objectives:', payload);
          queryClient.invalidateQueries({ queryKey: ['user-progress-objectives', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return query;
}

// Assign objective from catalog (admin only)
export function useAssignObjective() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      userId,
      objectiveId,
      timeframe,
      mentorNotes,
      dueDate,
    }: {
      userId: string;
      objectiveId: string;
      timeframe: 'now' | 'soon' | 'later';
      mentorNotes?: string;
      dueDate?: string;
    }) => {
      // Get admin's profile ID
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!adminProfile) throw new Error('Admin profile not found');

      // Fetch the global objective
      const { data: globalObjective, error: fetchError } = await supabase
        .from('progress_objectives')
        .select('*')
        .eq('id', objectiveId)
        .single();

      if (fetchError) throw fetchError;
      if (!globalObjective) throw new Error('Objetivo no encontrado');

      // Check if already assigned
      const { data: existing } = await supabase
        .from('user_progress_objectives')
        .select('id')
        .eq('user_id', userId)
        .eq('objective_id', objectiveId)
        .maybeSingle();

      if (existing) {
        throw new Error('Este objetivo ya está asignado al usuario');
      }

      // Create user objective
      const { data, error } = await supabase
        .from('user_progress_objectives')
        .insert({
          user_id: userId,
          objective_id: objectiveId,
          title: globalObjective.title,
          summary: globalObjective.summary,
          type: globalObjective.type,
          steps: globalObjective.steps,
          level: globalObjective.level,
          timeframe,
          source: 'mentor',
          status: 'not-started',
          mentor_notes: mentorNotes || null,
          due_date: dueDate || null,
          assigned_by_admin: adminProfile.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress-objectives', variables.userId] });
      toast.success('Objetivo asignado exitosamente');
    },
    onError: (error: Error) => {
      console.error('Error assigning objective:', error);
      toast.error(error.message || 'Error al asignar objetivo');
    },
  });
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress-objectives', variables.userId] });
      toast.success('Objetivo actualizado');
    },
    onError: (error: Error) => {
      console.error('Error updating objective:', error);
      toast.error('Error al actualizar objetivo');
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
      console.error('Error deleting objective:', error);
      toast.error('Error al eliminar objetivo');
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
    }: {
      userId: string;
      title: string;
      summary: string;
      type: string;
      timeframe: 'now' | 'soon' | 'later';
      steps: Array<{ id: string; title: string; completed: boolean }>;
      dueDate?: string;
    }) => {
      const { data, error } = await supabase
        .from('user_progress_objectives')
        .insert({
          user_id: userId,
          objective_id: null, // Custom objectives don't reference global catalog
          title,
          summary,
          type,
          steps,
          timeframe,
          source: 'custom',
          status: 'not-started',
          due_date: dueDate || null,
          mentor_notes: null,
          assigned_by_admin: null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-progress-objectives', variables.userId] });
      toast.success('Objetivo personalizado creado');
    },
    onError: (error: Error) => {
      console.error('Error creating custom objective:', error);
      toast.error('Error al crear objetivo');
    },
  });
}
