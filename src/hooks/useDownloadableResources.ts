import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { DownloadableResource } from '@/types/downloads';
import { AssessmentResult } from '@/utils/scoring';
import { RecommendedResource, rankResourcesByAffinity } from '@/utils/resourceRecommendations';

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

/**
 * Catálogo completo de /descargables. `condition_domain` ya no esconde un
 * recurso de acá: es solo la competencia que trabaja, y sirve para elegir cuál
 * recomendarle a cada persona en /mejoras. Un material bueno tiene que estar
 * en las dos partes.
 */
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

/**
 * Descargables ordenados por afinidad con el resultado de la evaluación. El
 * primero es el más afín; ver rankResourcesByAffinity para el criterio.
 */
export function useSkillGapsResources(
  assessmentResult: AssessmentResult | null,
): { recommendations: RecommendedResource[]; loading: boolean; error: unknown } {
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

  const recommendations = useMemo(() => {
    if (!resources.length || !assessmentResult) return [];

    const viewer = { isAuthenticated, isPremium: hasActivePremium === true };

    // Estas recomendaciones no tienen estado bloqueado: cada card ofrece Ver y
    // Descargar funcionando. Como la query devuelve también lo que el usuario
    // no puede abrir, filtramos acá en vez de prometer una descarga que storage
    // va a rechazar.
    const openable = resources.filter(
      resource => getResourceAccessState(resource, viewer) === 'accessible',
    );

    return rankResourcesByAffinity(openable, assessmentResult);
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

  return { recommendations, loading: loading || waitingForSubscription, error };
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
    // Un bucket público sirve el archivo a cualquiera que tenga la URL, así que
    // un recurso con cuenta o Premium ahí adentro está mal cargado: hay que
    // moverlo a `downloads`, no entregarlo.
    if (resource.access_level !== 'public') return null;
    const { data } = supabase.storage
      .from(resource.bucket_name)
      .getPublicUrl(filePath);
    return data?.publicUrl || null;
  }

  // Sin fallback: acá antes se devolvía `/downloads/<archivo>`, un estático
  // del sitio que se servía sin sesión ni plan. Si storage no firma la URL, el
  // recurso está mal cargado y hay que decirlo, no regalarlo.
  const { data, error } = await supabase.storage
    .from(resource.bucket_name)
    .createSignedUrl(filePath, 3600);

  return error ? null : data?.signedUrl ?? null;
}

export type ResourceUrlError = 'no-url' | 'unreachable' | 'unsupported-type';

// Tipos que el navegador ejecuta como documento; ver resolveResourceUrl.
const SCRIPTABLE_TYPES = ['text/html', 'application/xhtml+xml', 'image/svg+xml'];
export type ResolvedResource = { url: string } | { error: ResourceUrlError };

/**
 * Resuelve la URL y verifica con un HEAD que del otro lado haya un archivo
 * servible antes de entregarla a la vista previa o a la descarga.
 *
 * Con una key mal cargada, storage responde un JSON de error que el iframe
 * pinta como texto (la pantalla "InvalidKey" que vio un usuario). Y como el
 * iframe va sin sandbox (los visores de PDF no renderizan dentro de uno
 * sandboxed), tampoco se abre nada que el navegador ejecute como documento.
 * Si el HEAD no se puede hacer, no hay forma de saber qué hay del otro lado
 * y no se abre: storage soporta HEAD y CORS, así que fallar acá es un
 * problema real del recurso o de la red, no un CDN raro.
 */
export async function resolveResourceUrl(resource: DownloadableResource): Promise<ResolvedResource> {
  const url = await getDownloadUrl(resource);
  if (!url) return { error: 'no-url' };

  let res: Response;
  try {
    res = await fetch(url, { method: 'HEAD' });
  } catch {
    return { error: 'unreachable' };
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!res.ok || contentType.includes('application/json')) return { error: 'unreachable' };
  if (!contentType || SCRIPTABLE_TYPES.some((type) => contentType.includes(type))) {
    return { error: 'unsupported-type' };
  }
  return { url };
}

export type ResourceOpenError = ResourceUrlError | 'popup-blocked';

/**
 * Abre el recurso en una pestaña nueva y devuelve por qué falló, o null si se
 * abrió. La pestaña se abre en blanco antes del primer await: si se abriera
 * después de resolver la URL, el navegador la bloquea como popup porque ya no
 * la asocia al click.
 */
export async function openResourceInNewTab(
  resource: DownloadableResource,
): Promise<ResourceOpenError | null> {
  const win = window.open('about:blank', '_blank');
  if (win) win.opener = null;

  const resolved = await resolveResourceUrl(resource);
  if ('error' in resolved) {
    win?.close();
    return resolved.error;
  }
  if (!win) return 'popup-blocked';

  win.location.href = resolved.url;
  return null;
}

export function resourceErrorMessage(reason: ResourceOpenError): string {
  return reason === 'popup-blocked'
    ? 'Tu navegador bloqueó la descarga. Habilitá popups para este sitio.'
    : 'No pudimos abrir este recurso. Intentá de nuevo o escribinos a nicoproducto@hey.com.';
}
