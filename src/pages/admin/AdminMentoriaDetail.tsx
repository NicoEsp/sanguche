import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Crown, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import AdminMentoriaExercises from "./AdminMentoriaExercises";
import { usePremiumUsers } from "@/hooks/usePremiumUsers";
import { AdminDedicatedResources } from "@/components/admin/AdminDedicatedResources";
import { AdminMentoriaProgress } from "@/components/admin/AdminMentoriaProgress";

export default function AdminMentoriaDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: premiumUsers, isLoading } = usePremiumUsers();
  const [updatingMentoria, setUpdatingMentoria] = useState(false);

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

        <div className="flex items-center gap-4">
          <p className="text-muted-foreground">
            Usuario premium desde: {new Date(selectedUser.user_subscriptions.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
          
          {!selectedUser.mentoria_completed && (
            <Button 
              variant="default"
              size="sm"
              disabled={updatingMentoria}
              onClick={async () => {
                setUpdatingMentoria(true);
                try {
                  const { error } = await supabase.rpc('admin_update_mentoria_status', {
                    p_target_profile_id: selectedUser.id,
                    p_new_status: true
                  });
                  
                  if (error) {
                    toast({
                      title: "Error",
                      description: "No se pudo actualizar el estado de la mentoría",
                      variant: "destructive"
                    });
                  } else {
                    toast({
                      title: "✅ Mentoría completada",
                      description: "El usuario ahora tiene acceso a todo el contenido avanzado"
                    });
                    
                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ queryKey: ['premium-users'] });
                  }
                } finally {
                  setUpdatingMentoria(false);
                }
              }}
              className="flex items-center gap-2"
            >
              {updatingMentoria ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Marcar como Completada
            </Button>
          )}
        </div>

        {/* Tabs de contenido */}
        <Tabs defaultValue="ejercicios" className="w-full">
          <TabsList>
            <TabsTrigger value="ejercicios">🎯 Ejercicios</TabsTrigger>
            <TabsTrigger value="objetivos">📈 Objetivos</TabsTrigger>
            <TabsTrigger value="oportunidades" disabled>
              📊 Áreas de Oportunidad
            </TabsTrigger>
            <TabsTrigger value="recursos">
              📚 Recursos
            </TabsTrigger>
          </TabsList>

          <TabsContent value="ejercicios" className="mt-6">
            <AdminMentoriaExercises userId={selectedUser.id} />
          </TabsContent>

          <TabsContent value="objetivos" className="mt-6">
            <AdminMentoriaProgress userId={selectedUser.id} />
          </TabsContent>

          <TabsContent value="oportunidades">
            <div className="text-center py-12 text-muted-foreground">
              Próximamente: Gestión de áreas de oportunidad
            </div>
          </TabsContent>

          <TabsContent value="recursos" className="mt-6">
            <AdminDedicatedResources userId={selectedUser.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
