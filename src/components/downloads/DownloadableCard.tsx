import { Link, useLocation } from 'react-router-dom';
import { Crown, Download, Eye, FileText, Loader2, Lock, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ResourceAccessState } from '@/hooks/useDownloadableResources';
import {
  DOWNLOADABLE_ACCESS_LABELS,
  DOWNLOADABLE_TYPE_LABELS,
  DownloadableResource,
} from '@/types/downloads';

export type CardAction = 'preview' | 'download';

interface CardActionsProps {
  /** 'pending' mientras no se sabe si el usuario tiene Premium vigente. */
  access: ResourceAccessState | 'pending';
  /** Acción en curso en esta card. */
  busy: CardAction | null;
  /** Hay una acción en curso en otra card: una operación por vez. */
  disabled: boolean;
  onPreview: () => void;
  onDownload: () => void;
}

interface DownloadableCardProps extends CardActionsProps {
  resource: DownloadableResource;
}

export function DownloadableCard({ resource, ...actions }: DownloadableCardProps) {
  return (
    <Card className="flex h-full flex-col gap-3 p-5">
      <div className="flex items-start gap-3">
        {resource.thumbnail_url ? (
          <img
            src={resource.thumbnail_url}
            alt=""
            loading="lazy"
            className="h-12 w-12 shrink-0 rounded-md object-cover"
          />
        ) : (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold leading-snug">{resource.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            {DOWNLOADABLE_TYPE_LABELS[resource.type]} ·{' '}
            {DOWNLOADABLE_ACCESS_LABELS[resource.access_level]}
            {resource.is_featured && (
              <>
                {' · '}
                <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                  <Star className="h-3 w-3" aria-hidden="true" />
                  Destacado
                </span>
              </>
            )}
          </p>
        </div>
      </div>

      {resource.description && (
        <p className="line-clamp-3 text-sm text-muted-foreground">{resource.description}</p>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-1">
        <CardActions {...actions} />
      </div>
    </Card>
  );
}

function CardActions({ access, busy, disabled, onPreview, onDownload }: CardActionsProps) {
  const inactive = disabled || busy !== null;
  const location = useLocation();

  if (access === 'pending') {
    return (
      <Button size="sm" variant="outline" disabled>
        <Loader2 className="animate-spin" aria-hidden="true" />
        Verificando acceso
      </Button>
    );
  }

  if (access === 'requires_login') {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/auth" state={{ from: location }}>
          <Lock aria-hidden="true" />
          Iniciar sesión para descargar
        </Link>
      </Button>
    );
  }

  if (access === 'requires_subscription') {
    return (
      <Button asChild size="sm" variant="outline">
        <Link to="/planes">
          <Crown aria-hidden="true" />
          Ver planes Premium
        </Link>
      </Button>
    );
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={onPreview} disabled={inactive}>
        {busy === 'preview' ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Eye aria-hidden="true" />
        )}
        Ver
      </Button>
      <Button size="sm" onClick={onDownload} disabled={inactive}>
        {busy === 'download' ? (
          <Loader2 className="animate-spin" aria-hidden="true" />
        ) : (
          <Download aria-hidden="true" />
        )}
        Descargar
      </Button>
    </>
  );
}
