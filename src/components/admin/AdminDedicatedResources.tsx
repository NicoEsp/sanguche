import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, BookOpen } from "lucide-react";
import { useUserDedicatedResources, useDeleteDedicatedResource, DedicatedResource } from "@/hooks/useUserDedicatedResources";
import { CreateDedicatedResourceDialog } from "./CreateDedicatedResourceDialog";
import { EditDedicatedResourceDialog } from "./EditDedicatedResourceDialog";
import { DedicatedResourceCard } from "./DedicatedResourceCard";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface AdminDedicatedResourcesProps {
  userId: string;
}

export function AdminDedicatedResources({ userId }: AdminDedicatedResourcesProps) {
  const { resources, loading, refetch } = useUserDedicatedResources(userId);
  const deleteResource = useDeleteDedicatedResource();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedResource, setSelectedResource] = useState<DedicatedResource | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<string | null>(null);

  const handleEdit = (resource: DedicatedResource) => {
    setSelectedResource(resource);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (id: string) => {
    setResourceToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (resourceToDelete) {
      await deleteResource.mutateAsync(resourceToDelete);
      setShowDeleteDialog(false);
      setResourceToDelete(null);
      refetch();
    }
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setShowEditDialog(false);
    setSelectedResource(null);
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">Cargando recursos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Recursos Dedicados</h3>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Agregar Recurso
        </Button>
      </div>

      {resources.length === 0 ? (
        <div className="border-2 border-dashed rounded-lg p-8 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            No hay recursos dedicados asignados a este usuario
          </p>
          <Button onClick={() => setShowCreateDialog(true)} variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Agregar primer recurso
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {resources.map((resource) => (
            <DedicatedResourceCard
              key={resource.id}
              resource={resource}
              onEdit={handleEdit}
              onDelete={handleDeleteClick}
            />
          ))}
        </div>
      )}

      <CreateDedicatedResourceDialog
        open={showCreateDialog}
        onOpenChange={(open) => {
          setShowCreateDialog(open);
          if (!open) handleDialogClose();
        }}
        userId={userId}
      />

      {selectedResource && (
        <EditDedicatedResourceDialog
          open={showEditDialog}
          onOpenChange={(open) => {
            setShowEditDialog(open);
            if (!open) handleDialogClose();
          }}
          resource={selectedResource}
        />
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El recurso será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
