import { StarterPackResource } from '@/types/starterpack';
import { useResourceAccess } from '@/hooks/useStarterPackResources';
import { ResourceCard } from './ResourceCard';
import { FileText } from 'lucide-react';

interface ResourceGridProps {
  resources: StarterPackResource[];
  emptyMessage?: string;
}

export function ResourceGrid({ resources, emptyMessage = 'No hay recursos disponibles' }: ResourceGridProps) {
  const { getAccessState, getDownloadUrl, canAccess } = useResourceAccess();

  const handleDownload = async (resource: StarterPackResource) => {
    if (!canAccess(resource)) return;
    
    const url = await getDownloadUrl(resource);
    if (url) {
      window.open(url, '_blank');
    }
  };

  if (resources.length === 0) {
    return (
      <div className="text-center py-12">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" />
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {resources.map((resource) => (
        <ResourceCard
          key={resource.id}
          resource={resource}
          accessState={getAccessState(resource)}
          onDownload={() => handleDownload(resource)}
        />
      ))}
    </div>
  );
}
