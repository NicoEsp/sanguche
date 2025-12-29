import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Crown, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { Seo } from "@/components/Seo";
import { LemonSqueezyCheckout, PlanType } from "@/components/LemonSqueezyCheckout";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { usePricing } from "@/hooks/usePricing";

interface PlanCardProps {
  name: string;
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
}: PlanCardProps) {
  return (
    <Card className={`relative flex flex-col h-full ${isHighlighted ? 'border-primary bg-primary/5' : ''}`}>
      {badge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground px-3 py-1">{badge}</Badge>
        </div>
      )}
      <CardHeader className="text-center pb-4">
        <div className="flex items-center justify-center gap-2 mb-2">
          {icon}
          <CardTitle className="text-xl">{name}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
        <div className="mt-3">
          <span className="text-3xl font-bold">{price}</span>
          <span className="text-sm text-muted-foreground ml-1">{priceLabel}</span>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <ul className="space-y-2 flex-1">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
        <div className="mt-6">
          {isCurrentPlan ? (
            <Button variant="secondary" className="w-full" disabled>
              Plan actual
            </Button>
          ) : ctaLink ? (
            <Button asChild className="w-full" variant={isHighlighted ? "default" : "outline"}>
              <Link to={ctaLink}>{ctaText}</Link>
            </Button>
          ) : plan ? (
            <LemonSqueezyCheckout plan={plan} buttonText={ctaText} />
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

export default function Planes() {
  const { user } = useAuth();
  const { 
    hasActivePremium, 
    hasActiveRePremium, 
    hasCursoEstrategia, 
    hasCursosAll,
  } = useSubscription();
  const { trackEvent } = useMixpanelTracking();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { premium, repremium, curso_estrategia, cursos_all, loading: pricingLoading } = usePricing();

  // Track page view
  useEffect(() => {
    trackEvent('planes_page_viewed', {
      has_premium: hasActivePremium,
      has_repremium: hasActiveRePremium,
      has_curso_estrategia: hasCursoEstrategia,
      has_cursos_all: hasCursosAll
    });
  }, [hasActivePremium, hasActiveRePremium, hasCursoEstrategia, hasCursosAll, trackEvent]);

  // Track page abandonment
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (!hasActivePremium && !hasActiveRePremium) {
        trackEvent('planes_page_abandoned', {
          time_on_page: Date.now() - pageLoadTime,
          is_authenticated: !!user
        });
      }
    };

    const pageLoadTime = Date.now();
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
      
      await queryClient.invalidateQueries({ queryKey: ['subscription'] });
      await new Promise(resolve => setTimeout(resolve, 500));
      
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

  return (
    <>
      <Seo 
        title="Planes y Precios | ProductPrepa" 
        description="Elige el plan que mejor se adapte a tu momento. Desde autoevaluación gratuita hasta mentoría personalizada y cursos especializados." 
        canonical="/planes" 
      />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
        {/* Hero Section */}
        <section className="pt-12 pb-8 px-4">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent md:text-4xl">
              Elige el plan que mejor se adapte a tu momento
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4 leading-relaxed">
              Desde autoevaluación gratuita hasta mentoría personalizada y cursos especializados.
            </p>
          </div>
        </section>

        {/* Subscription Plans - Row 1 */}
        <section className="px-4 py-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Planes de Suscripción</h2>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {/* Free Plan */}
              <PlanCard
                name="Plan Gratuito"
                price="$0"
                priceLabel="/mes"
                description="Ideal para dar el primer paso"
                icon={<span className="text-2xl">🥪</span>}
                features={[
                  "Autoevaluación completa de habilidades PM",
                  "Identificación de áreas de mejora",
                  "Recursos introductorios",
                  "PDFs y guías gratuitas"
                ]}
                ctaText={user ? "Ir a evaluación" : "Comenzar gratis"}
                ctaLink={user ? "/autoevaluacion" : "/auth"}
                isCurrentPlan={isFreePlan}
              />

              {/* Premium Plan */}
              <PlanCard
                name="Plan Premium"
                price={pricingLoading ? "..." : premium.formatted}
                priceLabel="/mes"
                description="Pensado para quienes quieren crecer en serio"
                icon={<Star className="w-6 h-6 text-primary" />}
                isHighlighted={true}
                badge="30 usuarios activos"
                features={[
                  "Todo lo incluido en el plan gratuito",
                  <>Guía de carrera personalizada por <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a></>,
                  "Tu Career Path con objetivos concretos",
                  "Recursos curados según tus áreas de mejora",
                  "Roadmap de carrera personalizado",
                  "Nuevos contenidos cada mes"
                ]}
                plan="premium"
                ctaText={hasActivePremium ? "Ir a tu mentoría" : "Suscribirse a Premium"}
                ctaLink={hasActivePremium ? "/mentoria" : undefined}
                isCurrentPlan={hasActivePremium && !hasActiveRePremium}
              />

              {/* RePremium Plan */}
              <PlanCard
                name="Plan RePremium"
                price={pricingLoading ? "..." : repremium.formatted}
                priceLabel="/mes"
                description="Para quienes buscan el máximo acompañamiento"
                icon={<Crown className="w-6 h-6 text-amber-500" />}
                badge="Nuevo"
                features={[
                  "Todo lo incluido en Premium",
                  "Sesión mensual 1:1 con NicoProducto",
                  "Feedback personalizado en ejercicios",
                  "Acceso prioritario a nuevos contenidos",
                  "Canal directo de comunicación"
                ]}
                plan="repremium"
                ctaText={hasActiveRePremium ? "Ir a tu mentoría" : "Suscribirse a RePremium"}
                ctaLink={hasActiveRePremium ? "/mentoria" : undefined}
                isCurrentPlan={hasActiveRePremium}
              />
            </div>
          </div>
        </section>

        {/* Divider */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 border-t border-border" />
            <span className="text-muted-foreground text-sm">O compra acceso a cursos</span>
            <div className="flex-1 border-t border-border" />
          </div>
        </div>

        {/* Courses - Row 2 */}
        <section className="px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Cursos Especializados</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Curso Estrategia */}
              <PlanCard
                name="Estrategia de Producto para principiantes"
                price={pricingLoading ? "..." : curso_estrategia.formatted}
                priceLabel="(pago único)"
                description="Curso para principiantes que quieren dominar la Estrategia de Producto"
                icon={<BookOpen className="w-6 h-6 text-primary" />}
                badge="Nuevo"
                features={[
                  "Fundamentos de estrategia de producto",
                  "Frameworks para empezar",
                  "Ejercicios prácticos",
                  "Acceso de por vida",
                  "Actualizaciones incluidas"
                ]}
                plan="curso_estrategia"
                ctaText={hasCursoEstrategia ? "Acceder al curso" : "Comprar curso"}
                ctaLink={hasCursoEstrategia ? "/mentoria" : undefined}
                isCurrentPlan={hasCursoEstrategia}
              />

              {/* Todos los Cursos */}
              <PlanCard
                name="Todos los Cursos"
                price={pricingLoading ? "..." : cursos_all.formatted}
                priceLabel="(pago único)"
                description="Acceso completo a todos los cursos disponibles"
                icon={<Sparkles className="w-6 h-6 text-amber-500" />}
                badge="Mejor valor"
                features={[
                  "Acceso a todos los cursos actuales",
                  "Cursos futuros incluidos por un único valor",
                  "Certificados de finalización",
                  "Acceso de por vida"
                ]}
                plan="cursos_all"
                ctaText={hasCursosAll ? "Acceder a cursos" : "Comprar bundle"}
                ctaLink={hasCursosAll ? "/mentoria" : undefined}
                isCurrentPlan={hasCursosAll}
              />
            </div>
          </div>
        </section>

        {/* Social Proof */}
        <section className="py-8 px-4">
          <div className="max-w-4xl mx-auto">
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="flex-shrink-0">
                    <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
                      <Star className="w-8 h-8 text-primary" />
                    </div>
                  </div>
                  <div className="text-center md:text-left">
                    <p className="text-lg italic mb-4">&quot;ProductPrepa me ayudó a identificar exactamente en qué trabajar y donde hacer foco. La mentoría mensual con Nico me dió claridad además de ordenar mis próximos pasos.&quot;</p>
                    <p className="font-semibold">— Mariel, Product Manager</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* FAQ/Help Section */}
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
    </>
  );
}
