import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { AssessmentResult } from '@/utils/scoring';
import { shouldShowResource } from '@/utils/resourceFilters';
import { useEffect, useMemo } from 'react';

export interface Resource {
  id: string;
  name: string;
  file_url: string;
  visibility_type: 'public' | 'conditional';
  condition_domain: string | null;
  condition_min_level: number | null;
  condition_max_level: number | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  access_level: 'public' | 'authenticated' | 'premium';
  bucket_name: string;
}

export function useResources() {
  const { data: resources = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ['resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('resources')
        .select('id, name, file_url, visibility_type, condition_domain, condition_min_level, condition_max_level, display_order, is_active, access_level, bucket_name, created_at, updated_at')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return (data || []) as Resource[];
    },
    staleTime: 60 * 1000, // keep cache fresh and allow quick updates
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000,
  });

  useEffect(() => {
    const channel = supabase
      .channel('resources-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'resources',
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  return {
    resources,
    loading,
    error: error ? 'Error al cargar recursos' : null,
    refetch
  };
}

export function useAvailableResources(assessmentResult: AssessmentResult | null) {
  const { resources, loading, error } = useResources();

  const availableResources = useMemo(() => {
    if (!resources.length) return [];

    return resources.filter(resource => {
      if (!resource.is_active) return false;
      return shouldShowResource(resource, assessmentResult);
    });
  }, [resources, assessmentResult]);

  return { resources: availableResources, loading, error };
}
