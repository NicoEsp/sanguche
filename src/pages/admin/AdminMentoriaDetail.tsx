import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, Loader2 } from "lucide-react";
import AdminMentoriaExercises from "./AdminMentoriaExercises";
import { usePremiumUsers } from "@/hooks/usePremiumUsers";

export default function AdminMentoriaDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: premiumUsers, isLoading } = usePremiumUsers();

  const selectedUser = premiumUsers?.find(user => user.id === userId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando usuario...</p>
        </div>
      </div>
    );
  }

  if (!selectedUser) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Usuario no encontrado</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => navigate('/admin/mentoria')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Gestión de Mentorías
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="space-y-6">
        {/* Header con info del usuario */}
        <div className="flex items-start justify-between">
          <div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/mentoria')}
              className="mb-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-3">
              <Crown className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  {selectedUser.name || 'Usuario sin nombre'}
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedUser.user_id}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Badge variant="default">Premium</Badge>
            <Badge variant={selectedUser.mentoria_completed ? 'default' : 'secondary'}>
              {selectedUser.mentoria_completed ? '✓ Completada' : '⏳ Pendiente'}
            </Badge>
          </div>
        </div>

        <p className="text-muted-foreground">
          Usuario premium desde: {new Date(selectedUser.user_subscriptions.created_at).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </p>

        {/* Tabs de contenido */}
        <Tabs defaultValue="ejercicios" className="w-full">
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
            <AdminMentoriaExercises userId={selectedUser.id} />
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
      </div>
    </div>
  );
}
