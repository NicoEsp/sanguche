import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Lock, Target, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { NeutralArea } from "@/utils/scoring";

interface LockedRecommendationsProps {
  neutralAreas: NeutralArea[];
}

const areaIcons = {
  roadmap: Target,
  analitica: CheckCircle2,
  liderazgo: ArrowRight,
  stakeholders: Clock,
  estrategia: Target,
  ejecucion: CheckCircle2,
  discovery: Target,
  ux: ArrowRight,
  comunicacion: Clock,
  tecnico: Target,
  monetizacion: CheckCircle2,
} as const;

export function LockedRecommendations({ neutralAreas }: LockedRecommendationsProps) {
  // Mostrar solo las primeras 2 áreas como preview
  const previewAreas = neutralAreas.slice(0, 2);

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5 text-muted-foreground" />
          <CardTitle>Recomendaciones Personalizadas</CardTitle>
          <Badge variant="outline" className="ml-auto">
            <Lock className="h-3 w-3 mr-1" />
            Bloqueado
          </Badge>
        </div>
        <CardDescription>
          Plan de objetivos específicos para tus áreas de mejora
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview de las áreas */}
        <div className="space-y-3">
          {previewAreas.map((area, index) => {
            const Icon = areaIcons[area.key as keyof typeof areaIcons] || Target;
            return (
              <div 
                key={area.key} 
                className="border rounded-lg p-4 bg-muted/50 relative"
                role="region"
                aria-disabled="true"
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <h4 className="font-medium text-foreground capitalize">
                    {area.label}
                  </h4>
                  <Badge variant="outline" className="ml-auto text-xs">
                    {area.value}/5 desarrollo
                  </Badge>
                </div>
                
                {/* Overlay de contenido bloqueado */}
                <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center cursor-not-allowed">
                  <div className="text-center space-y-2">
                    <Lock className="h-6 w-6 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground font-medium">
                      Objetivos y plan detallado
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Mensaje informativo */}
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-3">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Target className="h-5 w-5" />
            <span className="font-medium">¿Qué obtendrás al desbloquear?</span>
          </div>
          
          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Objetivos específicos por área de mejora</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Plan de desarrollo con timeline personalizado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Criterios de éxito y métricas de progreso</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Prerrequisitos y recursos recomendados</span>
            </div>
          </div>

          <div className="pt-2">
            <Button asChild className="w-full">
              <Link to="#hero">
                <Target className="h-4 w-4 mr-2" />
                Agendar Mentoría 1:1 para Desbloquear
              </Link>
            </Button>
          </div>
        </div>

        {/* Contador de áreas adicionales */}
        {neutralAreas.length > 2 && (
          <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
            <Lock className="h-4 w-4 inline mr-1" />
            +{neutralAreas.length - 2} áreas de mejora adicionales disponibles
          </div>
        )}
      </CardContent>
    </Card>
  );
}