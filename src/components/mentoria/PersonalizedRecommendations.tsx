import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, Clock, Target, TrendingUp, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { NeutralArea } from "@/utils/scoring";
import { LeadershipRecommendations } from "./LeadershipRecommendations";

interface PersonalizedRecommendationsProps {
  neutralAreas?: NeutralArea[];
  locked?: boolean;
  mentoriaCompleted?: boolean;
}

const areaRecommendations: Record<string, {
  title: string;
  objectives: string[];
  timeline: string;
  prerequisites: string;
  successCriteria: string[];
}> = {
  roadmap: {
    title: "Lleva tu roadmapping al siguiente nivel",
    objectives: [
      "Dominar frameworks avanzados de priorización (RICE, ICE, Kano)",
      "Crear roadmaps estratégicos con dependencies claras",
      "Implementar comunicación efectiva de cambios en el roadmap"
    ],
    timeline: "6-8 semanas",
    prerequisites: "Tu base sólida en estrategia facilitará este desarrollo",
    successCriteria: [
      "Roadmap actualizado con criterios objetivos de priorización",
      "Stakeholders alineados en las decisiones de roadmap",
      "Proceso documentado para evaluar y comunicar cambios"
    ]
  },
  analitica: {
    title: "Potencia tus decisiones con data",
    objectives: [
      "Definir KPIs avanzados y métricas leading/lagging",
      "Crear dashboards automatizados para monitoring continuo",
      "Desarrollar frameworks de experimentación y A/B testing"
    ],
    timeline: "4-6 semanas",
    prerequisites: "Tu experiencia en discovery te ayudará con el diseño de experimentos",
    successCriteria: [
      "Dashboard funcional con métricas clave del producto",
      "Al menos 2 experimentos ejecutados con conclusiones",
      "Framework definido para toma de decisiones basada en datos"
    ]
  },
  stakeholders: {
    title: "Amplifica tu influencia organizacional",
    objectives: [
      "Mapear stakeholders complejos y sus motivaciones",
      "Desarrollar estrategias de comunicación diferenciadas",
      "Implementar procesos de alineación y resolución de conflictos"
    ],
    timeline: "4-5 semanas",
    prerequisites: "Tus fortalezas en comunicación serán clave para este crecimiento",
    successCriteria: [
      "Mapa actualizado de stakeholders con estrategias específicas",
      "Procesos de alineación implementados y funcionando",
      "Feedback positivo de stakeholders en influencia y gestión"
    ]
  },
  tecnico: {
    title: "Fortalece tu credibilidad técnica",
    objectives: [
      "Comprender arquitecturas de software y trade-offs técnicos",
      "Participar efectivamente en discusiones de feasibilidad",
      "Evaluar deuda técnica y su impacto en el producto"
    ],
    timeline: "6-8 semanas",
    prerequisites: "Tu capacidad analítica facilitará el aprendizaje técnico",
    successCriteria: [
      "Participación activa y valorada en tech reviews",
      "Evaluaciones precisas de complejidad técnica",
      "Roadmap técnico balanceado con objetivos de producto"
    ]
  },
  monetizacion: {
    title: "Conecta producto con business impact",
    objectives: [
      "Analizar modelos de monetización y pricing strategies",
      "Conectar features con métricas de revenue",
      "Desarrollar business cases sólidos para nuevas iniciativas"
    ],
    timeline: "5-6 semanas",
    prerequisites: "Tu perfil Senior te permite abordar estos conceptos avanzados",
    successCriteria: [
      "Business case documentado para al menos una iniciativa",
      "Métricas de revenue conectadas con roadmap de producto",
      "Propuesta de optimización de monetización evaluada"
    ]
  }
};

export function PersonalizedRecommendations({ neutralAreas, locked = false, mentoriaCompleted = false }: PersonalizedRecommendationsProps) {
  if (!neutralAreas || neutralAreas.length === 0) {
    return <LeadershipRecommendations locked={locked} />;
  }

  // Si no ha completado mentoría, mostrar contenido bloqueado
  const shouldShowLockedContent = !mentoriaCompleted && !locked;

  if (shouldShowLockedContent) {
    return (
      <Card className="relative">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Recomendaciones personalizadas
            </CardTitle>
            <Badge variant="outline" className="ml-auto">
              <Lock className="h-3 w-3 mr-1" />
              Bloqueado
            </Badge>
          </div>
          <CardDescription>
            Plan de desarrollo personalizado basado en tu perfil y objetivos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview de las recomendaciones */}
          <div className="space-y-3">
            {neutralAreas.slice(0, 2).map((area, index) => {
              const rec = areaRecommendations[area.key];
              if (!rec) return null;
              
              return (
                <div 
                  key={area.key} 
                  className="border rounded-lg p-4 bg-muted/50 relative"
                  role="region"
                  aria-disabled="true"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <Target className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium text-foreground">
                      {rec.title}
                    </h4>
                    <Badge variant="outline" className="ml-auto text-xs">
                      {area.value}/5 desarrollo
                    </Badge>
                  </div>
                  
                  {/* Overlay de contenido bloqueado */}
                  <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-sm rounded-lg flex items-center justify-center cursor-not-allowed">
                    <div className="text-center space-y-2">
                      <Lock className="h-6 w-6 text-muted-foreground mx-auto" />
                      <p className="text-sm text-foreground font-medium">
                        Conexión con tus fortalezas
                      </p>
                      <p className="text-xs text-muted-foreground">
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
              <span className="font-medium">Contenido adaptado 100% a vos</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Este contenido se adapta 100% a vos. Lo desbloqueás después de tu sesión de mentoría personalizada.
            </p>

            <div className="pt-2">
              <Button asChild className="w-full">
                <Link to="/premium">
                  <Target className="h-4 w-4 mr-2" />
                  Agendá tu mentoría para desbloquear tus recursos
                </Link>
              </Button>
            </div>
          </div>

          {/* Contador de áreas adicionales */}
          {neutralAreas && neutralAreas.length > 2 && (
            <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              <Lock className="h-4 w-4 inline mr-1" />
              +{neutralAreas.length - 2} recomendaciones adicionales disponibles
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Recomendaciones personalizadas</h2>
      
      <Accordion type="multiple" className="w-full space-y-4">
        {neutralAreas.map((area) => {
          const rec = areaRecommendations[area.key];
          if (!rec) return null;
          
          return (
            <AccordionItem key={area.key} value={area.key} className="border border-border rounded-lg">
              <AccordionTrigger disabled={locked} className="px-6 py-4 hover:no-underline">
                <div className="flex items-center justify-between w-full mr-4">
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-foreground">
                      {rec.title}
                    </h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge variant="outline" className="bg-primary/5">
                        <Clock className="mr-1 h-3 w-3" />
                        {rec.timeline}
                      </Badge>
                      <Badge variant="outline" className="bg-secondary/50">
                        Nivel actual: {area.value}/5
                      </Badge>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-6 pb-6">
                <div className="space-y-4 border-l-4 border-l-primary pl-4">
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      Objetivos específicos
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {rec.objectives.map((obj, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-primary font-medium mt-0.5">•</span>
                          <span>{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-muted/50 p-3 rounded-md">
                    <p className="text-sm font-medium text-foreground mb-1">Conexión con tus fortalezas:</p>
                    <p className="text-sm text-muted-foreground">{rec.prerequisites}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-foreground mb-2 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Criterios de éxito
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {rec.successCriteria.map((criteria, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-success font-medium mt-0.5">✓</span>
                          <span>{criteria}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}