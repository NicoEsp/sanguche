import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, BookOpen, Wrench, Users, FileText, Lock, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { NeutralArea } from "@/utils/scoring";

interface DedicatedResourcesProps {
  neutralAreas?: NeutralArea[];
  locked?: boolean;
  mentoriaCompleted?: boolean;
}

const areaResources: Record<string, {
  tools: Array<{ name: string; description: string; link: string }>;
  content: Array<{ title: string; type: "article" | "book" | "course" | "template"; link: string }>;
  communities: Array<{ name: string; description: string; link: string }>;
}> = {
  roadmap: {
    tools: [
      { name: "ProductPlan", description: "Herramienta de roadmapping visual", link: "https://productplan.com" },
      { name: "Aha!", description: "Suite completa de product management", link: "https://aha.io" },
      { name: "Notion Templates", description: "Templates de roadmap personalizables", link: "https://notion.so/templates" }
    ],
    content: [
      { title: "Inspired - Marty Cagan", type: "book", link: "https://svpg.com/inspired-how-to-create-tech-products-customers-love/" },
      { title: "Product Roadmaps Course", type: "course", link: "https://productschool.com" },
      { title: "RICE Framework Template", type: "template", link: "https://miro.com/templates/rice-prioritization/" }
    ],
    communities: [
      { name: "Product Hunt Makers", description: "Comunidad global de makers", link: "https://producthunt.com" },
      { name: "Mind the Product", description: "Comunidad premium de PM", link: "https://mindtheproduct.com" }
    ]
  },
  analitica: {
    tools: [
      { name: "Mixpanel", description: "Analytics de producto avanzado", link: "https://mixpanel.com" },
      { name: "Amplitude", description: "Product intelligence platform", link: "https://amplitude.com" },
      { name: "Google Analytics 4", description: "Analytics web y app gratuito", link: "https://analytics.google.com" }
    ],
    content: [
      { title: "Lean Analytics - Ben Yoskovitz", type: "book", link: "https://leananalyticsbook.com" },
      { title: "SQL for Product Managers", type: "course", link: "https://mode.com/sql-tutorial/" },
      { title: "Metrics Dashboard Template", type: "template", link: "https://datastudio.google.com/gallery" }
    ],
    communities: [
      { name: "Product Analytics Slack", description: "Slack de analytics especializado", link: "https://productanalytics.slack.com" },
      { name: "Data Driven Product", description: "Newsletter y comunidad", link: "https://datadriven.product" }
    ]
  },
  stakeholders: {
    tools: [
      { name: "Miro", description: "Mapping de stakeholders colaborativo", link: "https://miro.com" },
      { name: "Luma", description: "Workshop planning y facilitation", link: "https://lu.ma" },
      { name: "Calendly", description: "Scheduling automático", link: "https://calendly.com" }
    ],
    content: [
      { title: "Getting to Yes - Roger Fisher", type: "book", link: "https://www.amazon.com/Getting-Yes-Negotiating-Agreement-Without/dp/0143118757" },
      { title: "Stakeholder Management Course", type: "course", link: "https://productschool.com" },
      { title: "Stakeholder Map Template", type: "template", link: "https://miro.com/templates/stakeholder-map/" }
    ],
    communities: [
      { name: "Product Coalition", description: "Medium publication sobre PM", link: "https://productcoalition.com" },
      { name: "Product Manager HQ", description: "Comunidad de Slack activa", link: "https://productmanagerhq.com" }
    ]
  },
  tecnico: {
    tools: [
      { name: "Postman", description: "Testing de APIs", link: "https://postman.com" },
      { name: "GitHub", description: "Seguimiento de desarrollo", link: "https://github.com" },
      { name: "Swagger", description: "Documentación de APIs", link: "https://swagger.io" }
    ],
    content: [
      { title: "The Tech-Savvy Product Manager", type: "book", link: "https://www.amazon.com/Tech-Savvy-Product-Manager-Technology-Development/dp/1733266216" },
      { title: "APIs for Product Managers", type: "course", link: "https://productschool.com" },
      { title: "Technical Requirements Template", type: "template", link: "https://notion.so/templates" }
    ],
    communities: [
      { name: "Product Technical Stack", description: "Slack técnico para PMs", link: "https://producttechnical.slack.com" },
      { name: "Dev.to Product", description: "Comunidad técnica", link: "https://dev.to/t/product" }
    ]
  },
  monetizacion: {
    tools: [
      { name: "ProfitWell", description: "SaaS metrics y pricing", link: "https://profitwell.com" },
      { name: "Paddle", description: "Billing y subscription management", link: "https://paddle.com" },
      { name: "Pricing Calculator", description: "Tools de pricing strategy", link: "https://priceoptimization.com" }
    ],
    content: [
      { title: "Monetizing Innovation - Madhavan Ramanujam", type: "book", link: "https://www.amazon.com/Monetizing-Innovation-Companies-Design-Product/dp/1119240867" },
      { title: "SaaS Pricing Strategy", type: "course", link: "https://priceintelligently.com" },
      { title: "Business Case Template", type: "template", link: "https://miro.com/templates/business-case/" }
    ],
    communities: [
      { name: "SaaS Growth", description: "Newsletter y comunidad", link: "https://saasgrowth.com" },
      { name: "Price Intelligently", description: "Comunidad de pricing", link: "https://priceintelligently.com" }
    ]
  }
};

export function DedicatedResources({ neutralAreas, locked = false, mentoriaCompleted = false }: DedicatedResourcesProps) {
  const navigate = useNavigate();

  const handleScrollToMentoria = () => {
    navigate('/mentoria');
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 100);
  };

  if (!neutralAreas || neutralAreas.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Recursos dedicados
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">
            Como tu perfil está muy equilibrado, en la mentoría personalizaremos los recursos según tus objetivos específicos.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Si no ha completado mentoría, mostrar contenido bloqueado
  const shouldShowLockedContent = !mentoriaCompleted && !locked;

  if (shouldShowLockedContent) {
    const firstArea = neutralAreas[0];
    
    return (
      <Card className="relative">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Recursos dedicados
            </CardTitle>
            <Badge variant="outline" className="ml-auto">
              <Lock className="h-3 w-3 mr-1" />
              Bloqueado
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Preview del primer área */}
          {firstArea && (
            <div className="border rounded-lg p-4 bg-muted/50 relative">
              <h4 className="font-medium text-foreground mb-3 capitalize">
                Recursos para {firstArea.label}
              </h4>
              
              {/* Secciones bloqueadas */}
              <div className="space-y-3">
                {['Herramientas Recomendadas', 'Contenido Curado', 'Comunidades'].map((sectionName, index) => (
                  <div key={index} className="relative">
                    <div className="flex items-center gap-2 mb-2">
                      {index === 0 && <Wrench className="h-4 w-4 text-muted-foreground" />}
                      {index === 1 && <FileText className="h-4 w-4 text-muted-foreground" />}
                      {index === 2 && <Users className="h-4 w-4 text-muted-foreground" />}
                      <span className="text-sm font-medium text-muted-foreground">
                        {sectionName}
                      </span>
                    </div>
                    
                    {/* Overlay de contenido bloqueado */}
                    <div className="h-16 bg-background/80 backdrop-blur-sm rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-not-allowed">
                      <div className="text-center">
                        <Lock className="h-4 w-4 text-muted-foreground mx-auto mb-1" />
                        <p className="text-xs text-muted-foreground">
                          Conexión con tus fortalezas
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Mensaje informativo */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-primary">
              <BookOpen className="h-5 w-5" />
              <span className="font-medium">Recursos curados para tu perfil</span>
            </div>
            
            <p className="text-sm text-muted-foreground">
              Este contenido se adapta 100% a vos. Lo desbloqueás después de tu sesión de mentoría personalizada.
            </p>

            <div className="pt-2">
              <Button onClick={handleScrollToMentoria} className="w-full">
                <Target className="h-4 w-4 mr-2" />
                Agendá tu mentoría para desbloquear tus recursos
              </Button>
            </div>
          </div>

          {/* Contador de áreas adicionales */}
          {neutralAreas && neutralAreas.length > 1 && (
            <div className="text-center text-sm text-muted-foreground bg-muted/30 rounded-lg p-3">
              <Lock className="h-4 w-4 inline mr-1" />
              +{neutralAreas.length - 1} áreas de recursos adicionales disponibles
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          Recursos dedicados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {neutralAreas.slice(0, 2).map((area) => {
            const resources = areaResources[area.key];
            if (!resources) return null;
            
            return (
              <AccordionItem key={area.key} value={area.key}>
                <AccordionTrigger disabled={locked} className="text-left">
                  <span className="text-lg font-medium">Recursos para {area.label}</span>
                </AccordionTrigger>
                <AccordionContent className="space-y-6 pt-4">
                  {/* Tools */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Wrench className="h-4 w-4" />
                      Herramientas recomendadas
                    </h4>
                    <div className="grid gap-3">
                      {resources.tools.map((tool, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <div className="font-medium text-foreground">{tool.name}</div>
                            <div className="text-sm text-muted-foreground">{tool.description}</div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={tool.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Content */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Contenido curado
                    </h4>
                    <div className="grid gap-3">
                      {resources.content.map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="text-xs">
                              {item.type}
                            </Badge>
                            <div className="font-medium text-foreground">{item.title}</div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={item.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Communities */}
                  <div>
                    <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Comunidades
                    </h4>
                    <div className="grid gap-3">
                      {resources.communities.map((community, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                          <div>
                            <div className="font-medium text-foreground">{community.name}</div>
                            <div className="text-sm text-muted-foreground">{community.description}</div>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={community.link} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}