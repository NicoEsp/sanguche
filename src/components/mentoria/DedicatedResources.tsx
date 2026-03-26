import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Sparkles, RefreshCcw, Gift, Loader2 } from "lucide-react";
import { useUserDedicatedResources, ResourceType } from "@/hooks/useUserDedicatedResources";
import { useUserProfile } from "@/hooks/useUserProfile";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

const RESOURCE_TYPE_ICONS: Record<ResourceType, string> = {
  article: '📄',
  podcast: '🎙️',
  video: '🎥',
  course: '📚',
  tool: '🛠️',
  community: '👥',
  other: '🔗'
};

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  article: 'Artículo',
  podcast: 'Podcast',
  video: 'Video',
  course: 'Curso',
  tool: 'Herramienta',
  community: 'Comunidad',
  other: 'Recurso'
};

export function DedicatedResources() {
  const { profile, loading: profileLoading } = useUserProfile();
  const {
    resources: dedicatedResources,
    loading: loadingDedicated,
    refetch: refetchDedicated,
  } = useUserDedicatedResources(profile?.id);

  // Loading state
  if (loadingDedicated || profileLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recursos de tu mentor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  // Calculate last update date
  const lastUpdate = dedicatedResources && dedicatedResources.length > 0
    ? new Date(Math.max(...dedicatedResources.map(r => 
        new Date(r.updated_at || r.created_at || Date.now()).getTime()
      )))
    : null;

  // No resources state - attractive empty state
  if (!dedicatedResources || dedicatedResources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Recursos de tu mentor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-12 animate-fade-in">
          <div className="relative inline-flex items-center justify-center mb-6">
            {/* Subtle gradient background */}
            <div className="absolute inset-0 w-24 h-24 bg-gradient-to-br from-primary/10 to-purple-500/10 rounded-full blur-xl" />
            
            {/* Icon composition */}
            <div className="relative">
              <BookOpen className="h-16 w-16 text-muted-foreground/40" />
              <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-primary animate-pulse" />
              <Gift className="absolute -bottom-1 -left-2 h-5 w-5 text-purple-500/60" />
            </div>
          </div>
          
          <h4 className="font-semibold text-foreground mb-2 text-lg">
            Recursos en camino
          </h4>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
            Tu mentor aún no ha asignado recursos. Después de tu sesión de mentoría aparecerán aquí.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Resources available
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Recursos de tu mentor
            </CardTitle>
            {lastUpdate && (
              <p className="text-xs text-muted-foreground">
                Actualizado {formatDistanceToNow(lastUpdate, { addSuffix: true, locale: es })}
              </p>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => refetchDedicated()}
            disabled={loadingDedicated}
          >
            {loadingDedicated
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <RefreshCcw className="h-4 w-4" />
            }
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {dedicatedResources.map((resource) => (
          <div 
            key={resource.id}
            className="flex items-start justify-between p-4 bg-muted/30 rounded-lg border hover:border-primary/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xl">
                  {RESOURCE_TYPE_ICONS[resource.resource_type as ResourceType]}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {RESOURCE_TYPE_LABELS[resource.resource_type as ResourceType]}
                </Badge>
              </div>
              <h4 className="font-medium text-foreground mb-1">
                {resource.resource_name}
              </h4>
              {resource.description && (
                <p className="text-sm text-muted-foreground">
                  {resource.description}
                </p>
              )}
            </div>
            {resource.external_url && (
              <Button size="sm" variant="outline" asChild>
                <a href={resource.external_url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3 w-3 mr-2" />
                  Ver
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
