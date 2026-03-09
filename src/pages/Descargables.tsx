import { FileDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Seo } from '@/components/Seo';
import { useDownloadableResources } from '@/hooks/useDownloadableResources';
import { DownloadableCard } from '@/components/downloads/DownloadableCard';
import { AssessmentInviteBanner } from '@/components/downloads/AssessmentInviteBanner';
import { useAuth } from '@/contexts/AuthContext';
import { useAssessmentData } from '@/hooks/useAssessmentData';

export default function Descargables() {
  const { data: resources, isLoading, error } = useDownloadableResources();
  const { user } = useAuth();
  const { hasAssessment, loading: assessmentLoading } = useAssessmentData();

  // Show banner if user is logged in and hasn't completed assessment
  const showAssessmentBanner = user && !assessmentLoading && !hasAssessment;

  return (
    <>
      <Seo />

      <div className="container max-w-4xl py-8 space-y-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <FileDown className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold">Descargables</h1>
            <Badge className="bg-green-500/90 text-white">Nuevo</Badge>
          </div>
          <p className="text-muted-foreground">
            Recursos exclusivos para Product Builders. Descargá documentos, templates y guías.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        ) : error ? (
          <p className="text-destructive">Error al cargar los recursos</p>
        ) : resources?.length === 0 ? (
          <p className="text-muted-foreground">No hay recursos disponibles</p>
        ) : (
          <div className="space-y-4">
            {resources?.map((resource) => (
              <DownloadableCard key={resource.id} resource={resource} />
            ))}
          </div>
        )}

        {showAssessmentBanner && <AssessmentInviteBanner />}
      </div>
    </>
  );
}
