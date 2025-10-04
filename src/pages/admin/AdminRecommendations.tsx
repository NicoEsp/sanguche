import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PremiumUserSelector } from "@/components/admin/PremiumUserSelector";
import AdminMentoriaExercises from "./AdminMentoriaExercises";
import { useSearchParams } from "react-router-dom";

export default function AdminRecommendations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedUserId = searchParams.get('userId');

  const handleUserChange = (userId: string) => {
    if (userId) {
      setSearchParams({ userId });
    } else {
      setSearchParams({});
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestión de Mentorías</h1>
          <p className="text-muted-foreground">
            Configura ejercicios, recomendaciones y recursos para tus usuarios Premium
          </p>
        </div>

        <PremiumUserSelector 
          value={selectedUserId} 
          onChange={handleUserChange} 
        />

        {selectedUserId && (
          <Tabs defaultValue="ejercicios">
            <TabsList>
              <TabsTrigger value="ejercicios">🎯 Ejercicios</TabsTrigger>
              <TabsTrigger value="oportunidades" disabled>
                📊 Áreas de Oportunidad
              </TabsTrigger>
              <TabsTrigger value="recomendaciones" disabled>
                💡 Recomendaciones
              </TabsTrigger>
              <TabsTrigger value="recursos" disabled>
                📚 Recursos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ejercicios" className="mt-6">
              <AdminMentoriaExercises userId={selectedUserId} />
            </TabsContent>

            <TabsContent value="oportunidades">
              <div className="text-center py-12 text-muted-foreground">
                Próximamente: Gestión de áreas de oportunidad
              </div>
            </TabsContent>

            <TabsContent value="recomendaciones">
              <div className="text-center py-12 text-muted-foreground">
                Próximamente: Gestión de recomendaciones personalizadas
              </div>
            </TabsContent>

            <TabsContent value="recursos">
              <div className="text-center py-12 text-muted-foreground">
                Próximamente: Gestión de recursos dedicados
              </div>
            </TabsContent>
          </Tabs>
        )}

        {!selectedUserId && (
          <div className="text-center py-12 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">
              Selecciona un usuario premium para comenzar a gestionar su mentoría
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
