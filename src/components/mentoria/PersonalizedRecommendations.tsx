import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Clock, Target, TrendingUp } from "lucide-react";
import { NeutralArea } from "@/utils/scoring";

interface PersonalizedRecommendationsProps {
  neutralAreas: NeutralArea[];
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

export function PersonalizedRecommendations({ neutralAreas }: PersonalizedRecommendationsProps) {
  if (neutralAreas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-success" />
            Recomendaciones personalizadas
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto mb-4" />
          <h3 className="font-medium text-foreground mb-2">¡Perfil excepcional!</h3>
          <p className="text-sm text-muted-foreground">
            Tu perfil está muy equilibrado. En la mentoría nos enfocaremos en estrategias de liderazgo avanzado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground mb-4">Recomendaciones personalizadas</h2>
      
      <div className="grid gap-6">
        {neutralAreas.map((area) => {
          const rec = areaRecommendations[area.key];
          if (!rec) return null;
          
          return (
            <Card key={area.key} className="border-l-4 border-l-primary">
              <CardHeader>
                <CardTitle className="text-lg text-foreground">
                  {rec.title}
                </CardTitle>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className="bg-primary/5">
                    <Clock className="mr-1 h-3 w-3" />
                    {rec.timeline}
                  </Badge>
                  <Badge variant="outline" className="bg-secondary/50">
                    Nivel actual: {area.value}/5
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}