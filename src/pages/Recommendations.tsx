import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { PaywallCard } from "@/components/PaywallCard";
import { isFeatureAvailable, FEATURES, isMentoriaContentAvailable, isMentoriaAdvancedContentAvailable } from "@/utils/features";
import { useSubscription } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { MentoriaHero } from "@/components/mentoria/MentoriaHero";
import { ProfileAnalysis } from "@/components/mentoria/ProfileAnalysis";
import { PersonalizedRecommendations } from "@/components/mentoria/PersonalizedRecommendations";
import { DedicatedResources } from "@/components/mentoria/DedicatedResources";
import { LockedRecommendations } from "@/components/mentoria/LockedRecommendations";
import { LockedResources } from "@/components/mentoria/LockedResources";
import { UserExercises } from "@/components/mentoria/UserExercises";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function Recommendations() {
  const { hasActivePremium, loading } = useSubscription();
  const { toast } = useToast();
  const { result: assessmentResult, loading: assessmentLoading, hasAssessment } = useAssessmentData();
  const { profile, loading: profileLoading } = useUserProfile();
  const { isAdmin } = useAuth();

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
  
  // Verificar si el usuario tiene acceso al contenido básico de mentoría
  const hasMentoriaAccess = isMentoriaContentAvailable(
    hasActivePremium, 
    profile?.mentoria_completed || false, 
    isAdmin
  );

  // Verificar si el usuario tiene acceso al contenido avanzado (post-mentoría)
  const hasAdvancedAccess = isMentoriaAdvancedContentAvailable(
    hasActivePremium, 
    profile?.mentoria_completed || false, 
    isAdmin
  );

  if (loading || assessmentLoading || profileLoading) {
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
              <Link to="/autoevaluacion" className="underline font-medium">
                autoevaluación de Product Management
              </Link>
              .
            </AlertDescription>
          </Alert>
        )}

        {/* Personalized Content */}
        {hasAssessment && assessmentResult && (
          <div className="space-y-8">
            {/* Profile Analysis - Always visible for premium users */}
            <ProfileAnalysis result={assessmentResult} />
            
            {/* Mentoria Content - Available for premium users */}
            {hasMentoriaAccess ? (
              <>
                {/* Personalized Recommendations - Always available for premium */}
                <PersonalizedRecommendations 
                  neutralAreas={assessmentResult.neutralAreas} 
                  mentoriaCompleted={profile?.mentoria_completed || false}
                />
                
                {/* Advanced Resources - Only after mentoria */}
                {hasAdvancedAccess ? (
                  <DedicatedResources 
                    neutralAreas={assessmentResult.neutralAreas} 
                    mentoriaCompleted={profile?.mentoria_completed || false}
                  />
                ) : (
                  <>
                    <LockedResources neutralAreas={assessmentResult.neutralAreas} />
                    
                    {/* Advanced Content Alert */}
                    <Alert className="border-primary/50 bg-primary/5">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      <AlertDescription className="text-primary-foreground">
                        <div className="space-y-2">
                          <p><strong>Desbloquea recursos adicionales con tu mentoría 1:1</strong></p>
                          <div className="text-sm">
                            <p>✅ Recomendaciones personalizadas disponibles</p>
                            <p>⏳ Agenda tu mentoría para acceder a:</p>
                            <ul className="ml-4 mt-1 space-y-1">
                              <li>• Recursos curados específicos</li>
                              <li>• Plan de desarrollo avanzado</li>
                              <li>• Material exclusivo post-mentoría</li>
                            </ul>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </>
                )}
              </>
            ) : (
              <div className="space-y-6">
                {/* Locked Recommendations Preview */}
                <LockedRecommendations neutralAreas={assessmentResult.neutralAreas} />
                
                {/* Locked Resources Preview */}
                <LockedResources neutralAreas={assessmentResult.neutralAreas} />
                
                {/* Progress Alert */}
                <Alert className="border-primary/50 bg-primary/5">
                  <AlertTriangle className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-primary-foreground">
                    <div className="space-y-2">
                      <p><strong>¡Obtén acceso completo con Premium!</strong></p>
                      <div className="text-sm">
                        <p>⏳ Suscríbete a Premium para desbloquear:</p>
                        <ul className="ml-4 mt-1 space-y-1">
                          <li>• Recomendaciones personalizadas</li>
                          <li>• Acceso a mentoría 1:1</li>
                          <li>• Recursos curados específicos</li>
                        </ul>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>
        )}

        {/* Ejercicios prácticos - Solo con mentoría completada */}
        {hasAdvancedAccess && profile?.mentoria_completed && (
          <UserExercises />
        )}

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
