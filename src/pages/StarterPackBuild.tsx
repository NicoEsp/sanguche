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

const StarterPackBuild = () => {
  const { stepperResources, isLoading } = useStarterPackResources('build');
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

  const buildSchema = [
    {
      "@context": "https://schema.org",
      "@type": "LearningResource",
      "name": "Construir Productos - Starter Pack",
      "description": "Guía paso a paso con recursos curados para quienes comienzan en Product Management.",
      "provider": {
        "@type": "Organization",
        "name": "ProductPrepa",
        "url": "https://productprepa.com"
      },
      "educationalLevel": "Beginner",
      "inLanguage": "es",
      "isAccessibleForFree": true,
      "url": "https://productprepa.com/starterpack/build"
    },
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
          "name": "Starter Pack",
          "item": "https://productprepa.com/starterpack"
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Construir Productos",
          "item": "https://productprepa.com/starterpack/build"
        }
      ]
    }
  ];

  return (
    <>
      <Seo
        title="Construir Productos - Starter Pack | ProductPrepa"
        description="Guía paso a paso con recursos curados para quienes comienzan en Product Management."
        canonical="/starterpack/build"
        keywords="construir productos, PM junior, primeros pasos producto, fundamentos PM"
        jsonLd={buildSchema}
      />
      <main className="min-h-screen bg-background animate-fade-in">
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
              <>
                <StepperRoute steps={steps} audience="build" showComingSoon={stepperResources.length === 0} />
              </>
            )}
          </div>
        </section>

        <StarterPackCTA variant="build" />
      </main>
    </>
  );
};

export default StarterPackBuild;
