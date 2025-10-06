import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Crown, Loader2, Plus } from "lucide-react";
import AdminMentoriaExercises from "./AdminMentoriaExercises";
import { usePremiumUsers } from "@/hooks/usePremiumUsers";
import { useUserProgressObjectives, useDeleteUserObjective } from "@/hooks/useUserProgressObjectives";
import { AssignObjectiveDialog } from "@/components/admin/AssignObjectiveDialog";
import { EditUserObjectiveDialog } from "@/components/admin/EditUserObjectiveDialog";
import { ObjectiveColumn } from "@/components/admin/ObjectiveColumn";
import { AdminDedicatedResources } from "@/components/admin/AdminDedicatedResources";
import type { UserProgressObjective } from "@/hooks/useUserProgressObjectives";

export default function AdminMentoriaDetail() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { data: premiumUsers, isLoading } = usePremiumUsers();
  const { data: userObjectives, isLoading: loadingObjectives } = useUserProgressObjectives(userId);
  const deleteObjective = useDeleteUserObjective();

  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [selectedObjective, setSelectedObjective] = useState<UserProgressObjective | null>(null);
  const [objectiveToDelete, setObjectiveToDelete] = useState<UserProgressObjective | null>(null);

  const selectedUser = premiumUsers?.find(user => user.id === userId);

  const handleEdit = (objective: UserProgressObjective) => {
    setSelectedObjective(objective);
    setShowEditDialog(true);
  };

  const handleDelete = (objective: UserProgressObjective) => {
    setObjectiveToDelete(objective);
  };

  const confirmDelete = async () => {
    if (!objectiveToDelete || !userId) return;
    await deleteObjective.mutateAsync({ id: objectiveToDelete.id, userId });
    setObjectiveToDelete(null);
  };

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
            <TabsTrigger value="recomendaciones">
              💡 Recomendaciones
            </TabsTrigger>
            <TabsTrigger value="recursos">
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

          <TabsContent value="recomendaciones" className="mt-6">
            <div className="space-y-6">
              {/* Header con botón de asignar */}
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold">Objetivos Asignados</h2>
                  <p className="text-muted-foreground">
                    Gestiona los objetivos de progreso del usuario
                  </p>
                </div>
                <Button onClick={() => setShowAssignDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Asignar Objetivo
                </Button>
              </div>

              {/* 3 columnas con objetivos */}
              {loadingObjectives ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <ObjectiveColumn
                    title="🔥 En foco"
                    objectives={userObjectives?.filter(o => o.timeframe === 'now') || []}
                    emptyMessage="Sin objetivos en foco"
                    adminView={true}
                    showActions={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                  
                  <ObjectiveColumn
                    title="⏭️ Próximo paso"
                    objectives={userObjectives?.filter(o => o.timeframe === 'soon') || []}
                    emptyMessage="Sin objetivos próximos"
                    adminView={true}
                    showActions={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                  
                  <ObjectiveColumn
                    title="🎯 Visión"
                    objectives={userObjectives?.filter(o => o.timeframe === 'later') || []}
                    emptyMessage="Sin objetivos de visión"
                    adminView={true}
                    showActions={true}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                </div>
              )}
            </div>

            <AssignObjectiveDialog
              open={showAssignDialog}
              onOpenChange={setShowAssignDialog}
              userId={userId || ''}
            />

            <EditUserObjectiveDialog
              open={showEditDialog}
              onOpenChange={setShowEditDialog}
              objective={selectedObjective}
              userId={userId || ''}
            />

            <AlertDialog open={!!objectiveToDelete} onOpenChange={() => setObjectiveToDelete(null)}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Eliminar objetivo?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción eliminará el objetivo "{objectiveToDelete?.title}" de la lista del usuario.
                    Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmDelete}>
                    Eliminar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </TabsContent>

          <TabsContent value="recursos" className="mt-6">
            <AdminDedicatedResources userId={selectedUser.id} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
