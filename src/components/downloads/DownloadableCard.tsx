import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BookOpen,
  CheckCircle2,
  Crown,
  Download,
  FileCheck,
  FileText,
  Loader2,
  Lock,
  Sparkles,
  Star,
} from 'lucide-react';
import { DownloadableResource, DownloadableType } from '@/types/downloads';
import { getDownloadUrl } from '@/hooks/useDownloadableResources';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { isPremiumPlan } from '@/constants/plans';
import { cn } from '@/lib/utils';

const NEW_BADGE_DAYS = 14;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

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

const typeGradients: Record<DownloadableType, string> = {
  pdf: 'from-rose-500/20 to-primary/5',
  template: 'from-blue-500/20 to-primary/5',
  checklist: 'from-emerald-500/20 to-primary/5',
  guide: 'from-violet-500/20 to-primary/5',
};

type AccessState = 'accessible' | 'requires_login' | 'requires_subscription';
type PriceVariant = 'free' | 'premium';

function getPriceBadge(resource: DownloadableResource): { label: string; variant: PriceVariant } {
  if (resource.access_level === 'premium') return { label: 'Premium', variant: 'premium' };
  return { label: 'Gratis', variant: 'free' };
}

function isRecent(createdAt: string | undefined | null): boolean {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  return (Date.now() - created) / MS_PER_DAY <= NEW_BADGE_DAYS;
}

interface DownloadableCardProps {
  resource: DownloadableResource;
  isDownloaded: boolean;
  onDownloaded: (id: string) => void;
}

export function DownloadableCard({ resource, isDownloaded, onDownloaded }: DownloadableCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewFrameLoading, setIsPreviewFrameLoading] = useState(true);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isDescriptionTruncated, setIsDescriptionTruncated] = useState(false);
  const descriptionRef = useRef<HTMLParagraphElement>(null);
  const { isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setThumbnailFailed(false);
  }, [resource.thumbnail_url]);

  const Icon = typeIcons[resource.type] || FileText;

  const accessState: AccessState = useMemo(() => {
    if (resource.access_level === 'public') return 'accessible';
    if (resource.access_level === 'authenticated') {
      return isAuthenticated ? 'accessible' : 'requires_login';
    }
    if (resource.access_level === 'premium') {
      if (!isAuthenticated) return 'requires_login';
      if (!isPremiumPlan(subscription?.plan)) return 'requires_subscription';
      return 'accessible';
    }
    return 'accessible';
  }, [resource.access_level, isAuthenticated, subscription?.plan]);

  const isLocked = accessState !== 'accessible';
  const priceBadge = getPriceBadge(resource);
  const isNew = useMemo(() => isRecent(resource.created_at), [resource.created_at]);

  useLayoutEffect(() => {
    const el = descriptionRef.current;
    if (!el || isDescriptionExpanded) return;
    const measure = () => {
      setIsDescriptionTruncated(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [resource.description, isDescriptionExpanded]);

  const toggleDescription = () => setIsDescriptionExpanded((prev) => !prev);

  const handleCardActivate = async () => {
    if (isLocked) {
      if (accessState === 'requires_login') {
        navigate('/auth', { state: { from: location } });
      } else {
        navigate('/planes');
      }
      return;
    }

    setIsPreviewLoading(true);
    const url = await getDownloadUrl(resource);
    if (url) {
      setPreviewUrl(url);
      setIsPreviewFrameLoading(true);
      setIsPreviewOpen(true);
    }
    setIsPreviewLoading(false);
  };

  const handleDownload = async () => {
    if (isLocked) return;

    setIsDownloadLoading(true);
    try {
      const url = await getDownloadUrl(resource);
      if (!url) {
        toast.error('No pudimos obtener el archivo. Intentá de nuevo.');
        return;
      }
      const popup = window.open(url, '_blank', 'noopener,noreferrer');
      if (popup) {
        onDownloaded(resource.id);
      } else {
        toast.error('Tu navegador bloqueó la descarga. Habilitá popups para este sitio.');
      }
    } finally {
      setIsDownloadLoading(false);
    }
  };

  const primaryAriaLabel = isLocked
    ? accessState === 'requires_login'
      ? `${resource.title} — requiere iniciar sesión`
      : `${resource.title} — exclusivo Premium`
    : `Vista previa de ${resource.title}`;

  return (
    <>
      <Card className="group relative flex h-full flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg">
        <button
          type="button"
          onClick={() => void handleCardActivate()}
          disabled={isPreviewLoading}
          aria-label={primaryAriaLabel}
          className="flex flex-col items-stretch text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        >
          <div
            className={cn(
              'relative aspect-square overflow-hidden bg-gradient-to-br',
              typeGradients[resource.type],
            )}
          >
            {resource.thumbnail_url && !thumbnailFailed ? (
              <img
                src={resource.thumbnail_url}
                alt=""
                loading="lazy"
                onError={() => setThumbnailFailed(true)}
                className={cn(
                  'h-full w-full object-cover transition-transform duration-500',
                  isLocked ? 'scale-110 blur-lg' : 'group-hover:scale-105',
                )}
              />
            ) : (
              <div
                className={cn(
                  'flex h-full w-full items-center justify-center transition-transform duration-500',
                  isLocked && 'scale-110 blur-lg',
                )}
              >
                <Icon className="h-16 w-16 text-primary/40" aria-hidden="true" />
              </div>
            )}

            {resource.access_level === 'premium' ? (
              <Badge className="absolute left-3 top-3 z-10 border-amber-500/30 bg-amber-500/90 text-white">
                <Crown className="mr-1 h-3 w-3" aria-hidden="true" />
                Premium
              </Badge>
            ) : (
              <Badge
                variant="secondary"
                className="absolute left-3 top-3 z-10 bg-background/80 text-xs backdrop-blur-sm"
              >
                {typeLabels[resource.type]}
              </Badge>
            )}

            <div className="absolute right-3 top-3 z-10 flex flex-col items-end gap-1">
              {resource.is_featured && (
                <Badge className="border-0 bg-green-500/90 text-white">
                  <Star className="mr-1 h-3 w-3" aria-hidden="true" />
                  Destacado
                </Badge>
              )}
              {isNew && (
                <Badge className="border-0 bg-sky-500/90 text-white">
                  <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
                  Nuevo
                </Badge>
              )}
            </div>

            {isPreviewLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
                <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
              </div>
            )}

            {isLocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30">
                <div className="rounded-full bg-background/95 p-3 shadow-sm">
                  {accessState === 'requires_subscription' ? (
                    <Crown className="h-5 w-5 text-amber-500" aria-hidden="true" />
                  ) : (
                    <Lock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
                <span className="rounded-full bg-background/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                  {accessState === 'requires_subscription' ? 'Exclusivo Premium' : 'Inicia sesión'}
                </span>
              </div>
            )}
          </div>

          <h3 className="line-clamp-2 px-4 pb-0 pt-4 text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
            {resource.title}
          </h3>
        </button>

        <div className="flex flex-1 flex-col gap-2 px-4 pb-4 pt-2">
          {resource.description && (
            <div className="text-xs text-muted-foreground">
              <p
                ref={descriptionRef}
                className={cn('whitespace-pre-line', !isDescriptionExpanded && 'line-clamp-2')}
              >
                {resource.description}
              </p>
              {(isDescriptionTruncated || isDescriptionExpanded) && (
                <button
                  type="button"
                  onClick={toggleDescription}
                  className="mt-1 text-xs font-medium text-primary hover:underline focus-visible:outline-none focus-visible:underline"
                  aria-expanded={isDescriptionExpanded}
                >
                  {isDescriptionExpanded ? 'Ver menos' : 'Ver más'}
                </button>
              )}
            </div>
          )}

          <div className="mt-auto flex items-center justify-between gap-2 pt-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold text-white',
                  priceBadge.variant === 'premium' ? 'bg-amber-500' : 'bg-pink-500',
                )}
              >
                {priceBadge.label}
              </span>
              {isDownloaded && !isLocked && (
                <span className="inline-flex items-center gap-1 rounded-sm bg-emerald-500/15 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                  Descargado
                </span>
              )}
            </div>

            {!isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0"
                onClick={() => void handleDownload()}
                disabled={isDownloadLoading}
                aria-label={
                  isDownloaded
                    ? `Volver a descargar ${resource.title}`
                    : `Descargar ${resource.title}`
                }
                title={isDownloaded ? 'Volver a descargar' : 'Descargar'}
              >
                {isDownloadLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Download className="h-4 w-4" aria-hidden="true" />
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col gap-0 p-0">
          <DialogHeader className="space-y-2 px-6 pb-4 pt-6">
            <DialogTitle>{resource.title}</DialogTitle>
            {resource.description && (
              <DialogDescription className="whitespace-pre-line">
                {resource.description}
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="relative flex-1 overflow-hidden border-t bg-muted/30">
            {isPreviewFrameLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6">
                <Skeleton className="h-full w-full" />
                <div className="absolute flex flex-col items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
                  <span className="text-xs text-muted-foreground">Cargando vista previa…</span>
                </div>
              </div>
            )}
            {previewUrl && (
              <iframe
                src={`${previewUrl}#view=FitH`}
                onLoad={() => setIsPreviewFrameLoading(false)}
                className={cn(
                  'h-[65vh] w-full border-0',
                  isPreviewFrameLoading && 'opacity-0',
                )}
                title={`Vista previa de ${resource.title}`}
              />
            )}
          </div>
          <DialogFooter className="gap-2 border-t px-6 py-4 sm:justify-end">
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
              Cerrar
            </Button>
            <Button
              onClick={() => void handleDownload()}
              disabled={isDownloadLoading}
              className="gap-2"
            >
              {isDownloadLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                <Download className="h-4 w-4" aria-hidden="true" />
              )}
              {isDownloaded ? 'Volver a descargar' : 'Descargar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
