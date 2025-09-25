import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PaywallCard } from "@/components/PaywallCard";
import { isFeatureAvailable, FEATURES } from "@/utils/features";
import { useSubscription } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { MentoriaHero } from "@/components/mentoria/MentoriaHero";
import { ProfileAnalysis } from "@/components/mentoria/ProfileAnalysis";
import { PersonalizedRecommendations } from "@/components/mentoria/PersonalizedRecommendations";
import { DedicatedResources } from "@/components/mentoria/DedicatedResources";
import { ComingSoonExercises } from "@/components/mentoria/ComingSoonExercises";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Recommendations() {
  const { hasActivePremium, loading } = useSubscription();
  const { toast } = useToast();
  const { result: assessmentResult, loading: assessmentLoading, hasAssessment } = useAssessmentData();

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

  if (loading || assessmentLoading) {
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
      <section className="container py-10 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Mentoría personalizada</h1>
          <p className="text-lg text-muted-foreground">
            Plan de crecimiento curado específicamente para tu perfil
          </p>
        </div>

        {/* Hero Section - Agendamiento */}
        <MentoriaHero />

        {/* Assessment Required Alert */}
        {!hasAssessment && (
          <Alert className="border-warning/50 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-warning-foreground">
              Para obtener recomendaciones personalizadas, primero necesitas completar tu{" "}
              <Link to="/assessment" className="underline font-medium">
                autoevaluación de Product Management
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* Personalized Content */}
        {hasAssessment && assessmentResult && (
          <div className="space-y-8">
            {/* Profile Analysis */}
            <ProfileAnalysis result={assessmentResult} />
            
            {/* Personalized Recommendations */}
            <PersonalizedRecommendations neutralAreas={assessmentResult.neutralAreas} />
            
            {/* Dedicated Resources */}
            <DedicatedResources neutralAreas={assessmentResult.neutralAreas} />
          </div>
        )}

        {/* Coming Soon Exercises */}
        <ComingSoonExercises />

        {/* Navigation */}
        <div className="flex justify-center">
          <Button asChild variant="outline">
            <Link to="/mejoras">Volver a tu perfil</Link>
          </Button>
        </div>
      </section>
    </>
  );
}
