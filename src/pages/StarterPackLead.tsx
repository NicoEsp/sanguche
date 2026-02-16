import { Seo } from "@/components/Seo";
import {
  StarterPackHero,
  StarterPackBreadcrumb,
  StepperRoute,
  StarterPackCTA,
  PathOverview,
} from "@/components/starterpack";
import { useStarterPackResources } from "@/hooks/useStarterPackResources";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { StepperStep } from "@/types/starterpack";
import { Skeleton } from "@/components/ui/skeleton";

const StarterPackLead = () => {
  const { stepperResources, isLoading } = useStarterPackResources('lead');
  const { hasAssessment } = useAssessmentData();

  // Construir los pasos del stepper
  const steps: StepperStep[] = [
    {
      number: 1,
      title: "Evalúa tu perfil de liderazgo",
      description: "Realiza la autoevaluación para identificar tus fortalezas y áreas de crecimiento como líder.",
      isAssessmentStep: true,
    },
    ...stepperResources.map((resource, index) => ({
      number: index + 2,
      title: resource.title,
      description: resource.description || "",
      resource,
    })),
    {
      number: stepperResources.length + 2,
      title: "Acelera tu crecimiento",
      description: "Accede a mentoría 1:1 y recursos exclusivos de liderazgo con Premium.",
      isPremiumStep: true,
    },
  ];

  return (
    <>
      <Seo />
      <main className="min-h-screen bg-background animate-fade-in">
        <div className="container py-6 px-4 sm:px-6">
          <StarterPackBreadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Starter Pack", href: "/starterpack" },
              { label: "Liderar Equipos" },
            ]}
          />
        </div>

        <StarterPackHero
          chip="Lead"
          title="Lidera equipos de producto excepcionales"
          subtitle="Desarrolla las habilidades necesarias para dar el salto de IC a líder de producto."
        />

        {/* Path Overview - recursos incluidos */}
        {isLoading ? (
          <section className="container py-8 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <Skeleton className="h-6 w-48 mx-auto mb-6" />
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <PathOverview audience="lead" resources={stepperResources} />
        )}

        {/* Stepper Section */}
        <section className="container py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Tu ruta hacia el liderazgo</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <>
                <StepperRoute steps={steps} audience="lead" showComingSoon={stepperResources.length === 0} />
              </>
            )}
          </div>
        </section>

        <StarterPackCTA variant="lead" />
      </main>
    </>
  );
};

export default StarterPackLead;
