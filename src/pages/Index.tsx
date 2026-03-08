import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { ArrowRight } from "lucide-react";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { StickyMobileCTA } from "@/components/landing/StickyMobileCTA";
import { WhyProductPrepa } from "@/components/sections/WhyProductPrepa";
import { useAuth } from '@/contexts/AuthContext';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import { useHomeRedirect } from '@/hooks/useHomeRedirect';
import { LoadingScreen } from '@/components/LoadingScreen';

const Index = () => {
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

  if (isRedirecting) {
    return <LoadingScreen isFading={isFading} variant="skeleton" destination={destination as '/progreso' | '/mejoras' | '/autoevaluacion' | null} />;
  }

  return <>
    <Seo />
    <main className="min-h-screen bg-background">

      {/* Hero — left-aligned, dramatic scale */}
      <section className="container py-20 sm:py-32 px-4 sm:px-6">
        <div className="max-w-3xl">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
            Descubrí tu nivel real como{" "}
            <span className="text-primary">Product Manager</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
            Una autoevaluación gratuita de 5 minutos, diseñada por{" "}
            <a
              href="https://www.linkedin.com/in/nicolas-espindola/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground underline underline-offset-4 hover:text-primary transition-colors"
            >
              NicoProducto
            </a>
            , para identificar tus fortalezas y áreas de mejora.
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Button
              asChild
              size="lg"
              className="text-lg px-10 py-7 font-semibold"
              onClick={() => trackEvent('landing_page_cta_click', {
                cta_location: 'hero',
                cta_text: 'Comenzar evaluación gratis'
              })}
            >
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
        </div>
      </section>

      <HowItWorks />

      <WhyProductPrepa />

      {/* Starter Pack — bold full-width band */}
      <section className="bg-primary text-primary-foreground">
        <div className="container py-14 sm:py-20 px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 max-w-4xl mx-auto">
            <div>
              <h3 className="text-xl sm:text-2xl font-bold mb-1">
                ¿Empezando en Producto?
              </h3>
              <p className="text-primary-foreground/80 max-w-lg">
                Un Starter Pack con recursos concretos y un camino claro para dar tus primeros pasos como PM.
              </p>
            </div>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="shrink-0 font-semibold"
            >
              <Link to="/starterpack">
                Ver Starter Pack
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upgrade teaser */}
      <section className="container py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Empezá gratis. Crecé a tu ritmo.
          </h2>
          <p className="text-muted-foreground mb-8">
            La autoevaluación es completamente gratuita. Cuando quieras mentoría 1:1, cursos y un career path personalizado, tenemos planes pensados para cada etapa.
          </p>
          <Button
            asChild
            variant="outline"
            size="lg"
            onClick={() => trackEvent('landing_page_cta_click', {
              cta_location: 'upgrade_teaser'
            })}
          >
            <Link to="/planes">
              Ver planes
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <StickyMobileCTA isAuthenticated={isAuthenticated} />
    </main>
  </>;
};

export default Index;
