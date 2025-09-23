import { Seo } from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";
import { PaywallCard } from "@/components/PaywallCard";
import { isFeatureAvailable, FEATURES } from "@/utils/features";
import { useSubscription } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const recs = [
  {
    title: "Profundiza en Discovery",
    steps: ["Realiza 5 entrevistas con usuarios", "Mapea oportunidades (Opportunity Solution Tree)", "Define hipótesis y experimentos"],
  },
  {
    title: "Mejora tu Analítica",
    steps: ["Aprende SQL básico", "Define métricas de producto", "Crea un dashboard de seguimiento"],
  },
  {
    title: "Fortalece Roadmapping",
    steps: ["Explora marcos (RICE/ICE)", "Planifica por outcomes", "Coordina con marketing y tech"],
  },
];

export default function Recommendations() {
  const { hasActivePremium, loading } = useSubscription();
  const { toast } = useToast();

  // Check for success payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      toast({
        title: "¡Suscripción exitosa!",
        description: "Bienvenido a ProductPrepa Premium. Ya tienes acceso a todas las funcionalidades."
      });
      // Clean URL
      window.history.replaceState({}, '', '/mentoria');
    }
  }, [toast]);
  
  // Verificar si el usuario tiene acceso a recomendaciones
  const hasAccess = isFeatureAvailable(FEATURES.RECOMMENDATIONS, hasActivePremium);

  if (loading) {
    return (
      <>
        <Seo
          title="Mentoría personalizada — ProductPrepa"
          description="Descubre mentoría curada para cerrar tus áreas de mejora en Product Management."
          canonical="/mentoria"
        />
        <div className="container py-10 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </>
    );
  }

  if (!hasAccess) {
    return (
      <>
        <Seo
          title="Mentoría personalizada — ProductPrepa"
          description="Descubre mentoría curada para cerrar tus áreas de mejora en Product Management."
          canonical="/mentoria"
        />
        <PaywallCard 
          title="Preparate aún más para dar el salto"
          feature="mentoría curada"
        />
      </>
    );
  }

  return (
    <>
      <Seo
        title="Mentoría personalizada — ProductPrepa"
        description="Descubre mentoría curada para cerrar tus áreas de mejora en Product Management."
        canonical="/mentoria"
      />
      <section className="container py-10">
        <h1 className="text-3xl font-semibold mb-6">Mentoría personalizada</h1>
        <div className="space-y-6">
          {recs.map((rec, index) => (
            <Card key={index}>
              <CardHeader>
                <CardTitle>{rec.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {rec.steps.map((step, stepIndex) => (
                    <li key={stepIndex} className="flex items-start gap-2">
                      <span className="text-primary font-medium">{stepIndex + 1}.</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="mt-8 flex gap-3">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button disabled>Compartir en LinkedIn</Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Próximamente</p>
            </TooltipContent>
          </Tooltip>
          <Button asChild variant="outline">
            <Link to="/mejoras">Atrás</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
