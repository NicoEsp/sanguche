import { Seo } from "@/components/Seo";
import {
  StarterPackHero,
  StarterPackBreadcrumb,
  StepperRoute,
  ResourceGrid,
  StarterPackCTA,
  PathOverview,
} from "@/components/starterpack";
import { useStarterPackResources } from "@/hooks/useStarterPackResources";
import { useAssessmentData } from "@/hooks/useAssessmentData";
import { StepperStep } from "@/types/starterpack";
import { Skeleton } from "@/components/ui/skeleton";

const StarterPackLead = () => {
  const { resources, stepperResources, gridResources, isLoading } = useStarterPackResources('lead');
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
      <Seo
        title="Liderar Equipos - Starter Pack | ProductPrepa"
        description="Guía paso a paso para PMs que buscan dar el salto a roles de liderazgo como Lead PM, GPM o Head of Product."
        canonical="/starterpack/lead"
      />
      <main className="min-h-screen bg-background">
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
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </div>
          </section>
        ) : (
          <PathOverview audience="lead" resources={resources} />
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
              <StepperRoute steps={steps} audience="lead" />
            )}
          </div>
        </section>

        {/* Additional Resources Grid */}
        {gridResources.length > 0 && (
          <section className="container py-12 px-4 sm:px-6 border-t">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-center">Recursos adicionales</h2>
              <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                Profundiza en habilidades clave de liderazgo con estos recursos
              </p>
              {isLoading ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-48 w-full" />
                  ))}
                </div>
              ) : (
                <ResourceGrid resources={gridResources} />
              )}
            </div>
          </section>
        )}

        <StarterPackCTA variant="lead" />
      </main>
    </>
  );
};

export default StarterPackLead;
