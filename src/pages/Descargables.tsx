import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Seo } from '@/components/Seo';
import { CardAction, DownloadableCard } from '@/components/downloads/DownloadableCard';
import {
  ResourcePreview,
  ResourcePreviewDialog,
} from '@/components/downloads/ResourcePreviewDialog';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentData } from '@/hooks/useAssessmentData';
import { useSubscription } from '@/hooks/useSubscription';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import {
  ResourceOpenError,
  getResourceAccessState,
  openResourceInNewTab,
  resolveResourceUrl,
  resourceErrorMessage,
  useDownloadableResources,
} from '@/hooks/useDownloadableResources';
import { Mixpanel } from '@/lib/mixpanel';
import { DownloadableAccessLevel, DownloadableResource } from '@/types/downloads';

type AccessFilter = 'all' | DownloadableAccessLevel;

const ACCESS_FILTERS: { value: AccessFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'public', label: 'Descarga libre' },
  { value: 'authenticated', label: 'Con cuenta' },
  { value: 'premium', label: 'Premium' },
];

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

/** Minúsculas y sin tildes: "metricas" tiene que encontrar "Métricas". */
const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

export default function Descargables() {
  const { data: resources, isLoading, error } = useDownloadableResources();
  const { isAuthenticated } = useAuth();
  const { hasActivePremium, isError: subscriptionFailed } = useSubscription();
  const { hasAssessment, loading: assessmentLoading } = useAssessmentData();
  const { trackEvent } = useMixpanelTracking();

  const [search, setSearch] = useState('');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');
  const [preview, setPreview] = useState<ResourcePreview | null>(null);
  const [busy, setBusy] = useState<{ id: string; action: CardAction } | null>(null);

  const query = normalize(search.trim());
  const visible = useMemo(
    () =>
      (resources ?? [])
        .filter((r) => accessFilter === 'all' || r.access_level === accessFilter)
        .filter((r) => !query || normalize(`${r.title} ${r.description ?? ''}`).includes(query))
        // Destacados primero; entre iguales se conserva el display_order de la query.
        .sort((a, b) => Number(b.is_featured) - Number(a.is_featured)),
    [resources, accessFilter, query],
  );

  // Mientras useSubscription no resuelve, hasActivePremium es undefined y no
  // sabemos si una card premium va abierta o bloqueada; en ese instante no la
  // dejamos accionar. No gateamos con su `loading` porque queda en true para
  // siempre si la query falla: en ese caso seguimos como no premium antes que
  // dejar todas las cards muertas.
  const premiumPending = isAuthenticated && hasActivePremium === undefined && !subscriptionFailed;
  const viewer = { isAuthenticated, isPremium: hasActivePremium === true };
  const accessFor = (resource: DownloadableResource) =>
    resource.access_level === 'premium' && premiumPending
      ? 'pending'
      : getResourceAccessState(resource, viewer);

  const eventProps = (resource: DownloadableResource) => ({
    resource_id: resource.id,
    resource_title: resource.title,
    location: 'descargables',
  });

  const reportFailure = (
    resource: DownloadableResource,
    action: CardAction,
    reason: ResourceOpenError,
  ) => {
    trackEvent('resource_open_failed', { ...eventProps(resource), action, reason });
    toast.error(resourceErrorMessage(reason));
  };

  const handlePreview = async (resource: DownloadableResource) => {
    setBusy({ id: resource.id, action: 'preview' });
    const resolved = await resolveResourceUrl(resource);
    setBusy(null);
    if ('error' in resolved) return reportFailure(resource, 'preview', resolved.error);
    setPreview({ resource, url: resolved.url });
    trackEvent('resource_previewed', eventProps(resource));
  };

  const handleDownload = async (resource: DownloadableResource) => {
    setBusy({ id: resource.id, action: 'download' });
    const failure = await openResourceInNewTab(resource);
    setBusy(null);
    if (failure) return reportFailure(resource, 'download', failure);
    trackEvent('resource_downloaded', eventProps(resource));
  };

  const clearFilters = () => {
    setSearch('');
    setAccessFilter('all');
  };

  return (
    <>
      <Seo />

      <div className="container max-w-6xl space-y-8 px-4 py-8 sm:px-6 sm:py-12">
        <header className="space-y-2">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Descargables</h1>
          <p className="max-w-2xl text-muted-foreground">
            Guías, templates y checklists para Product Builders. Algunos son de descarga libre,
            otros piden una cuenta gratuita y otros vienen con los planes Premium.
          </p>
        </header>

        {isAuthenticated && !assessmentLoading && !hasAssessment && <AssessmentInvite />}

        {isLoading ? (
          <div className={GRID}>
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-3 rounded-lg border p-5">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="py-12 text-center text-muted-foreground">
            No pudimos cargar los recursos. Intentá recargar la página.
          </p>
        ) : !resources?.length ? (
          <p className="py-12 text-center text-muted-foreground">
            Todavía no hay recursos disponibles.
          </p>
        ) : (
          <>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative sm:w-72">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden="true"
                />
                <Input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Buscar recursos"
                  aria-label="Buscar recursos"
                  className="pl-9"
                />
              </div>
              <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por acceso">
                {ACCESS_FILTERS.map((filter) => (
                  <Button
                    key={filter.value}
                    size="sm"
                    variant={accessFilter === filter.value ? 'default' : 'outline'}
                    aria-pressed={accessFilter === filter.value}
                    onClick={() => setAccessFilter(filter.value)}
                  >
                    {filter.label}
                  </Button>
                ))}
              </div>
            </div>

            {visible.length === 0 ? (
              <div className="space-y-3 py-12 text-center">
                <p className="text-muted-foreground">Sin resultados para esta búsqueda.</p>
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Limpiar filtros
                </Button>
              </div>
            ) : (
              <div className={GRID}>
                {visible.map((resource) => (
                  <DownloadableCard
                    key={resource.id}
                    resource={resource}
                    access={accessFor(resource)}
                    busy={busy?.id === resource.id ? busy.action : null}
                    onPreview={() => void handlePreview(resource)}
                    onDownload={() => void handleDownload(resource)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <ResourcePreviewDialog
        preview={preview}
        onClose={() => setPreview(null)}
        onDownload={() => preview && void handleDownload(preview.resource)}
        downloading={busy?.action === 'download'}
      />
    </>
  );
}

/** Invita a hacer la evaluación a quien tiene cuenta y todavía no la hizo. */
function AssessmentInvite() {
  useEffect(() => {
    Mixpanel.track('assessment_banner_shown', { location: 'descargables' });
  }, []);

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-muted/40 p-4 sm:flex-row sm:items-center">
      <div className="flex-1">
        <p className="font-medium">¿Ya conocés tu nivel de habilidades?</p>
        <p className="text-sm text-muted-foreground">
          Completá la evaluación y te recomendamos recursos según tus áreas de mejora. Toma 3 a
          5 minutos.
        </p>
      </div>
      <Button
        asChild
        size="sm"
        onClick={() => Mixpanel.track('assessment_banner_clicked', { location: 'descargables' })}
      >
        <Link to="/autoevaluacion">
          Hacer la evaluación
          <ArrowRight aria-hidden="true" />
        </Link>
      </Button>
    </div>
  );
}
