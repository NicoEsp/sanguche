import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export type ResourceType = 'article' | 'podcast' | 'video' | 'course' | 'tool' | 'community' | 'other';

export interface DedicatedResource {
  id: string;
  user_id: string;
  resource_name: string;
  resource_type: ResourceType;
  external_url: string | null;
  file_url: string | null;
  description: string | null;
  created_by_admin: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDedicatedResourceData {
  user_id: string;
  resource_name: string;
  resource_type: ResourceType;
  external_url: string;
  description: string | null;
  created_by_admin: string;
}

export function useUserDedicatedResources(userId?: string) {
  const [resources, setResources] = useState<DedicatedResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('user_dedicated_resources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setResources((data || []) as DedicatedResource[]);
      setError(null);
    } catch (err) {
      if (import.meta.env.DEV) console.error('Error fetching dedicated resources:', err);
      setError('Error al cargar recursos dedicados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
  }, [userId]);

  return { resources, loading, error, refetch: fetchResources };
}

export function useCreateDedicatedResource() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateDedicatedResourceData) => {
      const { data: resource, error } = await supabase
        .from('user_dedicated_resources')
        .insert({
          user_id: data.user_id,
          resource_name: data.resource_name,
          resource_type: data.resource_type,
          external_url: data.external_url,
          description: data.description,
          created_by_admin: data.created_by_admin
        })
        .select()
        .single();

      if (error) throw error;
      return resource;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dedicated-resources'] });
      toast({
        title: "Recurso creado",
        description: "El recurso fue asignado exitosamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear el recurso",
        variant: "destructive"
      });
      if (import.meta.env.DEV) console.error('Error creating resource:', error);
    }
  });
}

export function useUpdateDedicatedResource() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<DedicatedResource> & { id: string }) => {
      const { data, error } = await supabase
        .from('user_dedicated_resources')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dedicated-resources'] });
      toast({
        title: "Recurso actualizado",
        description: "Los cambios fueron guardados exitosamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo actualizar el recurso",
        variant: "destructive"
      });
      if (import.meta.env.DEV) console.error('Error updating resource:', error);
    }
  });
}

export function useDeleteDedicatedResource() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('user_dedicated_resources')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dedicated-resources'] });
      toast({
        title: "Recurso eliminado",
        description: "El recurso fue eliminado exitosamente"
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo eliminar el recurso",
        variant: "destructive"
      });
      if (import.meta.env.DEV) console.error('Error deleting resource:', error);
    }
  });
}
