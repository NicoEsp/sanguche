import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { StarterPackResource, Audience, AccessState } from '@/types/starterpack';
import { useAuth } from '@/hooks/useAuth';
import { useSubscription } from '@/hooks/useSubscription';

export function useStarterPackResources(audience?: Audience) {
  const { data: resources = [], isLoading, error, refetch } = useQuery({
    queryKey: ['starterpack-resources', audience],
    queryFn: async () => {
      let query = supabase
        .from('starterpack_resources')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

      if (audience && audience !== 'both') {
        query = query.or(`audience.eq.${audience},audience.eq.both`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as StarterPackResource[];
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });

  // Separar recursos del stepper vs recursos adicionales
  const stepperResources = resources
    .filter(r => r.step_order !== null)
    .sort((a, b) => (a.step_order ?? 0) - (b.step_order ?? 0));

  const gridResources = resources
    .filter(r => r.step_order === null)
    .sort((a, b) => a.display_order - b.display_order);

  const featuredResources = resources.filter(r => r.is_featured);

  return {
    resources,
    stepperResources,
    gridResources,
    featuredResources,
    isLoading,
    error: error ? 'Error al cargar recursos' : null,
    refetch,
  };
}

export function useResourceAccess() {
  const { user, isAuthenticated } = useAuth();
  const { hasActivePremium } = useSubscription();

  const getAccessState = (resource: StarterPackResource): AccessState => {
    if (resource.access_type === 'public') return 'accessible';
    if (resource.access_type === 'requires_account' && !isAuthenticated) return 'requires_login';
    if (resource.access_type === 'premium' && !hasActivePremium) return 'requires_premium';
    return 'accessible';
  };

  const getDownloadUrl = async (resource: StarterPackResource): Promise<string | null> => {
    if (!resource.file_path) return null;

    // Para recursos públicos, usar URL pública
    if (resource.access_type === 'public') {
      const { data } = supabase.storage
        .from(resource.bucket_name)
        .getPublicUrl(resource.file_path);
      return data.publicUrl;
    }

    // Para recursos que requieren cuenta o premium, usar URL firmada
    const { data, error } = await supabase.storage
      .from(resource.bucket_name)
      .createSignedUrl(resource.file_path, 86400); // 24 horas

    if (error) {
      if (import.meta.env.DEV) console.error('Error getting signed URL:', error);
      return null;
    }

    return data.signedUrl;
  };

  const canAccess = (resource: StarterPackResource): boolean => {
    return getAccessState(resource) === 'accessible';
  };

  return {
    getAccessState,
    getDownloadUrl,
    canAccess,
    isAuthenticated,
    isPremium: hasActivePremium,
  };
}
