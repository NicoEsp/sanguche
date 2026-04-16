import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Download, FileText, FileCheck, BookOpen, Loader2, Lock, Crown, Star } from 'lucide-react';
import { DownloadableResource, DownloadableType } from '@/types/downloads';
import { getDownloadUrl } from '@/hooks/useDownloadableResources';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { isPremiumPlan } from '@/constants/plans';
import { cn } from '@/lib/utils';

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

interface DownloadableCardProps {
  resource: DownloadableResource;
}

export function DownloadableCard({ resource }: DownloadableCardProps) {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isDownloadLoading, setIsDownloadLoading] = useState(false);
  const { isAuthenticated } = useAuth();
  const { subscription } = useSubscription();
  const navigate = useNavigate();
  const location = useLocation();

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
      setIsPreviewOpen(true);
    }
    setIsPreviewLoading(false);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    // Ignore key events bubbled from interactive descendants (e.g. Download button)
    if (event.target !== event.currentTarget) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      void handleCardActivate();
    }
  };

  const handleDownload = async (event: React.MouseEvent) => {
    event.stopPropagation();
    if (isLocked) return;

    setIsDownloadLoading(true);
    const url = await getDownloadUrl(resource);
    if (url) {
      window.open(url, '_blank');
    }
    setIsDownloadLoading(false);
  };

  const lockedAriaLabel =
    accessState === 'requires_login'
      ? `${resource.title} — requiere iniciar sesión`
      : `${resource.title} — exclusivo Premium`;

  return (
    <>
      <Card
        role="button"
        tabIndex={0}
        aria-label={isLocked ? lockedAriaLabel : `Ver ${resource.title}`}
        onClick={() => void handleCardActivate()}
        onKeyDown={handleKeyDown}
        className="group relative flex h-full cursor-pointer flex-col overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        <div className={cn('relative aspect-square overflow-hidden bg-gradient-to-br', typeGradients[resource.type])}>
          {resource.thumbnail_url ? (
            <img
              src={resource.thumbnail_url}
              alt={resource.title}
              loading="lazy"
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
              <Icon className="h-16 w-16 text-primary/40" />
            </div>
          )}

          {resource.access_level === 'premium' ? (
            <Badge className="absolute left-3 top-3 z-10 border-amber-500/30 bg-amber-500/90 text-white">
              <Crown className="mr-1 h-3 w-3" />
              Premium
            </Badge>
          ) : (
            <Badge variant="secondary" className="absolute left-3 top-3 z-10 bg-background/80 text-xs backdrop-blur-sm">
              {typeLabels[resource.type]}
            </Badge>
          )}

          {resource.is_featured && (
            <Badge className="absolute right-3 top-3 z-10 border-0 bg-green-500/90 text-white">
              <Star className="mr-1 h-3 w-3" />
              Destacado
            </Badge>
          )}

          {isPreviewLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {isLocked && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/30">
              <div className="rounded-full bg-background/95 p-3 shadow-sm">
                {accessState === 'requires_subscription' ? (
                  <Crown className="h-5 w-5 text-amber-500" />
                ) : (
                  <Lock className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
              <span className="rounded-full bg-background/95 px-3 py-1 text-xs font-medium text-foreground shadow-sm">
                {accessState === 'requires_subscription' ? 'Exclusivo Premium' : 'Inicia sesión'}
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-2 p-4">
          <h3 className="line-clamp-2 text-sm font-semibold text-foreground transition-colors group-hover:text-primary sm:text-base">
            {resource.title}
          </h3>
          {resource.description && (
            <p className="line-clamp-1 text-xs text-muted-foreground">{resource.description}</p>
          )}

          <div className="mt-auto flex items-center justify-between pt-2">
            <span
              className={cn(
                'inline-flex items-center rounded-sm px-2 py-0.5 text-xs font-semibold text-white',
                priceBadge.variant === 'premium' ? 'bg-amber-500' : 'bg-pink-500',
              )}
            >
              {priceBadge.label}
            </span>

            {!isLocked && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={handleDownload}
                disabled={isDownloadLoading}
                aria-label={`Descargar ${resource.title}`}
              >
                {isDownloadLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
        </div>
      </Card>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl">
          <DialogHeader>
            <DialogTitle>{resource.title}</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-hidden">
            {previewUrl && (
              <iframe
                src={`${previewUrl}#view=FitH`}
                className="h-[70vh] w-full border-0"
                title={`Vista previa de ${resource.title}`}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
