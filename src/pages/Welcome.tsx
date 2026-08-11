import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Mail, Loader2, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { Seo } from "@/components/Seo";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { usePricing } from "@/hooks/usePricing";
import { useSubscription } from "@/hooks/useSubscription";
import { useQueryClient } from "@tanstack/react-query";

// Planes que implican un pago efectivo: si después del checkout la suscripción
// sigue fuera de esta lista, la activación no llegó.
const PAID_PLANS = ['premium', 'repremium', 'curso_estrategia', 'cursos_all', 'productprepa_business', 'productastic_review'];

const isPaidSubscription = (sub?: { plan?: string; status?: string; isComped?: boolean } | null) =>
  !!sub && (sub.status === 'active' || sub.isComped === true) && PAID_PLANS.includes(sub.plan ?? '');

// Único reintento de activación: entra después de la invalidación de los 2 s y
// antes del auto-redirect de los 5 s.
const ACTIVATION_RETRY_DELAY_MS = 4000;

export default function Welcome() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const plan = searchParams.get('plan');
  const {
    isAuthenticated,
    user
  } = useAuth();
  const {
    trackEvent
  } = useMixpanelTracking();
  const { pricesByPlan, loading: pricingLoading } = usePricing();
  const {
    hasAnyPaidPlan,
    loading: subscriptionLoading,
    refetch: refetchSubscription
  } = useSubscription();
  const queryClient = useQueryClient();
  const [countdown, setCountdown] = useState(5);
  const checkoutTrackedRef = useRef(false);
  const redirectTrackedRef = useRef(false);
  const welcomeViewTrackedRef = useRef(false);
  const activationFailedTrackedRef = useRef(false);
  const successParam = searchParams.get('success');
  const success = successParam === 'true';
  const intentId = searchParams.get('intent');
  const hasEmail = !!searchParams.get('email');
  const isAnonymous = searchParams.get('anonymous') === 'true';

  // checkout_redirect_received: primer evento del retorno de LemonSqueezy.
  // Del email solo viaja si vino o no, nunca el valor.
  useEffect(() => {
    if (successParam === null || redirectTrackedRef.current) return;
    redirectTrackedRef.current = true;
    trackEvent('checkout_redirect_received', {
      success,
      intent_id: intentId,
      has_email: hasEmail,
      is_anonymous: isAnonymous,
      plan: plan ?? 'unknown',
      provider: 'lemon_squeezy',
      source: 'welcome_page',
    });
  }, [successParam, success, intentId, hasEmail, isAnonymous, plan, trackEvent]);

  // Guardado por ref: el efecto depende de isAuthenticated y se re-evaluaría en
  // cada refresco de token, pero la vista de la página es una sola.
  useEffect(() => {
    if (success && !welcomeViewTrackedRef.current) {
      welcomeViewTrackedRef.current = true;
      trackEvent('welcome_page_viewed', {
        is_anonymous: isAnonymous,
        is_authenticated: isAuthenticated
      });

      // Force refresh subscription data
      setTimeout(() => {
        queryClient.invalidateQueries({
          queryKey: ['subscription']
        });
      }, 2000);
    }
  }, [success, isAnonymous, isAuthenticated, trackEvent, queryClient]);

  // checkout_activation_failed: después de la invalidación (2 s) damos un único
  // reintento y, si la suscripción sigue sin ser de pago, avisamos una sola vez.
  // Sin polling: la ventana de medición la marca el auto-redirect de los 5 s.
  useEffect(() => {
    if (!success || !isAuthenticated) return;
    if (subscriptionLoading || hasAnyPaidPlan) return;
    if (activationFailedTrackedRef.current) return;

    const timer = setTimeout(async () => {
      const { data } = await refetchSubscription();
      if (activationFailedTrackedRef.current || isPaidSubscription(data)) return;
      activationFailedTrackedRef.current = true;
      trackEvent('checkout_activation_failed', {
        plan: plan ?? 'unknown',
        provider: 'lemon_squeezy',
        is_anonymous: isAnonymous,
        source: 'welcome_page',
      });
    }, ACTIVATION_RETRY_DELAY_MS);

    return () => clearTimeout(timer);
  }, [success, isAuthenticated, subscriptionLoading, hasAnyPaidPlan, refetchSubscription, plan, isAnonymous, trackEvent]);

  // checkout_completed: esperar a que usePricing resuelva (precio live de LemonSqueezy)
  // para no loguear el fallback. Se dispara una sola vez vía ref.
  useEffect(() => {
    if (!success || pricingLoading || checkoutTrackedRef.current) return;
    checkoutTrackedRef.current = true;
    trackEvent('checkout_completed', {
      plan: plan ?? 'unknown',
      price: plan ? pricesByPlan[plan] : undefined,
      provider: 'lemon_squeezy',
      is_authenticated: isAuthenticated,
      is_anonymous: isAnonymous,
      source: 'welcome_page',
    });
  }, [success, pricingLoading, plan, pricesByPlan, isAuthenticated, isAnonymous, trackEvent]);

  // Determine redirect destination based on plan
  const getPostPaymentRoute = () => {
    if (plan === 'curso_estrategia' || plan === 'cursos_all') return '/cursos';
    return '/mentoria';
  };
  
  const postPaymentRoute = getPostPaymentRoute();

  // Auto-redirect authenticated users after countdown
  useEffect(() => {
    if (isAuthenticated && success) {
      const timer = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            navigate(postPaymentRoute);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isAuthenticated, success, navigate]);

  // Página de bienvenida genérica (sin parámetro success)
  if (!success) {
    return <>
        <Seo title="Bienvenido a ProductPrepa" description="Acelerá tu crecimiento como Product Builder con mentoría personalizada" keywords="bienvenida productprepa, onboarding PM, inicio mentoría" />
        
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
          <Card className="max-w-2xl w-full">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-3xl">¡Bienvenido a ProductPrepa!</CardTitle>
              <CardDescription className="text-lg">
                Tu plataforma para acelerar tu carrera como Product Builder
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              <div className="space-y-4 text-center">
                <p className="text-muted-foreground">
                  ProductPrepa te ayuda a desarrollar las habilidades clave para destacar en Producto.
                </p>
                
                <div className="space-y-2 text-sm text-muted-foreground text-left">
                  <h4 className="font-semibold text-foreground text-center">¿Qué podés hacer?</h4>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Evaluá tus habilidades actuales</li>
                    <li>Recibí recomendaciones personalizadas</li>
                    <li>Accedé a recursos exclusivos</li>
                    <li>Construí tu Career Path personalizado</li>
                  </ul>
                </div>
              </div>

              <div className="grid gap-3">
                <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                
                <Button onClick={() => navigate('/planes')} variant="outline" size="lg" className="w-full">
                  Ver Planes
                </Button>
              </div>

              <div className="pt-4 border-t">
                <p className="text-xs text-center text-muted-foreground">
                  ¿Necesitás ayuda? Escribinos a{" "}
                  <a href="mailto:nicoproducto@hey.com" className="text-primary hover:underline">
                    nicoproducto@hey.com
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </>;
  }

  // Página de confirmación de pago (con success=true)
  return <>
      <Seo title="Bienvenido a ProductPrepa Premium" description="Tu suscripción ha sido confirmada. Revisá tu email para activar tu cuenta." keywords="bienvenida productprepa, onboarding PM, inicio mentoría" />
      
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-10 h-10 text-primary" />
            </div>
            <CardTitle className="text-3xl">¡Pago exitoso!</CardTitle>
            <CardDescription className="text-lg">
              {isAnonymous ? "Tu suscripción ha sido confirmada" : "Bienvenido a ProductPrepa Premium"}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {isAuthenticated ?
          // Usuario ya autenticado
          <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-2 text-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-primary" />
                  <span>Redirigiendo a tu dashboard en {countdown}...</span>
                </div>
                
                <Button onClick={() => navigate(postPaymentRoute)} size="lg" className="w-full">
                  {plan === 'curso_estrategia' || plan === 'cursos_all' ? 'Ir a mis cursos' : 'Ir ahora a Premium'}
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div> : isAnonymous ?
          // Usuario nuevo - checkout anónimo
          <div className="space-y-4">
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold mb-2">Revisá tu email</h3>
                      <p className="text-sm text-muted-foreground">
                        Te enviamos un email con las instrucciones para activar tu cuenta y establecer tu contraseña.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-muted-foreground">
                  <h4 className="font-semibold text-foreground">Próximos pasos:</h4>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>Revisá tu bandeja de entrada (y spam si no lo encontrás)</li>
                    <li>Hacé clic en el enlace para establecer tu contraseña</li>
                    <li>Iniciá sesión y accedé a todo el contenido Premium</li>
                  </ol>
                </div>

                <div className="pt-4">
                  <Button onClick={() => navigate('/auth')} variant="outline" className="w-full">
                    Ir a iniciar sesión
                  </Button>
                </div>
              </div> :
          // Usuario existente que no está logueado
          <div className="space-y-4">
                <p className="text-center text-muted-foreground">
                  Tu suscripción está activa. Iniciá sesión para acceder a Premium.
                </p>
                
                <Button onClick={() => navigate('/auth')} size="lg" className="w-full">
                  Iniciar sesión
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>}

            <div className="pt-4 border-t">
              <p className="text-xs text-center text-muted-foreground">
                ¿Necesitás ayuda? Escribinos a{" "}
                <a href="mailto:nicoproducto@hey.com" className="text-primary hover:underline">
                  nicoproducto@hey.com
                </a>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </>;
}