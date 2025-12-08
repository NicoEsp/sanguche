import { Seo } from "@/components/Seo";
import {
  StarterPackHero,
  PathCard,
  HowItWorksSection,
  WhatIsProductPrepa,
} from "@/components/starterpack";

const StarterPackHome = () => {
  return (
    <>
      <Seo
        title="Starter Pack para Product Managers | ProductPrepa"
        description="Recursos curados y guía paso a paso para quienes comienzan en Product Management o dan el salto a liderar equipos de producto."
        canonical="/starterpack"
      />
      <main className="min-h-screen bg-background">
        <StarterPackHero
          chip="Starter Pack"
          title="Tu guía para comenzar en Producto"
          subtitle="Recursos curados y un camino claro según tu objetivo: construir productos o liderar equipos."
        />

        {/* Path Selection */}
        <section className="container py-6 sm:py-10 px-4 sm:px-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold mb-3">
              ¿Cuál es tu objetivo?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Elige el camino que mejor se adapte a donde quieres llegar
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            <PathCard
              variant="build"
              title="Quiero construir productos"
              description="Para quienes están comenzando su carrera en producto o vienen de otras áreas."
              bullets={[
                "Fundamentos de Product Management",
                "Frameworks para priorización",
                "Herramientas esenciales del día a día",
              ]}
              ctaText="Empezar camino Build"
              ctaHref="/starterpack/build"
            />

            <PathCard
              variant="lead"
              title="Quiero liderar equipos"
              description="Para PMs que buscan dar el salto a roles de liderazgo como Lead PM, GPM o Head."
              bullets={[
                "Habilidades de gestión de personas",
                "Estrategia de producto avanzada",
                "Frameworks para escalar equipos",
              ]}
              ctaText="Empezar camino Lead"
              ctaHref="/starterpack/lead"
            />
          </div>
        </section>

        <HowItWorksSection />
        
        <WhatIsProductPrepa />
      </main>
    </>
  );
};

export default StarterPackHome;
