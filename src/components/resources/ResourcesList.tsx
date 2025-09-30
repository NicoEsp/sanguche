import { useState } from 'react';
import { FileText, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAvailableResources } from '@/hooks/useResources';
import { AssessmentResult } from '@/utils/scoring';
import { getResourceBadgeType } from '@/utils/resourceFilters';

interface ResourcesListProps {
  assessmentResult: AssessmentResult | null;
}

export function ResourcesList({ assessmentResult }: ResourcesListProps) {
  const { resources, loading } = useAvailableResources(assessmentResult);
  const [previewResource, setPreviewResource] = useState<{ name: string; url: string } | null>(null);

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
    <>
      <div className="mt-8 space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          📚 Recursos recomendados
        </h3>

        <div className="space-y-3">
          {resources.map((resource) => {
            const badgeType = getResourceBadgeType(resource, assessmentResult);
            
            return (
              <Card key={resource.id} className="p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm sm:text-base mb-2">
                      {resource.name}
                    </h4>
                    
                    <div className="flex flex-col sm:flex-row gap-2 mb-3">
                      {badgeType === 'public' && (
                        <Badge variant="secondary" className="self-start">
                          Recurso gratuito
                        </Badge>
                      )}
                      {badgeType === 'recommended' && (
                        <Badge variant="default" className="self-start">
                          Recomendado para vos
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPreviewResource({ name: resource.name, url: resource.file_url })}
                    >
                      <Eye className="w-4 h-4" />
                      Ver PDF
                    </Button>
                    <Button
                      size="sm"
                      asChild
                    >
                      <a href={resource.file_url} download target="_blank" rel="noopener noreferrer">
                        <Download className="w-4 h-4" />
                        Descargar
                      </a>
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {previewResource && (
        <Dialog open={!!previewResource} onOpenChange={() => setPreviewResource(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>{previewResource.name}</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`${previewResource.url}#view=FitH`}
                className="w-full h-[70vh] border-0"
                title={`Vista previa de ${previewResource.name}`}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
