import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, ArrowRight, Zap } from "lucide-react";
import { HowItWorks } from "@/components/sections/HowItWorks";

import { WhyProductPrepa } from "@/components/sections/WhyProductPrepa";
import { useAuth } from '@/contexts/AuthContext';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import { LemonSqueezyCheckout } from "@/components/LemonSqueezyCheckout";

const Index = () => {
  const {
    isAuthenticated
  } = useAuth();
  const { trackEvent } = useMixpanelTracking();
  const premiumBenefits = [
    <>Acceso a guía de carrera personalizada diseñada por <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></>,
    "Seguimiento visual de tu progreso y objetivos",
    "Recursos curados según tus áreas de mejora",
    "Roadmap de carrera diseñado a tu medida",
    "Nuevos contenidos y ejercicios cada mes"
  ];
  return <>
      <Seo 
        title="ProductPrepa — Autoevaluación PM" 
        description="Evalúa tu seniority en Product Management y accede a recomendaciones personalizadas, recursos curados y un roadmap estructurado para crecer en tu carrera." 
        canonical="/" 
      />
      <main className="min-h-screen bg-background">
        {/* Enhanced Hero Section */}
        <section className="container text-center py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />
          
          <div className="flex items-center justify-center mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Zap className="h-4 w-4 mr-2" />
              Evaluación específica para Product Managers (o roles similares)
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Impulsa tu carrera como <span className="text-primary">Product Manager</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">Plataforma integral que identifica tu nivel actual y áreas de crecimiento, con recursos curados y roadmap de carrera diseñado por <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a>.</p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button asChild size="lg" className="w-full sm:w-auto text-base px-8 py-6 font-semibold" onClick={() => trackEvent('landing_page_cta_click', { cta_location: 'hero', cta_text: isAuthenticated ? 'Continuar evaluación' : 'Comenzar evaluación gratis' })}>
              <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                {isAuthenticated ? "Continuar evaluación" : "Comenzar evaluación gratis"}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base px-8 py-6" onClick={() => trackEvent('landing_page_cta_click', { cta_location: 'hero_premium' })}>
              <Link to="/premium">Ver funciones premium</Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>100% gratis para empezar</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Sin tarjeta de crédito</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Roadmap personalizado</span>
            </div>
          </div>
        </section>

        <HowItWorks />
        
        {/* CTA after HowItWorks */}
        <section className="text-center mx-0 my-0 px-[2px] py-[20px]">
          <div className="container mx-auto px-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90" onClick={() => trackEvent('landing_page_cta_click', { cta_location: 'after_how_it_works' })}>
              <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                Evalúate ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
        
        {/* <Testimonials /> */}
        
        <WhyProductPrepa />

        {/* Free vs Premium Section */}
        <section className="container py-12 sm:py-16 px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Todo lo que necesitas para crecer</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Comienza gratis con la autoevaluación y áreas de mejora. Desbloquea recursos avanzados y seguimiento de progreso con Premium.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 md:gap-8 max-w-4xl mx-auto">
            {/* Plan Gratuito */}
            <Card className="flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Gratis</CardTitle>
                  <Badge variant="secondary">Siempre gratis</Badge>
                </div>
                <p className="text-muted-foreground">Perfecto para comenzar tu autoevaluación</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Autoevaluación completa de habilidades PM</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Identificación y priorización de áreas de mejora</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Estimación de nivel de seniority</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Recursos gratuitos para ayudarte</span>
                  </div>
                </div>
                <Button asChild className="w-full mt-6" onClick={() => trackEvent('landing_page_cta_click', { cta_location: 'pricing_free' })}>
                  <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                    {isAuthenticated ? "Ir a evaluación" : "Comenzar gratis"}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Plan Premium */}
            <Card className="border-primary flex flex-col h-full">
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Star className="h-4 w-4 text-primary" />
                  <Badge variant="secondary">Premium</Badge>
                  <Star className="h-4 w-4 text-primary" />
                </div>
                <CardTitle className="text-xl sm:text-2xl mb-2">Prepárate aún más para dar el salto</CardTitle>
                <p className="text-muted-foreground text-sm sm:text-base">
                  Para acceder a más funcionalidades de ProductPrepa necesitas una suscripción Premium
                </p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col space-y-6">
                <div className="space-y-3">
                  <h3 className="font-semibold">Lo que obtienes con Premium:</h3>
                  <ul className="space-y-2">
                    {premiumBenefits.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-primary mb-1">
                    ARS $25.000 <span className="text-base font-normal text-muted-foreground">/mes</span>
                  </div>
                  <p className="text-sm text-muted-foreground">Cancela cuando quieras</p>
                </div>

                <div className="pt-2 mt-auto">
                  <LemonSqueezyCheckout onCheckoutStart={() => trackEvent('landing_page_cta_click', { cta_location: 'pricing_premium' })} />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
    </>;
};
export default Index;