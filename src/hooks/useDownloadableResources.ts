import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { DownloadableResource } from '@/types/downloads';
import { AssessmentResult, DomainKey } from '@/utils/scoring';

export type ResourceAccessState = 'accessible' | 'requires_login' | 'requires_subscription';

export interface ResourceViewer {
  isAuthenticated: boolean;
  /**
   * Debe ser el `hasActivePremium` de useSubscription, no `isPremiumPlan(plan)`:
   * la policy de storage exige suscripción vigente, así que un premium cancelado
   * ve la card abierta pero la descarga le falla si nos guiamos solo por el plan.
   */
  isPremium: boolean;
}

/**
 * Única fuente de verdad de qué puede abrir un usuario. La metadata de todos los
 * recursos activos es pública (ver 20260811120000_align_downloadable_metadata_visibility),
 * así que quien reciba una fila tiene que decidir por su cuenta si la muestra
 * abierta, bloqueada o directamente no la muestra.
 */
export function getResourceAccessState(
  resource: Pick<DownloadableResource, 'access_level'>,
  viewer: ResourceViewer,
): ResourceAccessState {
  switch (resource.access_level) {
    case 'public':
      return 'accessible';
    case 'authenticated':
      return viewer.isAuthenticated ? 'accessible' : 'requires_login';
    case 'premium':
      return viewer.isPremium ? 'accessible' : 'requires_subscription';
    default:
      return 'accessible';
  }
}

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
  const { isAuthenticated } = useAuth();
  const {
    hasActivePremium,
    loading: subscriptionLoading,
    isError: subscriptionFailed,
  } = useSubscription();

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

    const viewer = { isAuthenticated, isPremium: hasActivePremium === true };

    return resources.filter(resource => {
      // Estas recomendaciones no tienen estado bloqueado: cada card ofrece Ver y
      // Descargar funcionando. Como la query ahora devuelve también lo que el
      // usuario no puede abrir, filtramos acá en vez de prometer una descarga
      // que storage va a rechazar.
      if (getResourceAccessState(resource, viewer) !== 'accessible') return false;

      if (!resource.condition_domain) return false;
      const domainScore = allDomains.find(d => d.key === resource.condition_domain as DomainKey);
      if (!domainScore) return false;

      const minLevel = resource.condition_min_level ?? 1;
      const maxLevel = resource.condition_max_level ?? 5;
      return domainScore.value >= minLevel && domainScore.value <= maxLevel;
    });
  }, [resources, assessmentResult, isAuthenticated, hasActivePremium]);

  // Esperamos también a la suscripción: sin esto un premium ve la lista sin sus
  // recursos premium por un instante y después aparecen.
  //
  // Pero no la esperamos si la query falló. useSubscription deja `loading` en
  // true para siempre cuando isError (mete el error adentro del loading a
  // propósito), y acá eso sería un skeleton eterno que además esconde los
  // recursos públicos y de cuenta, que no dependen de la suscripción. Si falló,
  // seguimos sin ella: se pierden las recomendaciones premium, no la lista.
  const waitingForSubscription = subscriptionLoading && !subscriptionFailed;

  return { resources: availableResources, loading: loading || waitingForSubscription, error };
}

const PUBLIC_BUCKETS = new Set(['resources']);

// Storage keys must match the literal object name. Some legacy rows landed
// URL-encoded (e.g. "Reflexiones%20sobre..." instead of "Reflexiones sobre...")
// and Storage rejected them with InvalidKey. Decode defensively so a future
// bad upload doesn't silently break the download UX.
export function normalizeStoragePath(path: string): string {
  if (!path.includes('%')) return path;
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}

export async function getDownloadUrl(resource: DownloadableResource): Promise<string | null> {
  const filePath = normalizeStoragePath(resource.file_path);

  if (PUBLIC_BUCKETS.has(resource.bucket_name)) {
    const { data } = supabase.storage
      .from(resource.bucket_name)
      .getPublicUrl(filePath);
    return data?.publicUrl || null;
  }

  const { data, error } = await supabase.storage
    .from(resource.bucket_name)
    .createSignedUrl(filePath, 3600);

  if (error || !data?.signedUrl) {
    return `/downloads/${filePath}`;
  }
  return data.signedUrl;
}

export type ResolvedResource = { url: string } | { error: 'no-url' | 'unreachable' };

// Resolve the URL AND verify it actually serves the file. A misconfigured key
// makes Storage answer with a JSON error body that an <iframe> happily renders
// as raw text — that's the exact "InvalidKey" screen a user hit. We probe with
// HEAD and reject JSON/error responses before showing the preview. Network
// failures (e.g. CORS) fall through to best-effort so we never block a
// download that would otherwise work.
export async function resolveResourceUrl(resource: DownloadableResource): Promise<ResolvedResource> {
  const url = await getDownloadUrl(resource);
  if (!url) return { error: 'no-url' };

  try {
    const res = await fetch(url, { method: 'HEAD' });
    // Some CDNs/servers don't allow HEAD (405/501). That tells us nothing about
    // the resource itself, so don't block — let the consumer's GET try.
    const headNotSupported = res.status === 405 || res.status === 501;
    if (!headNotSupported) {
      const contentType = res.headers.get('content-type') ?? '';
      if (!res.ok || contentType.includes('application/json')) {
        return { error: 'unreachable' };
      }
    }
  } catch {
    // Probe failed (offline / CORS). Don't block — let the consumer try the url.
    return { url };
  }

  return { url };
}
