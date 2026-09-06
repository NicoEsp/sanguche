import { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ResourcePreview,
  ResourcePreviewDialog,
} from '@/components/downloads/ResourcePreviewDialog';
import {
  ResourceOpenError,
  openResourceInNewTab,
  resolveResourceUrl,
  resourceErrorMessage,
  useSkillGapsResources,
} from '@/hooks/useDownloadableResources';
import { AssessmentResult } from '@/utils/scoring';
import { RecommendedResource } from '@/utils/resourceRecommendations';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';

interface ResourcesListProps {
  assessmentResult: AssessmentResult | null;
}

type TrackEvent = ReturnType<typeof useMixpanelTracking>['trackEvent'];

function ResourceCard({ match, trackEvent }: { match: RecommendedResource; trackEvent: TrackEvent }) {
  const { resource } = match;
  const [preview, setPreview] = useState<ResourcePreview | null>(null);
  const [actionLoading, setActionLoading] = useState<'preview' | 'download' | null>(null);

  const isPdf = resource.type === 'pdf' || resource.file_path.toLowerCase().endsWith('.pdf');

  // Con qué resultado matcheó: sin esto las métricas de descarga no distinguen
  // una recomendación acertada de una que simplemente estaba en pantalla.
  const matchProps = {
    resource_id: resource.id,
    resource_title: resource.title,
    match_domain: match.domainKey,
    match_domain_value: match.domainValue,
    match_tier: match.tier,
    location: 'skill_gaps',
  };

  const reportFailure = (action: 'preview' | 'download', reason: ResourceOpenError) => {
    trackEvent('resource_open_failed', { ...matchProps, action, reason });
    toast.error(resourceErrorMessage(reason));
  };

  const handlePreview = async () => {
    if (actionLoading) return;
    setActionLoading('preview');
    const resolved = await resolveResourceUrl(resource);
    setActionLoading(null);
    if ('error' in resolved) return reportFailure('preview', resolved.error);
    setPreview({ resource, url: resolved.url });
    trackEvent('resource_previewed', matchProps);
  };

  const handleDownload = async () => {
    if (actionLoading) return;
    setActionLoading('download');
    const failure = await openResourceInNewTab(resource);
    setActionLoading(null);
    if (failure) return reportFailure('download', failure);
    trackEvent('resource_downloaded', matchProps);
  };

  return (
    <>
      <Card className="p-4 border-primary/40 bg-primary/5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            <h4 className="font-medium text-sm sm:text-base">{resource.title}</h4>
            <p className="text-xs sm:text-sm text-muted-foreground">{match.reason}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            {isPdf && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handlePreview()}
                disabled={actionLoading !== null}
              >
                {actionLoading === 'preview' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                Ver PDF
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => void handleDownload()}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'download' ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Download className="w-4 h-4" />
              )}
              Descargar
            </Button>
          </div>
        </div>
      </Card>

      <ResourcePreviewDialog preview={preview} onClose={() => setPreview(null)} />
    </>
  );
}

export function ResourcesList({ assessmentResult }: ResourcesListProps) {
  const { recommendations, loading } = useSkillGapsResources(assessmentResult);
  const { trackEvent } = useMixpanelTracking();

  // Una sola card, la más afín. El ranking calcula todos los que matchean, pero
  // listarlos es lo que hacía que la sección se leyera como un catálogo suelto
  // en vez de una recomendación.
  const topMatch = recommendations[0];

  // Qué recomendación vio cada persona, para poder leer las descargas contra
  // lo que efectivamente se le ofreció.
  const trackedTopMatchId = useRef<string | null>(null);
  useEffect(() => {
    if (!topMatch || trackedTopMatchId.current === topMatch.resource.id) return;
    trackedTopMatchId.current = topMatch.resource.id;
    trackEvent('skill_gaps_recommendation_shown', {
      resource_id: topMatch.resource.id,
      resource_title: topMatch.resource.title,
      match_domain: topMatch.domainKey,
      match_domain_value: topMatch.domainValue,
      match_tier: topMatch.tier,
      candidates_count: recommendations.length,
    });
  }, [topMatch, recommendations.length, trackEvent]);

  if (loading) {
    return (
      <div className="mt-8 space-y-3">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!topMatch) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          📚 Tu descargable recomendado
        </h3>
        <p className="text-sm text-muted-foreground">
          Elegido según tu evaluación, no es el mismo para todos.
        </p>
      </div>

      <ResourceCard match={topMatch} trackEvent={trackEvent} />
    </div>
  );
}
