import { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DownloadableResource } from '@/types/downloads';
import { cn } from '@/lib/utils';

export interface ResourcePreview {
  resource: DownloadableResource;
  url: string;
}

interface ResourcePreviewDialogProps {
  /** Qué se está viendo; null cierra el diálogo. */
  preview: ResourcePreview | null;
  onClose: () => void;
  /** Si viene, el pie muestra el botón de descarga. */
  onDownload?: () => void;
  downloading?: boolean;
}

/**
 * Vista previa de un recurso en un iframe. La comparten /descargables y la
 * recomendación de /mejoras, que antes tenían dos copias del mismo diálogo.
 */
export function ResourcePreviewDialog({
  preview,
  onClose,
  onDownload,
  downloading,
}: ResourcePreviewDialogProps) {
  return (
    <Dialog open={preview !== null} onOpenChange={(open) => !open && onClose()}>
      {preview && (
        <DialogContent className="flex h-[90vh] max-w-4xl flex-col gap-0 p-0">
          <DialogHeader className="px-6 pb-4 pt-6 text-left">
            <DialogTitle>{preview.resource.title}</DialogTitle>
            <DialogDescription
              className={cn('whitespace-pre-line', !preview.resource.description && 'sr-only')}
            >
              {preview.resource.description || 'Vista previa del recurso'}
            </DialogDescription>
          </DialogHeader>

          <PreviewFrame key={preview.url} url={preview.url} title={preview.resource.title} />

          {onDownload && (
            <DialogFooter className="border-t px-6 py-4">
              <Button onClick={onDownload} disabled={downloading}>
                {downloading ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : (
                  <Download aria-hidden="true" />
                )}
                Descargar
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      )}
    </Dialog>
  );
}

function PreviewFrame({ url, title }: { url: string; title: string }) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="relative min-h-0 flex-1 border-t bg-muted/30">
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          Cargando vista previa…
        </div>
      )}
      <iframe
        src={`${url}#view=FitH`}
        title={`Vista previa de ${title}`}
        onLoad={() => setLoaded(true)}
        className={cn('h-full w-full border-0', !loaded && 'opacity-0')}
      />
    </div>
  );
}
