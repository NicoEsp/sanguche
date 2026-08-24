import { useEffect, useRef, useState } from 'react';
import { Download, Eye, FileText, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveResourceUrl, useSkillGapsResources } from '@/hooks/useDownloadableResources';
import { AssessmentResult } from '@/utils/scoring';
import { RecommendedResource } from '@/utils/resourceRecommendations';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';

interface ResourcesListProps {
  assessmentResult: AssessmentResult | null;
}

// Cuántos descargables secundarios acompañan al más afín. El foco es el
// primero: mostrar la lista entera es lo que hacía que la sección se leyera
// igual para todos.
const SECONDARY_LIMIT = 2;

const RESOURCE_ERROR_MESSAGE =
  'No pudimos abrir este recurso. Intentá de nuevo o escribinos a nicoproducto@hey.com.';

function ResourceCard({
  match,
  rank,
  isTopMatch,
}: {
  match: RecommendedResource;
  rank: number;
  isTopMatch: boolean;
}) {
  const { resource } = match;
  const { trackEvent } = useMixpanelTracking();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
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
    match_rank: rank,
    location: 'skill_gaps',
  };

  const reportFailure = (action: 'preview' | 'download', reason: string) => {
    trackEvent('resource_open_failed', {
      ...matchProps,
      action,
      reason,
    });
    toast.error(RESOURCE_ERROR_MESSAGE);
  };

  const handlePreview = async () => {
    if (actionLoading) return;
    setActionLoading('preview');
    const resolved = await resolveResourceUrl(resource);
    setActionLoading(null);
    if ('error' in resolved) {
      reportFailure('preview', resolved.error);
      return;
    }
    setPreviewUrl(resolved.url);
    setIsFrameLoading(true);
    setIsPreviewOpen(true);
    trackEvent('resource_previewed', matchProps);
  };

  const handleDownload = async () => {
    if (actionLoading) return;
    // Open the tab synchronously inside the click handler so browsers keep it
    // tied to the user gesture; opening after the await gets blocked as a popup.
    const win = window.open('about:blank', '_blank');
    if (win) win.opener = null;
    setActionLoading('download');
    const resolved = await resolveResourceUrl(resource);
    setActionLoading(null);
    if ('error' in resolved) {
      win?.close();
      reportFailure('download', resolved.error);
      return;
    }
    if (!win) {
      toast.error('Tu navegador bloqueó la descarga. Habilitá popups para este sitio.');
      return;
    }
    win.location.href = resolved.url;
    trackEvent('resource_downloaded', matchProps);
  };

  return (
    <>
      <Card className={`p-4 ${isTopMatch ? 'border-primary/40 bg-primary/5' : ''}`}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-1">
            {isTopMatch && (
              <Badge variant="outline" className="border-primary/40 text-primary gap-1">
                <Sparkles className="w-3 h-3" />
                El más afín a tu resultado
              </Badge>
            )}
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

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{resource.title}</DialogTitle>
          </DialogHeader>
          <div className="relative flex-1 overflow-hidden">
            {isFrameLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <Skeleton className="h-full w-full" />
                <div className="absolute flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">Cargando vista previa…</span>
                </div>
              </div>
            )}
            {previewUrl && (
              <iframe
                src={`${previewUrl}#view=FitH`}
                onLoad={() => setIsFrameLoading(false)}
                className={`w-full h-[70vh] border-0 ${isFrameLoading ? 'opacity-0' : ''}`}
                title={`Vista previa de ${resource.title}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ResourcesList({ assessmentResult }: ResourcesListProps) {
  const { recommendations, loading } = useSkillGapsResources(assessmentResult);
  const { trackEvent } = useMixpanelTracking();

  const topMatch = recommendations[0];
  const secondary = recommendations.slice(1, 1 + SECONDARY_LIMIT);

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
      alternatives_count: secondary.length,
    });
  }, [topMatch, secondary.length, trackEvent]);

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

      <ResourceCard match={topMatch} rank={1} isTopMatch />

      {secondary.length > 0 && (
        <div className="space-y-3 pt-2">
          <h4 className="text-sm font-medium text-muted-foreground">También te pueden servir</h4>
          {secondary.map((match, i) => (
            <ResourceCard
              key={match.resource.id}
              match={match}
              rank={i + 2}
              isTopMatch={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}
