import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, BookOpen, Sparkles, RefreshCcw, FileText } from "lucide-react";
import { useUserDedicatedResources, ResourceType } from "@/hooks/useUserDedicatedResources";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const {
    resources: dedicatedResources,
    loading: loadingDedicated,
    refetch: refetchDedicated,
  } = useUserDedicatedResources(user ? (user as any).profile_id : undefined);

  // Loading state
  if (loadingDedicated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recursos de tu mentor
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  // No resources state
  if (!dedicatedResources || dedicatedResources.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Recursos de tu mentor
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">
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
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Recursos de tu mentor
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={() => refetchDedicated()}
            disabled={loadingDedicated}
          >
            <RefreshCcw className="h-4 w-4" />
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
