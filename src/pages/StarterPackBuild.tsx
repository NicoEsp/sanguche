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

const StarterPackBuild = () => {
  const { resources, stepperResources, gridResources, isLoading } = useStarterPackResources('build');
  const { hasAssessment } = useAssessmentData();

  // Construir los pasos del stepper
  const steps: StepperStep[] = [
    {
      number: 1,
      title: "Conoce tu punto de partida",
      description: "Realiza la autoevaluación para entender tu nivel actual y áreas de mejora.",
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
      title: "Desbloquea tu potencial",
      description: "Accede a mentoría personalizada y recursos avanzados con Premium.",
      isPremiumStep: true,
    },
  ];

  return (
    <>
      <Seo
        title="Construir Productos - Starter Pack | ProductPrepa"
        description="Guía paso a paso con recursos curados para quienes comienzan en Product Management."
        canonical="/starterpack/build"
      />
      <main className="min-h-screen bg-background">
        <div className="container py-6 px-4 sm:px-6">
          <StarterPackBreadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Starter Pack", href: "/starterpack" },
              { label: "Construir Productos" },
            ]}
          />
        </div>

        <StarterPackHero
          chip="Build"
          title="Construye productos que importen"
          subtitle="Sigue este camino paso a paso para dominar los fundamentos de Product Management."
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
          <PathOverview audience="build" resources={stepperResources} />
        )}

        {/* Stepper Section */}
        <section className="container py-12 px-4 sm:px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Tu ruta de aprendizaje</h2>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : (
              <StepperRoute steps={steps} audience="build" />
            )}
          </div>
        </section>

        {/* Additional Resources Grid */}
        {gridResources.length > 0 && (
          <section className="container py-12 px-4 sm:px-6 border-t">
            <div className="max-w-5xl mx-auto">
              <h2 className="text-2xl font-bold mb-4 text-center">Recursos adicionales</h2>
              <p className="text-muted-foreground text-center mb-8 max-w-2xl mx-auto">
                Complementa tu aprendizaje con estos recursos seleccionados
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

        <StarterPackCTA variant="build" />
      </main>
    </>
  );
};

export default StarterPackBuild;
