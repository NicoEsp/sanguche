import { useMemo, useState } from 'react';
import { AlertCircle, FileDown, Search, Star, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Seo } from '@/components/Seo';
import { useDownloadableResources } from '@/hooks/useDownloadableResources';
import { DownloadableCard } from '@/components/downloads/DownloadableCard';
import { AssessmentInviteBanner } from '@/components/downloads/AssessmentInviteBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentData } from '@/hooks/useAssessmentData';
import { DownloadableResource, DownloadableType } from '@/types/downloads';

type TypeFilter = 'all' | DownloadableType;
type AccessFilter = 'all' | 'free' | 'premium';

const typeFilters: { value: TypeFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'pdf', label: 'PDFs' },
  { value: 'template', label: 'Templates' },
  { value: 'checklist', label: 'Checklists' },
  { value: 'guide', label: 'Guías' },
];

const accessFilters: { value: AccessFilter; label: string }[] = [
  { value: 'all', label: 'Todos' },
  { value: 'free', label: 'Gratis' },
  { value: 'premium', label: 'Premium' },
];

function matchesSearch(resource: DownloadableResource, query: string): boolean {
  if (!query) return true;
  const haystack = `${resource.title} ${resource.description ?? ''}`.toLowerCase();
  return haystack.includes(query);
}

function matchesAccess(resource: DownloadableResource, filter: AccessFilter): boolean {
  if (filter === 'all') return true;
  if (filter === 'premium') return resource.access_level === 'premium';
  return resource.access_level !== 'premium';
}

export default function Descargables() {
  const { data: resources, isLoading, error } = useDownloadableResources();
  const { user } = useAuth();
  const { hasAssessment, loading: assessmentLoading } = useAssessmentData();

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [accessFilter, setAccessFilter] = useState<AccessFilter>('all');

  const showAssessmentBanner = user && !assessmentLoading && !hasAssessment;

  const trimmedQuery = search.trim().toLowerCase();
  const hasActiveFilters = typeFilter !== 'all' || accessFilter !== 'all' || trimmedQuery.length > 0;

  const filteredResources = useMemo(() => {
    if (!resources) return [];
    return resources.filter((resource) => {
      if (typeFilter !== 'all' && resource.type !== typeFilter) return false;
      if (!matchesAccess(resource, accessFilter)) return false;
      if (!matchesSearch(resource, trimmedQuery)) return false;
      return true;
    });
  }, [resources, typeFilter, accessFilter, trimmedQuery]);

  const featuredResources = useMemo(
    () => filteredResources.filter((r) => r.is_featured),
    [filteredResources],
  );
  const regularResources = useMemo(
    () => filteredResources.filter((r) => !r.is_featured),
    [filteredResources],
  );

  const clearFilters = () => {
    setSearch('');
    setTypeFilter('all');
    setAccessFilter('all');
  };

  return (
    <>
      <Seo />

      <div className="container max-w-7xl py-8 sm:py-12 px-4 sm:px-6 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileDown className="h-8 w-8 text-primary" aria-hidden="true" />
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Descargables</h1>
          </div>
          <p className="text-muted-foreground">
            Recursos exclusivos para Product Builders. Descargá documentos, templates y guías.
          </p>
        </div>

        {showAssessmentBanner && <AssessmentInviteBanner />}

        {isLoading ? (
          <LoadingSkeleton />
        ) : error ? (
          <ErrorState />
        ) : !resources || resources.length === 0 ? (
          <EmptyCatalog />
        ) : (
          <>
            <FilterBar
              search={search}
              onSearchChange={setSearch}
              typeFilter={typeFilter}
              onTypeFilterChange={setTypeFilter}
              accessFilter={accessFilter}
              onAccessFilterChange={setAccessFilter}
            />

            {filteredResources.length === 0 ? (
              <FilteredEmptyState
                hasActiveFilters={hasActiveFilters}
                onClear={clearFilters}
              />
            ) : (
              <div className="space-y-10">
                {featuredResources.length > 0 && (
                  <section aria-labelledby="destacados-heading" className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-amber-500" aria-hidden="true" />
                      <h2
                        id="destacados-heading"
                        className="text-xl font-bold tracking-tight sm:text-2xl"
                      >
                        Destacados
                      </h2>
                    </div>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {featuredResources.map((resource) => (
                        <DownloadableCard key={resource.id} resource={resource} />
                      ))}
                    </div>
                  </section>
                )}

                {regularResources.length > 0 && (
                  <section aria-labelledby="catalogo-heading" className="space-y-4">
                    <h2
                      id="catalogo-heading"
                      className={featuredResources.length > 0 ? 'text-xl font-bold tracking-tight sm:text-2xl' : 'sr-only'}
                    >
                      {featuredResources.length > 0 ? 'Todos los recursos' : 'Recursos'}
                    </h2>
                    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                      {regularResources.map((resource) => (
                        <DownloadableCard key={resource.id} resource={resource} />
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: TypeFilter;
  onTypeFilterChange: (value: TypeFilter) => void;
  accessFilter: AccessFilter;
  onAccessFilterChange: (value: AccessFilter) => void;
}

function FilterBar({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  accessFilter,
  onAccessFilterChange,
}: FilterBarProps) {
  return (
    <div className="space-y-4 rounded-lg border bg-card/30 p-4 backdrop-blur-sm">
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Buscar por título o descripción…"
          className="pl-9 pr-9"
          aria-label="Buscar recursos"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Limpiar búsqueda"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Tipo
          </span>
          <ToggleGroup
            type="single"
            value={typeFilter}
            onValueChange={(value) => {
              if (value) onTypeFilterChange(value as TypeFilter);
            }}
            className="flex-wrap justify-start gap-1"
            aria-label="Filtrar por tipo"
          >
            {typeFilters.map((filter) => (
              <ToggleGroupItem
                key={filter.value}
                value={filter.value}
                size="sm"
                className="h-8 rounded-full px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Acceso
          </span>
          <ToggleGroup
            type="single"
            value={accessFilter}
            onValueChange={(value) => {
              if (value) onAccessFilterChange(value as AccessFilter);
            }}
            className="flex-wrap justify-start gap-1"
            aria-label="Filtrar por acceso"
          >
            {accessFilters.map((filter) => (
              <ToggleGroupItem
                key={filter.value}
                value={filter.value}
                size="sm"
                className="h-8 rounded-full px-3 text-xs data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
              >
                {filter.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      ))}
    </div>
  );
}

function ErrorState() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <AlertCircle className="h-8 w-8 text-destructive" aria-hidden="true" />
      <p className="font-medium text-destructive">No pudimos cargar los recursos</p>
      <p className="text-sm text-muted-foreground">Intentá recargar la página.</p>
    </div>
  );
}

function EmptyCatalog() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <FileDown className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <p className="text-muted-foreground">
        Todavía no hay recursos disponibles. ¡Pronto habrá novedades!
      </p>
    </div>
  );
}

interface FilteredEmptyStateProps {
  hasActiveFilters: boolean;
  onClear: () => void;
}

function FilteredEmptyState({ hasActiveFilters, onClear }: FilteredEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center">
      <Search className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium text-foreground">Sin resultados para esta combinación</p>
        <p className="text-sm text-muted-foreground">
          Probá ajustando los filtros o la búsqueda.
        </p>
      </div>
      {hasActiveFilters && (
        <Button variant="outline" size="sm" onClick={onClear}>
          Limpiar filtros
        </Button>
      )}
    </div>
  );
}
