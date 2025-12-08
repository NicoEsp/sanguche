import { StepperStep, Audience } from '@/types/starterpack';
import { useAssessmentData } from '@/hooks/useAssessmentData';
import { cn } from '@/lib/utils';
import { FileText, ClipboardCheck, Crown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';

interface StepperRouteProps {
  steps: StepperStep[];
  audience: Audience;
}

export function StepperRoute({ steps, audience }: StepperRouteProps) {
  const { hasAssessment } = useAssessmentData();

  return (
    <div className="relative">
      {/* Vertical line connector */}
      <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-border" />
      
      <div className="space-y-6">
        {steps.map((step, index) => {
          const isAssessmentComplete = step.isAssessmentStep && hasAssessment;
          
          return (
            <div key={step.number} className="relative flex gap-4">
              {/* Step number circle */}
              <div className={cn(
                "relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-sm font-semibold",
                step.isPremiumStep 
                  ? "bg-amber-500/10 text-amber-600 border-2 border-amber-500/30"
                  : isAssessmentComplete
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground border-2 border-border"
              )}>
                {step.isPremiumStep ? (
                  <Crown className="w-5 h-5" />
                ) : (
                  step.number
                )}
              </div>
              
              {/* Step content */}
              <div className="flex-1 pb-6">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  {step.isPremiumStep && (
                    <Badge variant="outline" className="text-amber-600 border-amber-500/30">
                      Premium
                    </Badge>
                  )}
                  {isAssessmentComplete && (
                    <Badge variant="secondary" className="text-xs">
                      Completado
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {step.description}
                </p>
                
                {/* Resource link or action */}
                {step.resource && (
                  <Button variant="outline" size="sm" asChild>
                    <a href="#" className="inline-flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      {step.resource.title}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </Button>
                )}
                
                {step.isAssessmentStep && !hasAssessment && (
                  <Button size="sm" asChild>
                    <Link to="/autoevaluacion" className="inline-flex items-center gap-2">
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
          );
        })}
      </div>
    </div>
  );
}
