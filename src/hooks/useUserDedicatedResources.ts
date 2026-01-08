import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

export type ResourceType = 'article' | 'podcast' | 'video' | 'course' | 'tool' | 'community' | 'other';
type DbResourceType = 'link' | 'video' | 'other' | 'document';

// Map frontend types to database types
const mapToDbType = (frontendType: ResourceType): DbResourceType => {
  switch (frontendType) {
    case 'video':
      return 'video';
    case 'other':
      return 'other';
    case 'article':
    case 'podcast':
    case 'course':
    case 'tool':
    case 'community':
    default:
      return 'link';
  }
};

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

// OPTIMIZED: Migrated from useState/useCallback to React Query for proper caching
export function useUserDedicatedResources(userId?: string) {
  const queryClient = useQueryClient();

  const { data: resources = [], isLoading: loading, error } = useQuery({
    queryKey: ['user-dedicated-resources', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('user_dedicated_resources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as DedicatedResource[];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  // Realtime subscription for updates
  useEffect(() => {
    if (!userId) return;

    const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const channelName = `user-dedicated-resources-${userId}-${uniqueSuffix}`;

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_dedicated_resources',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-dedicated-resources', userId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);

  return { 
    resources, 
    loading, 
    error: error?.message || null, 
    refetch: () => queryClient.invalidateQueries({ queryKey: ['user-dedicated-resources', userId] })
  };
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
          resource_type: mapToDbType(data.resource_type),
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
    mutationFn: async ({ id, resource_type, ...updates }: Partial<DedicatedResource> & { id: string }) => {
      const updateData = {
        ...updates,
        ...(resource_type && { resource_type: mapToDbType(resource_type as ResourceType) })
      };
      
      const { data, error } = await supabase
        .from('user_dedicated_resources')
        .update(updateData)
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
