import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Pencil, Trash2 } from "lucide-react";
import { DedicatedResource, ResourceType } from "@/hooks/useUserDedicatedResources";

interface DedicatedResourceCardProps {
  resource: DedicatedResource;
  onEdit: (resource: DedicatedResource) => void;
  onDelete: (id: string) => void;
}

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  article: '📄 Artículo',
  podcast: '🎙️ Podcast',
  video: '🎥 Video',
  course: '📚 Curso',
  tool: '🛠️ Herramienta',
  community: '👥 Comunidad',
  other: '🔗 Otro'
};

export function DedicatedResourceCard({ resource, onEdit, onDelete }: DedicatedResourceCardProps) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary" className="shrink-0">
                {RESOURCE_TYPE_LABELS[resource.resource_type as ResourceType] || resource.resource_type}
              </Badge>
              <h4 className="font-medium text-foreground truncate">
                {resource.resource_name}
              </h4>
            </div>
            
            {resource.external_url && (
              <a 
                href={resource.external_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline flex items-center gap-1 mb-2"
              >
                {resource.external_url}
                <ExternalLink className="h-3 w-3" />
              </a>
            )}
            
            {resource.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {resource.description}
              </p>
            )}
          </div>

          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onEdit(resource)}
            >
              <Pencil className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDelete(resource.id)}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
