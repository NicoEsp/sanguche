import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, X, ArrowRight, AlertTriangle, Search } from "lucide-react";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Seo } from "@/components/Seo";
import { LemonSqueezyCheckout, PlanType } from "@/components/LemonSqueezyCheckout";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useEffect, useMemo, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { usePricing } from "@/hooks/usePricing";
import { CourseInquiryCta } from "@/components/planes/CourseInquiryCta";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { ProductReviewModal } from "@/components/planes/ProductReviewModal";
import { SocialProofBlock } from "@/components/planes/SocialProofBlock";
interface PlanCardProps {
  name: React.ReactNode;
  price: string;
  priceLabel: string;
  description: string;
  features: (string | React.ReactNode)[];
  plan?: PlanType;
  isHighlighted?: boolean;
  badge?: string;
  icon: React.ReactNode;
  ctaText?: string;
  ctaLink?: string;
  isCurrentPlan?: boolean;
  onHover?: () => void;
  enrichedCtaText?: string;
  enrichedSubtext?: string;
}
function PlanCard({
  name,
  price,
  priceLabel,
  description,
  features,
  plan,
  isHighlighted = false,
  badge,
  icon,
  ctaText,
  ctaLink,
  isCurrentPlan = false,
  onHover,
  enrichedCtaText,
  enrichedSubtext
}: PlanCardProps) {
  return <Card className={`relative flex flex-col h-full ${isHighlighted ? 'border-primary bg-primary/5' : ''}`} onMouseEnter={onHover}>
      {badge && <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge variant={badge === "Nuevo" ? "nuevo" : "default"} className="px-3 py-1 shadow-sm">
            {badge}
          </Badge>
        </div>}
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {icon}
          <CardTitle className="text-xl min-h-[56px] flex items-center justify-center text-center">
            {name}
          </CardTitle>
        </div>
        <CardDescription className="min-h-[48px]">{description}</CardDescription>
        <div className="mt-3">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-sm text-muted-foreground ml-1">{priceLabel}</span>
          <p className="text-xs text-muted-foreground mt-0.5">Pesos Argentinos</p>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ul className="space-y-2 flex-1 min-h-[160px]">
          {features.map((feature, index) => <li key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>)}
        </ul>
        <div className="mt-6">
          {isCurrentPlan ? <Button variant="secondary" className="w-full" disabled>
              Plan actual
            </Button> : ctaLink ? <Button asChild className="w-full" variant={isHighlighted ? "default" : "outline"}>
              <Link to={ctaLink}>{ctaText}</Link>
            </Button> : plan ? <>
              <LemonSqueezyCheckout plan={plan} buttonText={enrichedCtaText || ctaText} />
              {enrichedSubtext && (
                <p className="text-xs text-muted-foreground text-center mt-2 leading-relaxed">
                  {enrichedSubtext}
                </p>
              )}
            </> : null}
        </div>
      </CardContent>
    </Card>;
}
const GAP_CONTEXT_MAP: Record<string, { area: string; context: string }> = {
  estrategia: { area: "Estrategia de Producto", context: "el plan Premium incluye mentoría específica en eso" },
  roadmap: { area: "Roadmap", context: "trabajamos juntos tu roadmap con objetivos claros" },
  ejecucion: { area: "Ejecución", context: "en el plan Premium definimos procesos de ejecución concretos" },
  discovery: { area: "Discovery", context: "te ayudamos a construir el proceso de discovery desde cero" },
  analitica: { area: "Analítica", context: "el plan Premium incluye guías y mentoría en analítica de producto" },
  ux: { area: "UX", context: "trabajamos tu mirada de UX con recursos y mentoría dedicada" },
  stakeholders: { area: "Stakeholders", context: "en el plan Premium practicamos gestión de stakeholders" },
  comunicacion: { area: "Comunicación", context: "el plan Premium incluye frameworks de comunicación para PMs" },
  tecnico: { area: "Técnica", context: "trabajamos tu perfil técnico con recursos específicos" },
  monetizacion: { area: "Monetización", context: "el plan Premium cubre estrategias de monetización de producto" },
  liderazgo: { area: "Liderazgo", context: "en el plan Premium trabajamos tu liderazgo de producto" },
};

export default function Planes() {
  const {
    user,
    isAuthenticated
  } = useAuth();
  const {
    profile
  } = useUserProfile();
  const {
    hasActivePremium,
    hasActiveRePremium,
    hasCursoEstrategia,
    hasCursosAll
  } = useSubscription();
  const {
    trackEvent
  } = useMixpanelTracking();
  const {
    toast
  } = useToast();
  const queryClient = useQueryClient();
  const {
    premium,
    repremium,
    curso_estrategia,
    cursos_all,
    loading: pricingLoading
  } = usePricing();

  // Assessment personalization
  const { result: assessmentResult, hasAssessment } = useAssessmentData();
  const topGaps = useMemo(() => {
    if (!assessmentResult?.gaps) return [];
    return assessmentResult.gaps.
    filter((g) => g.prioridad === 'Alta').
    slice(0, 2);
  }, [assessmentResult]);

  const enrichedPremiumCta = useMemo(() => {
    if (!hasAssessment || !assessmentResult?.gaps?.length) return null;
    const topGap = assessmentResult.gaps.find((g) => g.prioridad === 'Alta') || assessmentResult.gaps[0];
    const mapping = GAP_CONTEXT_MAP[topGap.key];
    if (!mapping) return null;
    return {
      ctaText: "Empezar con Premium — ideal para tu perfil",
      subtext: `Tu assessment muestra oportunidad en ${mapping.area} — ${mapping.context}.`,
    };
  }, [hasAssessment, assessmentResult]);

  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const personalizationTracked = useRef(false);
  const maxScrollDepth = useRef(0);
  const lastHoveredPlan = useRef<string | null>(null);
  const pageLoadTime = useRef(Date.now());

  // Track page view — immediate, no async dependency
  useEffect(() => {
    trackEvent('planes_page_viewed', {
      is_authenticated: isAuthenticated
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track enriched data once pricing finishes loading
  useEffect(() => {
    if (pricingLoading || !isAuthenticated) return;
    trackEvent('planes_page_enriched', {
      has_premium: hasActivePremium,
      has_repremium: hasActiveRePremium,
      has_curso_estrategia: hasCursoEstrategia,
      has_cursos_all: hasCursosAll
    });
  }, [pricingLoading, isAuthenticated, hasActivePremium, hasActiveRePremium, hasCursoEstrategia, hasCursosAll, trackEvent]);

  // Track personalization shown
  useEffect(() => {
    if (personalizationTracked.current) return;
    if (topGaps.length > 0) {
      personalizationTracked.current = true;
      trackEvent('planes_personalization_shown', {
        gaps_shown: topGaps.map((g) => g.label),
        gap_count: topGaps.length
      });
    }
  }, [topGaps, trackEvent]);

  // Track scroll depth
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const docHeight = document.documentElement.scrollHeight;
      const windowHeight = window.innerHeight;
      const scrollable = docHeight - windowHeight;
      if (scrollable <= 0) return;
      const pct = Math.round((scrollTop / scrollable) * 100);
      if (pct > maxScrollDepth.current) {
        maxScrollDepth.current = Math.min(pct, 100);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Keep a stable ref for hasAssessment so the beforeunload effect
  // doesn't tear down / reset pageLoadTime when assessment data arrives
  const hasAssessmentRef = useRef(hasAssessment);
  useEffect(() => {
    hasAssessmentRef.current = hasAssessment;
  }, [hasAssessment]);

  // Track page abandonment
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasActivePremium && !hasActiveRePremium) {
        trackEvent('planes_page_abandoned', {
          time_on_page: Date.now() - pageLoadTime.current,
          time_on_page_seconds: Math.round((Date.now() - pageLoadTime.current) / 1000),
          scroll_depth_pct: maxScrollDepth.current,
          plan_last_hovered: lastHoveredPlan.current,
          is_enriched: hasAssessmentRef.current,
          is_authenticated: !!user
        });
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user, hasActivePremium, hasActiveRePremium, trackEvent]);

  // Check for success payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') !== 'true') return;
    const checkoutIntentId = urlParams.get('intent');
    const checkoutEmail = urlParams.get('email');
    const isAnonymous = urlParams.get('anonymous') === 'true';
    trackEvent('checkout_redirect_received', {
      intent_id: checkoutIntentId,
      email: checkoutEmail,
      is_anonymous: isAnonymous
    });
    let attempts = 0;
    const maxAttempts = 3;
    const checkSubscription = async () => {
      attempts++;
      await queryClient.invalidateQueries({
        queryKey: ['subscription']
      });
      await new Promise((resolve) => setTimeout(resolve, 500));
      const currentSubscription: any = queryClient.getQueryData(['subscription', user?.id]);
      if (currentSubscription?.status === 'active') {
        trackEvent('checkout_completed', {
          plan: currentSubscription.plan,
          provider: 'lemon_squeezy',
          attempts
        });
        toast({
          title: "¡Compra exitosa!",
          description: "Ya tienes acceso a tu nuevo plan."
        });
        window.history.replaceState({}, '', '/planes');
        return true;
      }
      if (attempts < maxAttempts) {
        setTimeout(checkSubscription, 2000);
        return false;
      }
      trackEvent('checkout_activation_failed', {
        provider: 'lemon_squeezy',
        attempts
      });
      toast({
        variant: "destructive",
        title: "Problema con la activación",
        description: "Tu pago fue procesado pero hay un retraso. Por favor contacta a soporte si no se activa en unos minutos.",
        duration: 10000
      });
      window.history.replaceState({}, '', '/planes');
      return false;
    };
    setTimeout(checkSubscription, 2000);
  }, [user?.id, toast, trackEvent, queryClient]);
  const isFreePlan = !hasActivePremium && !hasActiveRePremium && !hasCursoEstrategia && !hasCursosAll;

  // FAQs data for Planes
  const planesFaqs = [{
    question: "¿Puedo cancelar mi suscripción cuando quiera?",
    answer: "Sí, todos los planes de suscripción se pueden cancelar en cualquier momento desde tu perfil. No hay compromisos de permanencia."
  }, {
    question: "¿Qué incluye la mentoría 1:1?",
    answer: "Cada mes tendrás una sesión de 45 minutos con NicoProducto donde revisamos tu progreso, definimos objetivos concretos y trabajamos en tus áreas de mejora específicas."
  }, {
    question: "¿Qué diferencia hay entre Premium y RePremium?",
    answer: "RePremium incluye todo lo de Premium más 2 sesiones mensuales en lugar de 1, acceso completo a todos los cursos, feedback personalizado en ejercicios y un canal directo de comunicación."
  }, {
    question: "¿Cómo funciona el pago único de los cursos?",
    answer: "Al comprar un curso con pago único, tienes acceso de por vida al contenido. No hay suscripción ni renovaciones automáticas."
  }, {
    question: "¿Puedo probar antes de pagar?",
    answer: "Sí, el Plan Gratuito incluye la autoevaluación completa y acceso a recursos introductorios. Así puedes conocer la plataforma antes de suscribirte."
  }];
  const planesSchema = [
  // WebPage Schema with Offers
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "Planes y Precios | ProductPrepa",
    "description": "Elige el plan que mejor se adapte a tu momento. Desde autoevaluación gratuita hasta mentoría personalizada.",
    "offers": [{
      "@type": "Offer",
      "name": "Plan Premium",
      "price": pricingLoading ? 0 : premium.amount / 100,
      "priceCurrency": "ARS",
      "availability": "https://schema.org/InStock",
      "itemOffered": {
        "@type": "Service",
        "name": "Mentoría Premium ProductPrepa",
        "description": "Sesión mensual 1:1, Career Path personalizado, recursos curados"
      }
    }, {
      "@type": "Offer",
      "name": "Plan RePremium",
      "price": pricingLoading ? 0 : repremium.amount / 100,
      "priceCurrency": "ARS",
      "availability": "https://schema.org/InStock",
      "itemOffered": {
        "@type": "Service",
        "name": "Mentoría RePremium ProductPrepa",
        "description": "Todo Premium + 2 sesiones mensuales + acceso a todos los cursos"
      }
    }]
  },
  // FAQPage Schema
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": planesFaqs.map((faq) => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  },
  // BreadcrumbList Schema
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Inicio",
      "item": "https://productprepa.com"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Planes y Precios",
      "item": "https://productprepa.com/planes"
    }]

  }];
  return <>
      <Seo jsonLd={planesSchema} />

      {/* Personalization banner */}
      {hasAssessment && topGaps.length > 0 && !hasActivePremium && !hasActiveRePremium &&
    <div className="max-w-4xl mx-auto px-4 pt-8">
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-foreground mb-1">
                  Tu evaluación detectó áreas críticas a mejorar
                </p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {topGaps.map((gap) =>
              <Badge key={gap.label} variant="outline" className="border-primary/50 text-primary">
                      {gap.label}
                    </Badge>
              )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Con un plan Premium, trabajás estas áreas con mentoría 1:1 y recursos personalizados para tu perfil.
                </p>
              </div>
            </div>
          </div>
        </div>
    }
      
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="pt-12 pb-6 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">
              Elegí el plan que mejor se adapte a tu momento
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Desde autoevaluación gratuita hasta mentoría personalizada y cursos especializados.
            </p>
          </div>
        </section>

        {/* Subscription Plans */}
        <section className="px-4 py-8">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Planes de suscripción</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Free Plan */}
              <PlanCard name="Plan Gratuito" price="$0" priceLabel="/mes" description="Ideal para dar el primer paso" icon={<span className="text-2xl">🥪</span>} features={["Autoevaluación completa de habilidades PM", "Identificación de áreas de mejora", "Recursos introductorios", "PDFs y guías gratuitas"]} ctaText={user ? "Ir a evaluación" : "Comenzar gratis"} ctaLink={user ? "/autoevaluacion" : "/auth"} isCurrentPlan={isFreePlan} onHover={() => { lastHoveredPlan.current = 'gratuito'; }} />

              {/* Premium Plan */}
              <PlanCard name="Plan Premium" price={pricingLoading ? "..." : premium.formatted} priceLabel="/mes" description="Pensado para quienes quieren crecer en serio" icon={<Star className="w-6 h-6 text-primary" />} isHighlighted={true} <PlanCard name="Plan Premium" price={pricingLoading ? "..." : premium.formatted} priceLabel="/mes" description="Pensado para quienes quieren crecer en serio" icon={<Star className="w-6 h-6 text-primary" />} isHighlighted={true} badge="+17 usuarios activos" features={["Todo lo incluido en el plan gratuito", <>Sesión mensual 1:1 con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></>, "Tu Career Path con objetivos concretos", "Recursos curados según tus áreas de mejora",  "Nuevos contenidos cada mes"]} plan="premium" ctaText={hasActivePremium ? "Ir a tu mentoría" : "Suscribirse a Premium"} ctaLink={hasActivePremium ? "/mentoria" : undefined} isCurrentPlan={hasActivePremium && !hasActiveRePremium} onHover={() => { lastHoveredPlan.current = 'premium'; }} enrichedCtaText={!hasActivePremium ? enrichedPremiumCta?.ctaText : undefined} enrichedSubtext={!hasActivePremium ? enrichedPremiumCta?.subtext : undefined} /> features={["Todo lo incluido en el plan gratuito", <>Sesión mensual 1:1 con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></>, "Tu Career Path con objetivos concretos", "Recursos curados según tus áreas de mejora",  "Nuevos contenidos cada mes"]} plan="premium" ctaText={hasActivePremium ? "Ir a tu mentoría" : "Suscribirse a Premium"} ctaLink={hasActivePremium ? "/mentoria" : undefined} isCurrentPlan={hasActivePremium && !hasActiveRePremium} onHover={() => { lastHoveredPlan.current = 'premium'; }} enrichedCtaText={!hasActivePremium ? enrichedPremiumCta?.ctaText : undefined} enrichedSubtext={!hasActivePremium ? enrichedPremiumCta?.subtext : undefined} />

              {/* RePremium Plan */}
              <PlanCard name="Plan RePremium" price={pricingLoading ? "..." : repremium.formatted} priceLabel="/mes" description="Para quienes buscan el máximo acompañamiento" icon={<Crown className="w-6 h-6 text-amber-500" />} <PlanCard name="Plan RePremium" price={pricingLoading ? "..." : repremium.formatted} priceLabel="/mes" description="Para quienes buscan el máximo acompañamiento" icon={<Crown className="w-6 h-6 text-amber-500" />} badge="+5 usuarios activos" features={["Todo lo incluido en Premium", <>2 sesiones mensuales 1:1 con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></>, <><strong>Acceso completo a Cursos</strong></>, "Feedback personalizado en ejercicios", "Acceso prioritario a nuevos contenidos", "Canal directo de comunicación"]} plan="repremium" ctaText={hasActiveRePremium ? "Ir a tu mentoría" : "Suscribirse a RePremium"} ctaLink={hasActiveRePremium ? "/mentoria" : undefined} isCurrentPlan={hasActiveRePremium} onHover={() => { lastHoveredPlan.current = 'repremium'; }} /> features={["Todo lo incluido en Premium", <>2 sesiones mensuales 1:1 con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></>, <><strong>Acceso completo a Cursos</strong></>, "Feedback personalizado en ejercicios", "Acceso prioritario a nuevos contenidos", "Canal directo de comunicación"]} plan="repremium" ctaText={hasActiveRePremium ? "Ir a tu mentoría" : "Suscribirse a RePremium"} ctaLink={hasActiveRePremium ? "/mentoria" : undefined} isCurrentPlan={hasActiveRePremium} onHover={() => { lastHoveredPlan.current = 'repremium'; }} />
            </div>

            {/* Upgrade CTAs for subscription users */}
            {hasActivePremium && !hasActiveRePremium && <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-amber-900 dark:text-amber-100">¿Querés más sesiones y acceso a cursos?</p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">Upgrade a RePremium: 2 sesiones mensuales + todos los cursos</p>
                  </div>
                  <LemonSqueezyCheckout plan="repremium" buttonText="Upgrade a RePremium" variant="default" size="default" className="whitespace-nowrap" />
                </div>
              </div>}
          </div>
        </section>

        {/* Social Proof */}
        <SocialProofBlock />

        {/* Courses Info Block */}
        <section className="px-4 py-10">
          <div className="max-w-4xl mx-auto">
            <Card className="p-6 border-primary/20">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">¿Buscás un buen curso de Producto?</h3>
                <p className="text-muted-foreground mb-2">
                  Además de los planes de suscripción, ProductPrepa tiene cursos especializados con acceso de por vida. Comprá uno individual o el bundle completo.
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  <strong>Tip:</strong> Los usuarios RePremium tienen incluido el acceso a todos los cursos.
                </p>
                <Button asChild>
                  <Link to="/cursos-info">
                    Ver cursos disponibles
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </div>
            </Card>
          </div>
        </section>

        {/* Product Review - One-time payment */}
        <section className="px-4 py-16">
          <div className="max-w-lg mx-auto">
            <h3 className="text-2xl md:text-3xl font-bold text-center mb-2">¿Ya tenés tu propio producto?</h3>
            <p className="text-muted-foreground text-center mb-8 max-w-md mx-auto">Validá tus decisiones con alguien externo y con experiencia</p>
            
            <div className="relative group pt-4">
              {/* Badge - outside card to avoid clipping */}
              <div className="absolute -top-0 left-1/2 transform -translate-x-1/2 z-10">
                <Badge className="px-4 py-1.5 shadow-lg shadow-emerald-900/30 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold tracking-wide border-0 text-xs uppercase">
                  Pago único
                </Badge>
              </div>

              {/* Outer glow */}
              <div className="absolute -inset-1 top-3 bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-600/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60 group-hover:opacity-100 pointer-events-none" />
              
              <Card className="relative flex flex-col overflow-hidden border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 via-emerald-900/80 to-teal-950/90 text-white shadow-2xl shadow-emerald-900/20 rounded-2xl">
                {/* Top accent bar */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500 pointer-events-none" />
                
                {/* Subtle background pattern */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

                <CardHeader className="relative z-10 text-center pb-2 pt-8">
                  {/* Icon */}
                  <div className="mx-auto mb-4 w-14 h-14 rounded-xl bg-emerald-500/10 backdrop-blur-sm border border-emerald-500/20 flex items-center justify-center">
                    <Search className="w-7 h-7 text-emerald-300" />
                  </div>
                  
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-white via-emerald-100 to-teal-200 bg-clip-text text-transparent">
                    Productastic Review
                  </CardTitle>
                  
                  <CardDescription className="text-emerald-200/70 mt-2 text-sm leading-relaxed max-w-sm mx-auto shadow-none font-bold">
                    ¿Tomaste decisiones de producto y querés validarlas con alguien externo?<br />
                    Reviso tu research, hipótesis y decisiones hasta acá. No importa como construiste tu producto, analizo tu proceso hasta acá.
                  </CardDescription>

                  <div className="mt-5 flex items-baseline justify-center gap-3">
                    <span className="text-lg text-white/40 line-through decoration-emerald-500/50">USD 100</span>
                    <span className="text-2xl font-bold text-white/90">USD 50</span>
                  </div>
                  <Badge className="mt-2 mx-auto bg-amber-500/20 text-amber-300 border-amber-500/30 text-xs">
                    Precio de lanzamiento
                  </Badge>
                </CardHeader>

                <CardContent className="relative z-10 flex-1 flex flex-col px-8 pb-8">
                  {/* Divider */}
                  <div className="w-full h-px bg-gradient-to-r from-transparent via-emerald-500/30 to-transparent my-4" />
                  
                  <ul className="space-y-3 flex-1">
                    {[
                      { text: "Revisión de tu research y hallazgos clave", highlight: true },
                      { text: "Análisis de hipótesis y decisiones de producto", highlight: true },
                      { text: "Feedback sobre flujos críticos y priorización", highlight: false },
                      { text: "Informe detallado en 72 hs", highlight: false },
                      { text: "Recomendaciones accionables paso a paso", highlight: false },
                    ].map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${feature.highlight ? 'bg-emerald-500/20 ring-1 ring-emerald-500/30' : 'bg-white/5'}`}>
                          <Check className={`w-3 h-3 ${feature.highlight ? 'text-emerald-300' : 'text-emerald-400/60'}`} />
                        </div>
                        <span className={`text-sm ${feature.highlight ? 'text-white font-medium' : 'text-emerald-100/70'}`}>{feature.text}</span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-8">
                    <Button
                      className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-semibold shadow-lg shadow-emerald-900/30 border-0 rounded-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-emerald-500/20 hover:shadow-xl"
                      onClick={() => {
                        trackEvent('product_review_interest_clicked');
                        setReviewModalOpen(true);
                      }}
                    >
                      Quiero saber más
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <ProductReviewModal open={reviewModalOpen} onOpenChange={setReviewModalOpen} />

        {/* Comparison Table */}
        <section className="py-12 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-center mb-8">Comparativa de planes</h2>
            
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-[280px] font-semibold">Características</TableHead>
                    <TableHead className="text-center font-semibold">Gratuito</TableHead>
                    <TableHead className="text-center font-semibold bg-primary/10">Premium</TableHead>
                    <TableHead className="text-center font-semibold">RePremium</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Autoevaluación */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-primary">Sin compromiso · Te respondo en menos de 24 hs</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Autoevaluación completa de habilidades PM</TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Identificación de áreas de mejora</TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  
                  {/* Recursos */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-primary">Recursos</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Recursos introductorios</TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>PDFs y guías gratuitas</TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Recursos curados según tus áreas de mejora</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Acceso prioritario a nuevos contenidos</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  
                  {/* Mentoría */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-primary">Mentoría</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Sesión mensual 1:1 con NicoProducto</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Tu Career Path con objetivos concretos</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Feedback personalizado en ejercicios</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Canal directo de comunicación</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  
                  {/* Cursos */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-primary">Cursos</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Acceso completo a todos los Cursos</TableCell>
                    <TableCell className="text-center"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center bg-primary/5"><X className="w-5 h-5 text-muted-foreground/50 mx-auto" /></TableCell>
                    <TableCell className="text-center"><Check className="w-5 h-5 text-green-600 mx-auto" /></TableCell>
                  </TableRow>
                  
                  {/* Precio */}
                  <TableRow className="bg-muted/30">
                    <TableCell colSpan={4} className="font-semibold text-primary">Precio</TableCell>
                  </TableRow>
                  <TableRow className="font-semibold">
                    <TableCell>Precio mensual</TableCell>
                    <TableCell className="text-center">$0</TableCell>
                    <TableCell className="text-center bg-primary/5">{premium?.formatted || "$ 50.000"}/mes</TableCell>
                    <TableCell className="text-center">{repremium?.formatted || "$ 19.999"}/mes</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell></TableCell>
                    <TableCell className="text-center py-4">
                      {!user ? <Button asChild variant="outline" size="sm">
                          <Link to="/auth">Comenzar gratis</Link>
                        </Button> : <Button variant="outline" size="sm" disabled>
                          Plan actual
                        </Button>}
                    </TableCell>
                    <TableCell className="text-center bg-primary/5 py-4">
                      {hasActivePremium ? <Button variant="secondary" size="sm" disabled>
                          Plan actual
                        </Button> : <LemonSqueezyCheckout plan="premium" buttonText="Elegir Premium" />}
                    </TableCell>
                    <TableCell className="text-center py-4">
                      {hasActiveRePremium ? <Button variant="secondary" size="sm" disabled>
                          Plan actual
                        </Button> : <LemonSqueezyCheckout plan="repremium" buttonText="Elegir RePremium" />}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </div>
        </section>


        {/* FAQ Section */}
        <section className="py-12 px-4 bg-muted/30">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-2">Preguntas frecuentes</h2>
            <p className="text-center text-muted-foreground mb-8">
              Todo lo que necesitás saber sobre nuestros planes
            </p>
            
            <Accordion type="single" collapsible className="w-full">
              {planesFaqs.map((faq, index) => <AccordionItem key={index} value={`item-${index}`}>
                  <AccordionTrigger className="text-left">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>)}
            </Accordion>
          </div>
        </section>

        {/* Help Section */}
        <section className="py-8 px-4 mb-8">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm text-muted-foreground">
              💳 Todos los planes de suscripción se pueden cancelar cuando quieras. Sin compromisos.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              ¿Dudas? Escribinos a{" "}
              <a href="mailto:nicoproducto@hey.com" className="text-primary hover:underline">
                nicoproducto@hey.com
              </a>
            </p>
          </div>
        </section>
      </div>
    </>;
}