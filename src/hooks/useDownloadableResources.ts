import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { DownloadableResource } from '@/types/downloads';

export function useDownloadableResources() {
  return useQuery({
    queryKey: ['downloadable-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .select('*')
        .eq('is_active', true)
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

export async function getDownloadUrl(resource: DownloadableResource): Promise<string | null> {
  // Try to get signed URL from Supabase storage first
  const { data, error } = await supabase.storage
    .from(resource.bucket_name)
    .createSignedUrl(resource.file_path, 3600); // 1 hora de validez
  
  if (error || !data?.signedUrl) {
    // Fallback to public downloads folder if file not in bucket
    return `/downloads/${resource.file_path}`;
  }
  return data.signedUrl;
}
