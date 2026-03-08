import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Rocket } from "lucide-react";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { SocialProofStrip } from "@/components/landing/SocialProofStrip";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { WhyProductPrepa } from "@/components/sections/WhyProductPrepa";
import { useAuth } from '@/contexts/AuthContext';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import { useHomeRedirect } from '@/hooks/useHomeRedirect';
import { LoadingScreen } from '@/components/LoadingScreen';
const Index = () => {
  // Hook para redirigir usuarios autenticados según su estado (V3)
  const {
    isRedirecting,
    isFading,
    destination
  } = useHomeRedirect();
  const {
    isAuthenticated
  } = useAuth();
  const {
    trackEvent
  } = useMixpanelTracking();
  // Mostrar skeleton loading específico según página destino
  if (isRedirecting) {
    return <LoadingScreen isFading={isFading} variant="skeleton" destination={destination as '/progreso' | '/mejoras' | '/autoevaluacion' | null} />;
  }
  return <>
      <Seo />
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
            <br />
            <br className="hidden sm:block" />
            <span className="sm:hidden"> </span>
            Accedé a una autoevaluación diseñada por{' '}
            <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">
              NicoProducto
            </a>{' '}
            para identificar tus fortalezas y áreas de mejora.
          </p>
          
          <div className="flex flex-col items-center gap-4">
            <Button asChild size="lg" className="text-lg px-10 py-7 font-semibold shadow-lg" onClick={() => trackEvent('landing_page_cta_click', {
              cta_location: 'hero',
              cta_text: 'Comenzar evaluación gratis'
            })}>
              <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
                Comenzar evaluación gratis
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>

            <Link 
              to="/soy-dev" 
              onClick={() => trackEvent('landing_soy_dev_click', { cta_location: 'hero' })}
              className="inline-flex items-center gap-1 font-mono text-sm bg-slate-900/80 text-slate-300 border border-slate-700 hover:border-slate-400 rounded-md px-4 py-2 transition-colors duration-200"
            >
              <span className="text-green-400 mr-1">&gt;</span>
              <span className="text-sky-400">soyDev</span>
              <span className="text-slate-500">.</span>
              <span className="text-amber-400">queHago</span>
              <span className="text-slate-500">()</span>
              <span className="animate-blink text-slate-400 ml-0.5">▎</span>
            </Link>
          </div>
          
        </section>

        <SocialProofStrip />

        <HowItWorks />
        
        {/* CTA after HowItWorks */}
        <section className="text-center mx-0 my-0 px-[2px] py-[20px]">
          <div className="container mx-auto px-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90" onClick={() => trackEvent('landing_page_cta_click', {
            cta_location: 'after_how_it_works'
          })}>
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

        {/* Upgrade teaser */}
        <section className="container py-12 sm:py-16 px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              Empezá gratis. Crecé a tu ritmo.
            </h2>
            <p className="text-muted-foreground mb-6">
              La autoevaluación es completamente gratuita. Cuando quieras mentoría 1:1, cursos y un career path personalizado, tenemos planes pensados para cada etapa.
            </p>
            <Button asChild variant="outline" size="lg" onClick={() => trackEvent('landing_page_cta_click', {
              cta_location: 'upgrade_teaser'
            })}>
              <Link to="/planes">
                Ver planes
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