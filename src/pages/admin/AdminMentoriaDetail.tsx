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
    <div className="container mx-auto py-4 sm:py-8 px-0 sm:px-4">
      <div className="space-y-4 sm:space-y-6">
        {/* Header con info del usuario */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/mentoria')}
              className="-ml-2"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div className="flex items-center gap-2 sm:gap-3">
              <Crown className="h-5 w-5 text-primary sm:h-6 sm:w-6 shrink-0" />
              <div className="min-w-0">
                <h1 className="text-xl font-bold tracking-tight sm:text-3xl truncate">
                  {selectedUser.name || 'Usuario sin nombre'}
                </h1>
                <p className="text-xs text-muted-foreground mt-0.5 sm:text-sm truncate">
                  {selectedUser.user_id}
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap pl-7 sm:pl-0">
            <Badge variant="default" className="text-xs">Premium</Badge>
            <Badge variant={selectedUser.mentoria_completed ? 'default' : 'secondary'} className="text-xs">
              {selectedUser.mentoria_completed ? '✓ Completada' : '⏳ Pendiente'}
            </Badge>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 pl-7 sm:pl-0">
          <p className="text-xs sm:text-sm text-muted-foreground">
            Premium desde: {new Date(selectedUser.user_subscriptions.created_at).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
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
              className="flex items-center gap-2 text-xs sm:text-sm"
            >
              {updatingMentoria ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Marcar como Completada</span>
              <span className="sm:hidden">Completar</span>
            </Button>
          )}
        </div>

        {/* Tabs de contenido */}
        <Tabs defaultValue="ejercicios" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
            <TabsTrigger value="ejercicios" className="shrink-0 text-xs sm:text-sm">🎯 Ejercicios</TabsTrigger>
            <TabsTrigger value="objetivos" className="shrink-0 text-xs sm:text-sm">📈 Objetivos</TabsTrigger>
            <TabsTrigger value="oportunidades" disabled className="shrink-0 text-xs sm:text-sm">
              📊 Áreas
            </TabsTrigger>
            <TabsTrigger value="recursos" className="shrink-0 text-xs sm:text-sm">
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
