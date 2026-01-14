import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, Eye, FileText, FileCheck, BookOpen, Loader2 } from 'lucide-react';
import { DownloadableResource, DownloadableType } from '@/types/downloads';
import { getDownloadUrl } from '@/hooks/useDownloadableResources';

const typeIcons: Record<DownloadableType, typeof FileText> = {
  pdf: FileText,
  template: FileCheck,
  checklist: FileCheck,
  guide: BookOpen,
};

const typeLabels: Record<DownloadableType, string> = {
  pdf: 'PDF',
  template: 'Template',
  checklist: 'Checklist',
  guide: 'Guía',
};

interface DownloadableCardProps {
  resource: DownloadableResource;
}

export function DownloadableCard({ resource }: DownloadableCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const Icon = typeIcons[resource.type] || FileText;

  const handlePreview = async () => {
    setIsLoading(true);
    const url = await getDownloadUrl(resource);
    if (url) {
      setPreviewUrl(url);
      setIsPreviewOpen(true);
    }
    setIsLoading(false);
  };

  const handleDownload = async () => {
    setIsLoading(true);
    const url = await getDownloadUrl(resource);
    if (url) {
      window.open(url, '_blank');
    }
    setIsLoading(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-primary/10 p-3">
              <Icon className="h-8 w-8 text-primary" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="outline" className="text-xs">
                  {typeLabels[resource.type]}
                </Badge>
                {resource.is_featured && (
                  <Badge className="text-xs bg-green-500/90">Destacado</Badge>
                )}
              </div>
              <CardTitle className="text-xl">{resource.title}</CardTitle>
              {resource.description && (
                <p className="text-sm text-muted-foreground mt-2">
                  {resource.description}
                </p>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button variant="outline" onClick={handlePreview} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
              Ver PDF
            </Button>
            <Button onClick={handleDownload} disabled={isLoading}>
              {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Descargar
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>{resource.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewUrl && (
              <iframe
                src={`${previewUrl}#view=FitH`}
                className="w-full h-[70vh] border-0"
                title={`Vista previa de ${resource.title}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
