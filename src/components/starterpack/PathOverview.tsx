import { FileText, Video, Link as LinkIcon, File } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { StarterPackResource } from '@/types/starterpack';

interface PathOverviewProps {
  audience: 'build' | 'lead';
  resources: StarterPackResource[];
}

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  guide: FileText,
  template: File,
  video: Video,
  article: FileText,
  link: LinkIcon,
};

const typeLabels: Record<string, string> = {
  guide: 'Guía',
  template: 'Template',
  video: 'Video',
  article: 'Artículo',
  link: 'Recurso',
};

export function PathOverview({ audience, resources }: PathOverviewProps) {
  const isBuild = audience === 'build';
  const displayResources = resources.slice(0, 5);

  if (displayResources.length === 0) {
    return null;
  }

  return (
    <section className="container py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold mb-2 text-center">
          Lo que incluye este camino
        </h2>
        <p className="text-muted-foreground text-center mb-6">
          {resources.length} recursos seleccionados para tu perfil
        </p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {displayResources.map((resource) => {
            const Icon = typeIcons[resource.type] || FileText;
            return (
              <div 
                key={resource.id} 
                className={cn(
                  "text-center p-4 rounded-lg border transition-colors",
                  isBuild 
                    ? "bg-primary/5 border-primary/20 hover:border-primary/40" 
                    : "bg-purple-500/5 border-purple-500/20 hover:border-purple-500/40"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-3",
                  isBuild ? "bg-primary/10" : "bg-purple-500/10"
                )}>
                  <Icon className={cn(
                    "w-5 h-5",
                    isBuild ? "text-primary" : "text-purple-500"
                  )} />
                </div>
                <p className="text-sm font-medium line-clamp-2 mb-2">
                  {resource.title}
                </p>
                <Badge 
                  variant="outline" 
                  className={cn(
                    "text-xs",
                    isBuild ? "border-primary/30 text-primary" : "border-purple-500/30 text-purple-500"
                  )}
                >
                  {typeLabels[resource.type] || resource.type}
                </Badge>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
