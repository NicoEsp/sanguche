import { Seo } from "@/components/Seo";
import { DashboardFeatures } from "@/components/DashboardFeatures";
import { useUserProfile } from '@/hooks/useUserProfile';

export default function Home() {
  const { profile, loading } = useUserProfile();

  return (
    <>
      <Seo 
        title="Dashboard - ProductPrepa"
        description="Accede a todas las funcionalidades de ProductPrepa para impulsar tu carrera como Product Person"
      />
      
      <div className="container py-8 sm:py-12 px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {loading ? "Bienvenido" : `Hola ${profile?.name}!`}
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Elige la funcionalidad que necesitas para continuar desarrollando tu carrera como Product Person
          </p>
        </div>

        <DashboardFeatures />
      </div>
    </>
  );
}