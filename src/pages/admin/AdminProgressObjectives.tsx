import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Plus, Flame, FastForward, Target } from 'lucide-react';
import { useProgressObjectives, useProgressObjectivesRealtime, useDeleteProgressObjective, useReorderProgressObjectives, ProgressObjective } from '@/hooks/useProgressObjectives';
import { ProgressObjectiveCard } from '@/components/admin/ProgressObjectiveCard';
import { CreateProgressObjectiveDialog } from '@/components/admin/CreateProgressObjectiveDialog';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Seo } from '@/components/Seo';

export default function AdminProgressObjectives() {
  const { data: objectives = [], isLoading } = useProgressObjectives();
  const deleteMutation = useDeleteProgressObjective();
  const reorderMutation = useReorderProgressObjectives();
  
  // SECURITY: Real-time subscription
  useProgressObjectivesRealtime();

  const [activeTimeframe, setActiveTimeframe] = useState<'now' | 'soon' | 'later'>('now');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<ProgressObjective | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [objectiveToDelete, setObjectiveToDelete] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const filteredObjectives = objectives.filter((obj) => obj.timeframe === activeTimeframe);

  const handleCreate = () => {
    setEditingObjective(null);
    setDialogOpen(true);
  };

  const handleEdit = (objective: ProgressObjective) => {
    setEditingObjective(objective);
    setDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setObjectiveToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (objectiveToDelete) {
      await deleteMutation.mutateAsync(objectiveToDelete);
      setDeleteDialogOpen(false);
      setObjectiveToDelete(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const oldIndex = filteredObjectives.findIndex((obj) => obj.id === active.id);
    const newIndex = filteredObjectives.findIndex((obj) => obj.id === over.id);

    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(filteredObjectives, oldIndex, newIndex);
    const updates = reordered.map((obj, index) => ({
      id: obj.id,
      display_order: index,
    }));

    reorderMutation.mutate(updates);
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/3"></div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  const timeframes = [
    { value: 'now' as const, label: 'En foco', icon: Flame, description: 'Objetivos prioritarios actuales' },
    { value: 'soon' as const, label: 'Próximo paso', icon: FastForward, description: 'Objetivos de corto plazo' },
    { value: 'later' as const, label: 'Visión', icon: Target, description: 'Objetivos de largo plazo' },
  ];

  return (
    <>
      <Seo
        title="Gestión de Objetivos | Admin ProductPrepa"
        description="Panel de administración para gestionar el catálogo global de objetivos de carrera"
        canonical="/admin/objetivos-progreso"
        robots="noindex, nofollow"
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Catálogo de Objetivos</h1>
              <p className="text-muted-foreground mt-1">
                Gestiona los objetivos globales que se pueden asignar a los usuarios
              </p>
            </div>
            <Button onClick={handleCreate}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Objetivo
            </Button>
          </div>

          <Tabs value={activeTimeframe} onValueChange={(v) => setActiveTimeframe(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              {timeframes.map(({ value, label, icon: Icon }) => (
                <TabsTrigger key={value} value={value} className="gap-2">
                  <Icon className="h-4 w-4" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>

            {timeframes.map(({ value, description }) => (
              <TabsContent key={value} value={value} className="space-y-4 mt-6">
                <p className="text-sm text-muted-foreground">{description}</p>

                {filteredObjectives.length === 0 ? (
                  <div className="border-2 border-dashed rounded-lg p-12 text-center">
                    <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No hay objetivos en esta categoría</h3>
                    <p className="text-muted-foreground mb-4">
                      Crea el primer objetivo para esta etapa del roadmap
                    </p>
                    <Button onClick={handleCreate} variant="outline">
                      <Plus className="h-4 w-4 mr-2" />
                      Crear Objetivo
                    </Button>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={filteredObjectives.map((obj) => obj.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredObjectives.map((objective) => (
                          <ProgressObjectiveCard
                            key={objective.id}
                            objective={objective}
                            onEdit={handleEdit}
                            onDelete={handleDeleteClick}
                          />
                        ))}
                      </div>
                    </SortableContext>
                  </DndContext>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>

      <CreateProgressObjectiveDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        objective={editingObjective}
        timeframe={activeTimeframe}
        displayOrder={filteredObjectives.length}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Desactivar objetivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción desactivará el objetivo del catálogo. No se eliminará permanentemente,
              pero dejará de estar disponible para asignación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm}>
              Desactivar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
