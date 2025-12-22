import React from 'react';
import { StepperStep, Audience } from '@/types/starterpack';
import { useAssessmentData } from '@/hooks/useAssessmentData';
import { useResourceAccess } from '@/hooks/useStarterPackResources';
import { useResourceProgress } from '@/hooks/useResourceProgress';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { FileText, ClipboardCheck, Crown, ExternalLink, Check, Download, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useState } from 'react';

interface StepperRouteProps {
  steps: StepperStep[];
  audience: Audience;
  showComingSoon?: boolean;
}

export function StepperRoute({ steps, audience, showComingSoon = false }: StepperRouteProps) {
  const { hasAssessment } = useAssessmentData();
  const { getDownloadUrl, canAccess, isAuthenticated } = useResourceAccess();
  const { markAsDownloaded, isDownloaded } = useResourceProgress();
  const { isAuthenticated: authCheck } = useAuth();
  const navigate = useNavigate();
  const [downloadingSlug, setDownloadingSlug] = useState<string | null>(null);

  const handleResourceClick = async (step: StepperStep) => {
    if (!step.resource) return;

    const resource = step.resource;

    // Check if user needs to login
    if (resource.access_type === 'requires_account' && !isAuthenticated) {
      navigate('/auth?redirect=/starterpack/' + audience);
      return;
    }

    // Check if user needs premium
    if (resource.access_type === 'premium' && !canAccess(resource)) {
      navigate('/premium');
      return;
    }

    // Get download URL
    setDownloadingSlug(resource.slug);
    try {
      const url = await getDownloadUrl(resource);
      if (url) {
        window.open(url, '_blank');
        markAsDownloaded(resource.slug);
        toast.success(`Recurso "${resource.title}" descargado`);
      } else {
        toast.error('No se pudo obtener el recurso');
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error downloading resource:', error);
      toast.error('Error al descargar el recurso');
    } finally {
      setDownloadingSlug(null);
    }
  };

  return (
    <div className="relative">
      {/* Vertical line connector */}
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />
      
      <div className="space-y-6">
        {steps.map((step, index) => {
          // Check if we should show "Coming Soon" banner after assessment step
          const showComingSoonBanner = showComingSoon && index === 0 && steps.length === 2;
          const isAssessmentComplete = step.isAssessmentStep && hasAssessment;
          const isResourceDownloaded = step.resource && isDownloaded(step.resource.slug);
          const isStepComplete = isAssessmentComplete || isResourceDownloaded;
          const isDownloading = step.resource && downloadingSlug === step.resource.slug;
          
          return (
            <React.Fragment key={step.number}>
              <div 
                id={`step-${step.number}`}
                className="relative flex gap-4 scroll-mt-24"
              >
              {/* Step number circle */}
              <div className={cn(
                "relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold transition-all",
                step.isPremiumStep 
                  ? "bg-background ring-4 ring-background text-amber-600 border-2 border-amber-500/30"
                  : isStepComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border-2 border-border"
              )}>
                {step.isPremiumStep ? (
                  <Crown className="w-5 h-5" />
                ) : isStepComplete ? (
                  <Check className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              
              {/* Step content */}
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  {step.isPremiumStep && (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                      Premium
                    </Badge>
                  )}
                  {isStepComplete && (
                    <Badge variant="secondary" className="text-xs bg-primary/10 text-primary">
                      <Check className="w-3 h-3 mr-1" />
                      Completado
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {step.description}
                </p>
                
                {/* Resource link or action */}
                {step.resource && (
                  hasAssessment ? (
                    <Button 
                      variant={isResourceDownloaded ? "secondary" : "outline"} 
                      size="sm"
                      onClick={() => handleResourceClick(step)}
                      disabled={isDownloading}
                      className="animate-fade-in"
                    >
                      {isDownloading ? (
                        <span className="animate-spin mr-2">⏳</span>
                      ) : isResourceDownloaded ? (
                        <Check className="w-4 h-4 mr-2" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      {step.resource.title}
                      <ExternalLink className="w-3 h-3 ml-2" />
                    </Button>
                  ) : (
                    <Link 
                      to={authCheck ? "/autoevaluacion" : "/auth?redirect=/autoevaluacion"} 
                      className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                    >
                      <Lock className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      <span className="underline-offset-2 group-hover:underline">
                        Completa la autoevaluación para desbloquear
                      </span>
                    </Link>
                  )
                )}
                
                {step.isAssessmentStep && !hasAssessment && (
                  <Button size="sm" asChild>
                    <Link 
                      to={authCheck ? "/autoevaluacion" : "/auth?redirect=/autoevaluacion"} 
                      className="inline-flex items-center gap-2"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      Hacer autoevaluación
                    </Link>
                  </Button>
                )}
                
                {step.isPremiumStep && (
                  <Button variant="outline" size="sm" asChild>
                    <Link to="/premium" className="inline-flex items-center gap-2">
                      <Crown className="w-4 h-4" />
                      Ver Premium
                    </Link>
                  </Button>
                )}
              </div>
            </div>
            
            {/* Coming Soon Banner - shown after assessment step when no resources */}
            {showComingSoonBanner && (
              <div className="relative flex gap-4 ml-16">
                <div className="flex-1 p-6 rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 text-center">
                  <h3 className="text-lg font-semibold text-primary mb-2">🚧 Próximamente</h3>
                  <p className="text-muted-foreground text-sm">
                    Estamos preparando recursos increíbles para este camino. ¡Volvé pronto!
                  </p>
                </div>
              </div>
            )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
