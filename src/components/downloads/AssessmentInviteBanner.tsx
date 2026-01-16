import { Target, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';
import { Mixpanel } from '@/lib/mixpanel';

export function AssessmentInviteBanner() {
  useEffect(() => {
    Mixpanel.track('assessment_banner_shown', { location: 'descargables' });
  }, []);

  const handleClick = () => {
    Mixpanel.track('assessment_banner_clicked', { location: 'descargables' });
  };

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex-shrink-0 p-3 rounded-full bg-primary/10">
          <Target className="h-6 w-6 text-primary" />
        </div>
        
        <div className="flex-1 space-y-1">
          <h3 className="font-semibold text-foreground">
            ¿Ya conoces tu nivel de habilidades?
          </h3>
          <p className="text-sm text-muted-foreground">
            Completa tu autoevaluación para recibir recursos personalizados según tus áreas de mejora. Solo toma 3-5 minutos.
          </p>
        </div>

        <Button asChild onClick={handleClick} className="flex-shrink-0">
          <Link to="/autoevaluacion">
            Hacer autoevaluación
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
