import { Seo } from "@/components/Seo";
import { 
  StarterPackHero, 
  PathCard, 
  HowItWorksSection, 
  WhatIsProductPrepa,
  StarterPackBreadcrumb 
} from "@/components/starterpack";
import sangucheBuild from "@/assets/sanguche-build.png";
import sangucheLead from "@/assets/sanguche-lead.png";

const StarterPackHome = () => {
  return (
    <>
      <Seo 
        title="Starter Pack para Product Managers | ProductPrepa" 
        description="Recursos curados y guía paso a paso para quienes comienzan en Product Management o dan el salto a liderar equipos de producto." 
        canonical="/starterpack" 
      />
      <main className="min-h-screen bg-background">
        <div className="container py-6 px-4 sm:px-6">
          <StarterPackBreadcrumb
            items={[
              { label: "Inicio", href: "/" },
              { label: "Starter Pack" },
            ]}
          />
        </div>

        <StarterPackHero 
          chip="Starter Pack" 
          title="Tu guía para comenzar en Producto" 
          subtitle="Recursos curados y un camino claro según tu objetivo: construir productos o liderar equipos." 
        />

        {/* Path Selection */}
        <section className="container sm:py-10 px-4 sm:px-6 py-[25px]">
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
                "Herramientas esenciales del día a día"
              ]} 
              ctaText="Empezar camino Build" 
              ctaHref="/starterpack/build" 
              imageSrc={sangucheBuild} 
            />

            <PathCard 
              variant="lead" 
              title="Quiero liderar equipos" 
              description="Para PMs que buscan dar el salto a roles de liderazgo como Lead PM, GPM o Head." 
              bullets={[
                "Habilidades de gestión de personas", 
                "Estrategia de producto avanzada", 
                "Frameworks para escalar equipos"
              ]} 
              ctaText="Empezar camino Lead" 
              ctaHref="/starterpack/lead" 
              imageSrc={sangucheLead} 
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
