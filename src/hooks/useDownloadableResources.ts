import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DownloadableResource } from '@/types/downloads';
import { AssessmentResult, DomainKey } from '@/utils/scoring';

export function useDownloadableResources() {
  return useQuery({
    queryKey: ['downloadable-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .select('*')
        .eq('is_active', true)
        .is('condition_domain', null)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as DownloadableResource[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useDownloadableResourceBySlug(slug: string) {
  return useQuery({
    queryKey: ['downloadable-resource', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data as DownloadableResource | null;
    },
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useSkillGapsResources(assessmentResult: AssessmentResult | null) {
  const { data: resources = [], isLoading: loading, error } = useQuery({
    queryKey: ['skill-gaps-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .select('*')
        .eq('is_active', true)
        .not('condition_domain', 'is', null)
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as DownloadableResource[];
    },
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  const availableResources = useMemo(() => {
    if (!resources.length || !assessmentResult) return [];

    const allDomains = [
      ...assessmentResult.strengths,
      ...assessmentResult.gaps,
      ...assessmentResult.neutralAreas,
    ];

    return resources.filter(resource => {
      if (!resource.condition_domain) return false;
      const domainScore = allDomains.find(d => d.key === resource.condition_domain as DomainKey);
      if (!domainScore) return false;

      const minLevel = resource.condition_min_level ?? 1;
      const maxLevel = resource.condition_max_level ?? 5;
      return domainScore.value >= minLevel && domainScore.value <= maxLevel;
    });
  }, [resources, assessmentResult]);

  return { resources: availableResources, loading, error };
}

const PUBLIC_BUCKETS = new Set(['resources']);

export async function getDownloadUrl(resource: DownloadableResource): Promise<string | null> {
  if (PUBLIC_BUCKETS.has(resource.bucket_name)) {
    const { data } = supabase.storage
      .from(resource.bucket_name)
      .getPublicUrl(resource.file_path);
    return data?.publicUrl || null;
  }

  const { data, error } = await supabase.storage
    .from(resource.bucket_name)
    .createSignedUrl(resource.file_path, 3600);

  if (error || !data?.signedUrl) {
    return `/downloads/${resource.file_path}`;
  }
  return data.signedUrl;
}
