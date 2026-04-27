import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PaywallCard } from "@/components/PaywallCard";
import { isFeatureAvailable, FEATURES, isMentoriaAdvancedContentAvailable } from "@/utils/features";
import { useSubscription } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useMemo } from "react";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { MentoriaHero } from "@/components/mentoria/MentoriaHero";
import { ProfileAnalysis } from "@/components/mentoria/ProfileAnalysis";
import { DedicatedResources } from "@/components/mentoria/DedicatedResources";
import { UserExercises } from "@/components/mentoria/UserExercises";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { useQueryClient } from "@tanstack/react-query";

export default function Recommendations() {
  const { hasActivePremium, loading: subscriptionLoading } = useSubscription();
  const { toast } = useToast();
  const { result: assessmentResult, loading: assessmentLoading, hasAssessment } = useAssessmentData();
  const { profile, loading: profileLoading } = useUserProfile();
  const { isAdmin } = useAuth();
  const { trackEvent } = useMixpanelTracking();
  const queryClient = useQueryClient();

  // Check for success payment and force subscription refresh
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('success') === 'true') {
      // Wait for webhook to process (2 seconds), then invalidate subscription
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['subscription'] });
        
        trackEvent('checkout_completed', {
          plan: 'premium',
          price: 25000,
          provider: 'lemon_squeezy'
        });
        
        toast({
          title: "¡Suscripción exitosa!",
          description: "Bienvenido a ProductPrepa Premium. Ya tienes acceso a todas las funcionalidades."
        });
        
        window.history.replaceState({}, '', '/mentoria');
      }, 2000);
    }
  }, [toast, trackEvent, queryClient]);
  
  // Memoized access calculations
  const hasAccess = useMemo(
    () => isFeatureAvailable(FEATURES.RECOMMENDATIONS, hasActivePremium),
    [hasActivePremium]
  );

  const hasAdvancedAccess = useMemo(
    () => isMentoriaAdvancedContentAvailable(
      hasActivePremium,
      profile?.mentoria_completed || false,
      isAdmin
    ),
    [hasActivePremium, profile?.mentoria_completed, isAdmin]
  );

  // Personalized greeting
  const firstName = useMemo(
    () => profile?.name?.trim().split(/\s+/)[0],
    [profile?.name]
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Buen día";
    if (hour < 19) return "Buenas tardes";
    return "Buenas noches";
  }, []);

  const heading = firstName
    ? `${greeting}, ${firstName}`
    : "Tu espacio de mentoría";

  const introLine = useMemo(() => {
    if (!profile?.mentoria_completed) {
      return "Vamos a agendar tu primera sesión y empezar a construir tu plan paso a paso.";
    }
    const last = profile?.last_mentoria_date
      ? new Date(profile.last_mentoria_date)
      : null;
    const now = new Date();
    const isNewMonth =
      !last ||
      now.getMonth() !== last.getMonth() ||
      now.getFullYear() !== last.getFullYear();

    if (isNewMonth) {
      return "Tu sesión mensual está disponible. Acá tenés tu plan, tus ejercicios y tus recursos en un solo lugar.";
    }
    return "Plan en marcha. Avanzá con tus ejercicios y consultá tus recursos cuando los necesites.";
  }, [profile?.mentoria_completed, profile?.last_mentoria_date]);

  // Track recommendations page view
  useEffect(() => {
    if (!subscriptionLoading && !assessmentLoading && !profileLoading) {
      trackEvent('recommendations_viewed', {
        has_premium: hasActivePremium,
        has_assessment: hasAssessment,
        mentoria_completed: profile?.mentoria_completed || false
      });
    }
  }, [subscriptionLoading, assessmentLoading, profileLoading, hasActivePremium, hasAssessment, profile, trackEvent]);

  const isFullyLoaded = !subscriptionLoading && !profileLoading && !assessmentLoading;

  // Show loading while subscription status is being determined (hasActivePremium === undefined)
  if (subscriptionLoading || assessmentLoading || profileLoading || hasActivePremium === undefined) {
    return (
      <>
        <Seo />
        <div className="container py-10 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </>
    );
  }

  if (isFullyLoaded && !hasAccess) {
    return (
      <>
        <Seo />
        <div className="container mx-auto p-6 max-w-6xl">
          <PaywallCard
            title="Accede a tu Mentoría Personalizada"
            feature="mentoría personalizada"
          />
        </div>
      </>
    );
  }

  return (
    <>
      <Seo />
      <section className="container py-8 sm:py-12 px-4 sm:px-6 space-y-8 animate-fade-in">
        {/* Personal greeting header */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {heading}
          </h1>
          <p className="text-base text-muted-foreground max-w-2xl">
            {introLine}
          </p>
        </div>

        {/* Schedule card (compact) */}
        <MentoriaHero
          mentoriaCompleted={profile?.mentoria_completed || false}
          lastMentoriaDate={profile?.last_mentoria_date}
        />

        {/* Assessment Required Alert */}
        {!hasAssessment && (
          <Alert className="border-amber-500/50 bg-amber-500/5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-amber-700 dark:text-amber-400">
              Para obtener recomendaciones personalizadas, primero necesitas completar tu{" "}
              <Link to="/autoevaluacion" className="underline font-medium">
                autoevaluación de Producto
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* Profile Analysis */}
        {hasAssessment && assessmentResult && (
          <ProfileAnalysis result={assessmentResult} />
        )}

        {/* Ejercicios prácticos - Solo con mentoría completada */}
        {hasAdvancedAccess && profile?.mentoria_completed && (
          <UserExercises />
        )}

        {/* Recursos dedicados - Información complementaria */}
        {hasAssessment && assessmentResult && hasAdvancedAccess && (
          <DedicatedResources />
        )}

        {/* Navigation */}
        <div className="flex justify-center pt-2">
          <Button asChild variant="outline">
            <Link to="/mejoras">Volver a tu perfil</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
