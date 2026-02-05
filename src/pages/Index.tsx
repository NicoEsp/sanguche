import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, ArrowRight, Zap, Rocket, Crown, Users } from "lucide-react";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { SocialProofStrip } from "@/components/landing/SocialProofStrip";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { WhyProductPrepa } from "@/components/sections/WhyProductPrepa";
import { useAuth } from '@/contexts/AuthContext';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import { LemonSqueezyCheckout } from "@/components/LemonSqueezyCheckout";
import { usePricing } from "@/hooks/usePricing";
import { useHomeRedirect } from '@/hooks/useHomeRedirect';
import { LoadingScreen } from '@/components/LoadingScreen';

const Index = () => {
  // Hook para redirigir usuarios autenticados según su estado (V3)
  const { isRedirecting, isFading, destination } = useHomeRedirect();
  
  const {
    isAuthenticated
  } = useAuth();
  const { trackEvent } = useMixpanelTracking();
  const { premium, repremium, loading: pricingLoading } = usePricing();

  // Mostrar skeleton loading específico según página destino
  if (isRedirecting) {
    return (
      <LoadingScreen 
        isFading={isFading} 
        variant="skeleton" 
        destination={destination as '/progreso' | '/mejoras' | '/autoevaluacion' | null}
      />
    );
  }

  const premiumBenefits = [
    "Todo lo incluido en Gratis",
    "1 sesión mensual 1:1 con NicoProducto",
    "Tu Career Path con objetivos concretos",
    "Acceso al Starter Pack completo",
    "Recursos curados según tus áreas de mejora"
  ];

  const repremiumBenefits = [
    "Todo lo incluido en Premium",
    "2 sesiones mensuales 1:1 con NicoProducto",
    "Acceso completo a todos los Cursos",
    "Feedback personalizado en ejercicios",
    "Acceso prioritario a nuevos contenidos"
  ];

  const indexSchema = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "ProductPrepa",
      "url": "https://productprepa.com",
      "logo": "https://productprepa.com/favicon.png",
      "sameAs": [
        "https://twitter.com/nicoproducto",
        "https://www.linkedin.com/in/nicolas-espindola/"
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "ProductPrepa",
      "url": "https://productprepa.com",
      "description": "Aprendé Producto en una plataforma que combina Cursos, evaluación de habilidades, tu propio Career Path y mentoría personalizada."
    }
  ];

  return <>
      <Seo 
        title="ProductPrepa - Plataforma para crecer en Producto" 
        description="Aprendé Producto en una plataforma que combina Cursos, evaluación de habilidades, tu propio Career Path y mentoría personalizada."
        canonical="/" 
        keywords="product management, autoevaluación PM, seniority, carrera producto, product manager, evaluación profesional, desarrollo PM"
        jsonLd={indexSchema}
      />
      <main className="min-h-screen bg-background">
        {/* Enhanced Hero Section - Optimizado para reducir bounce rate */}
        <section className="container text-center py-16 sm:py-24 px-4 sm:px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5 -z-10" />
          
          <div className="flex items-center justify-center mb-6">
            <Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
              <Zap className="h-4 w-4 mr-2" />
              Gratis · Solo 5 minutos
            </Badge>
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
            Descubrí tu nivel real como <span className="text-primary">Product Manager</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
            No importa de donde vengas o el rol que ocupes, todos tenemos habilidades de Producto.
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Accedé a una autoevaluación diseñada por{' '}
            <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">
              NicoProducto
            </a>{' '}
            para identificar tus fortalezas y áreas de mejora.
          </p>
          
          <Button asChild size="lg" className="text-lg px-10 py-7 font-semibold shadow-lg" onClick={() => trackEvent('landing_page_cta_click', { cta_location: 'hero', cta_text: 'Comenzar evaluación gratis' })}>
            <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
              Comenzar evaluación gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
          
          {/* Social proof inmediato */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" />
              <span className="font-medium">Recursos curados y exclusivos</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>11 competencias</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-primary" />
              <span>Roadmap personalizado</span>
            </div>
          </div>
        </section>

        <SocialProofStrip />

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

        {/* Starter Pack Section */}
        <section className="container py-12 sm:py-16 px-4 sm:px-6">
          <Card className="bg-gradient-to-br from-primary/5 via-background to-secondary/5 border-primary/20">
            <CardContent className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="flex-shrink-0">
                  <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <Rocket className="h-8 w-8 text-primary" />
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <h3 className="text-xl sm:text-2xl font-bold mb-2">¿Empezando en Producto?</h3>
                  <p className="text-muted-foreground max-w-xl">
                    Te preparamos un Starter Pack con recursos concretos y un camino claro para dar tus primeros pasos como PM o crecer hacia roles de liderazgo.
                  </p>
                </div>
                <div className="flex-shrink-0">
                  <Button asChild size="lg" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <Link to="/starterpack">
                      Ver Starter Pack
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Planes Section */}
        <section className="container py-12 sm:py-16 px-4 sm:px-6">
          <div className="text-center mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">Elige tu plan</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Desde autoevaluación gratuita hasta mentoría personalizada y cursos especializados.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3 md:gap-6 max-w-5xl mx-auto">
            {/* Plan Gratuito */}
            <Card className="flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Gratis</CardTitle>
                  <Badge variant="secondary">Siempre gratis</Badge>
                </div>
                <p className="text-muted-foreground text-sm">Perfecto para comenzar</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Autoevaluación completa</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Áreas de mejora priorizadas</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">Estimación de seniority</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span className="text-sm">PDFs gratuitos</span>
                  </div>
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-center mt-4">
                  <div className="text-xl font-bold">$0 <span className="text-sm font-normal text-muted-foreground">/mes</span></div>
                </div>
                <Button asChild className="w-full mt-4" variant="outline" onClick={() => trackEvent('landing_page_cta_click', { cta_location: 'pricing_free' })}>
                  <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                    {isAuthenticated ? "Ir a evaluación" : "Comenzar gratis"}
                  </Link>
                </Button>
              </CardContent>
            </Card>

            {/* Plan Premium */}
            <Card className="border-primary flex flex-col h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-primary" />
                    <CardTitle className="text-xl">Premium</CardTitle>
                  </div>
                  <Badge variant="secondary">+35 usuarios</Badge>
                </div>
                <p className="text-muted-foreground text-sm">Para crecer con mentoría</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  {premiumBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-muted/50 p-3 rounded-lg text-center mt-4">
                  <div className="text-xl font-bold text-primary">
                    {pricingLoading ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      <>{premium.formatted} <span className="text-sm font-normal text-muted-foreground">/mes</span></>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <LemonSqueezyCheckout 
                    plan="premium"
                    onCheckoutStart={() => trackEvent('landing_page_cta_click', { cta_location: 'pricing_premium' })} 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Plan RePremium */}
            <Card className="border-amber-500/50 flex flex-col h-full bg-gradient-to-b from-amber-500/5 to-transparent">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    <CardTitle className="text-xl">RePremium</CardTitle>
                  </div>
                  <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20">Nuevo</Badge>
                </div>
                <p className="text-muted-foreground text-sm">Mentoría + Cursos completos</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="space-y-3 flex-1">
                  {repremiumBenefits.map((benefit, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{benefit}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-amber-500/10 p-3 rounded-lg text-center mt-4">
                  <div className="text-xl font-bold text-amber-600">
                    {pricingLoading ? (
                      <span className="inline-block animate-pulse">...</span>
                    ) : (
                      <>{repremium.formatted} <span className="text-sm font-normal text-muted-foreground">/mes</span></>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <LemonSqueezyCheckout 
                    plan="repremium"
                    onCheckoutStart={() => trackEvent('landing_page_cta_click', { cta_location: 'pricing_repremium' })} 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ver más detalles */}
          <div className="flex justify-center mt-8">
            <Button asChild variant="outline" size="lg">
              <Link to="/planes">
                Ver más detalles
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
        {/* Sticky CTA para mobile */}
        <StickyMobileCTA isAuthenticated={isAuthenticated} />
      </main>
    </>;
};
export default Index;