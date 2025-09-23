import { Seo } from "@/components/Seo";
import { DashboardFeatures } from "@/components/DashboardFeatures";
import { useUserProfile } from "@/hooks/useUserProfile";

export default function Home() {
  const { profile } = useUserProfile();

  return (
    <>
      <Seo
        title="Dashboard — ProductPrepa"
        description="Tu centro de control para el crecimiento en Product Management."
        canonical="/home"
      />
      <section className="container py-12 px-4 sm:px-6">
        <div className="text-center mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {profile?.name ? `¡Hola, ${profile.name}!` : "¡Bienvenido!"}
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Continúa tu crecimiento profesional accediendo a tus herramientas de desarrollo
          </p>
        </div>

        <DashboardFeatures />
      </section>
    </>
  );
}