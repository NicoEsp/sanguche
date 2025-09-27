import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Star, Target, Calendar, CheckCircle } from "lucide-react";

interface LeadershipRecommendationsProps {
  locked?: boolean;
}

export function LeadershipRecommendations({ locked = false }: LeadershipRecommendationsProps) {
  const leadershipRecommendations = [
    {
      id: "strategic-vision",
      title: "Visión Estratégica y Planificación a Largo Plazo",
      timeline: "3-6 meses",
      level: "Avanzado",
      description: "Desarrolla habilidades de pensamiento estratégico para liderar la visión de producto a nivel organizacional.",
      objectives: [
        "Crear roadmaps estratégicos alineados con objetivos de negocio",
        "Facilitar sesiones de planificación estratégica con stakeholders C-level",
        "Desarrollar frameworks de toma de decisiones complejas"
      ],
      prerequisites: [
        "Experiencia liderando equipos de producto",
        "Comprensión profunda del mercado y competencia",
        "Habilidades de comunicación ejecutiva"
      ],
      successCriteria: [
        "Presentar visión de producto a nivel board",
        "Influenciar decisiones estratégicas de la empresa",
        "Mentorear a otros PMs en pensamiento estratégico"
      ]
    },
    {
      id: "team-leadership",
      title: "Liderazgo de Equipos de Alto Rendimiento",
      timeline: "2-4 meses",
      level: "Avanzado",
      description: "Perfecciona habilidades de liderazgo para construir y dirigir equipos de producto excepcionales.",
      objectives: [
        "Implementar frameworks de coaching y desarrollo de talento",
        "Crear cultura de producto data-driven y customer-centric",
        "Optimizar procesos de colaboración cross-funcional"
      ],
      prerequisites: [
        "Experiencia gestionando equipos multidisciplinarios",
        "Track record de entrega exitosa de productos",
        "Habilidades de resolución de conflictos"
      ],
      successCriteria: [
        "Liderar equipos de 15+ personas efectivamente",
        "Desarrollar pipeline de talento interno",
        "Implementar métricas de team performance"
      ]
    },
    {
      id: "innovation-management",
      title: "Gestión de Innovación y Nuevos Mercados",
      timeline: "4-8 meses",
      level: "Experto",
      description: "Lidera iniciativas de innovación disruptiva y expansión a nuevos mercados.",
      objectives: [
        "Diseñar procesos de innovation pipeline",
        "Evaluar oportunidades de nuevos mercados y verticales",
        "Gestionar portfolio de experimentos de alto riesgo/alto impacto"
      ],
      prerequisites: [
        "Experiencia en 0-to-1 product development",
        "Conocimiento profundo de metodologías ágiles",
        "Experiencia en venture capital o startups"
      ],
      successCriteria: [
        "Lanzar productos en nuevos mercados exitosamente",
        "Crear frameworks de evaluación de oportunidades",
        "Establecer partnerships estratégicos"
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Star className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Recomendaciones de Liderazgo Avanzado</CardTitle>
        </div>
        <p className="text-muted-foreground">
          Basado en tu perfil excepcional, aquí tienes áreas de crecimiento hacia roles de liderazgo senior.
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full" disabled={locked}>
          {leadershipRecommendations.map((recommendation) => (
            <AccordionItem key={recommendation.id} value={recommendation.id}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center justify-between w-full pr-4">
                  <div className="flex-1">
                    <div className="font-medium">{recommendation.title}</div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{recommendation.timeline}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {recommendation.level}
                      </Badge>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="text-sm space-y-4">
                <p className="text-muted-foreground">{recommendation.description}</p>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center gap-2 font-medium mb-2">
                      <Target className="h-4 w-4 text-primary" />
                      <span>Objetivos específicos</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {recommendation.objectives.map((objective, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          • {objective}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-medium mb-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Prerequisites cumplidos</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {recommendation.prerequisites.map((prerequisite, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          ✓ {prerequisite}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <div className="flex items-center gap-2 font-medium mb-2">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span>Criterios de éxito</span>
                    </div>
                    <ul className="space-y-1 ml-6">
                      {recommendation.successCriteria.map((criteria, idx) => (
                        <li key={idx} className="text-muted-foreground">
                          → {criteria}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}