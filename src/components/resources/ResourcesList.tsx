import { useState } from 'react';
import { Download, Eye, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveResourceUrl, useSkillGapsResources } from '@/hooks/useDownloadableResources';
import { AssessmentResult } from '@/utils/scoring';
import { DownloadableResource } from '@/types/downloads';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';

interface ResourcesListProps {
  assessmentResult: AssessmentResult | null;
}

const RESOURCE_ERROR_MESSAGE =
  'No pudimos abrir este recurso. Intentá de nuevo o escribinos a nicoproducto@hey.com.';

function ResourceCard({ resource }: { resource: DownloadableResource }) {
  const { trackEvent } = useMixpanelTracking();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isFrameLoading, setIsFrameLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<'preview' | 'download' | null>(null);

  const isPdf = resource.type === 'pdf' || resource.file_path.toLowerCase().endsWith('.pdf');

  const reportFailure = (action: 'preview' | 'download', reason: string) => {
    trackEvent('resource_open_failed', {
      resource_id: resource.id,
      resource_title: resource.title,
      action,
      reason,
      location: 'skill_gaps',
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
    trackEvent('resource_previewed', {
      resource_id: resource.id,
      resource_title: resource.title,
      location: 'skill_gaps',
    });
  };

  const handleDownload = async () => {
    if (actionLoading) return;
    setActionLoading('download');
    const resolved = await resolveResourceUrl(resource);
    setActionLoading(null);
    if ('error' in resolved) {
      reportFailure('download', resolved.error);
      return;
    }
    const popup = window.open(resolved.url, '_blank', 'noopener,noreferrer');
    if (!popup) {
      toast.error('Tu navegador bloqueó la descarga. Habilitá popups para este sitio.');
      return;
    }
    trackEvent('resource_downloaded', {
      resource_id: resource.id,
      resource_title: resource.title,
      location: 'skill_gaps',
    });
  };

  return (
    <>
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h4 className="flex-1 min-w-0 font-medium text-sm sm:text-base">
            {resource.title}
          </h4>

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
  const { resources, loading } = useSkillGapsResources(assessmentResult);

  if (loading) {
    return (
      <div className="mt-8 space-y-3">
        <div className="h-6 w-48 bg-muted animate-pulse rounded" />
        <div className="h-32 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!resources.length) {
    return null;
  }

  return (
    <div className="mt-8 space-y-4">
      <h3 className="text-lg font-semibold flex items-center gap-2">
        <FileText className="w-5 h-5" />
        📚 Recomendados según tu evaluación
      </h3>

      <div className="space-y-3">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
}
