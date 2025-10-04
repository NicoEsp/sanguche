import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, RefreshCw } from "lucide-react";
import { useUserExercises, type UserExercise } from "@/hooks/useUserExercises";
import { ExerciseCard } from "@/components/admin/ExerciseCard";
import { CreateExerciseDialog } from "@/components/admin/CreateExerciseDialog";
import { ExerciseDetailDialog } from "@/components/admin/ExerciseDetailDialog";
import { Skeleton } from "@/components/ui/skeleton";

interface AdminMentoriaExercisesProps {
  userId: string;
}

export default function AdminMentoriaExercises({ userId }: AdminMentoriaExercisesProps) {
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<UserExercise | null>(null);
  const { data: exercises, isLoading, refetch } = useUserExercises(userId);

  const exercisesByStatus = {
    assigned: exercises?.filter(e => e.status === 'assigned') || [],
    in_progress: exercises?.filter(e => e.status === 'in_progress') || [],
    submitted: exercises?.filter(e => e.status === 'submitted') || [],
    reviewed: exercises?.filter(e => e.status === 'reviewed') || []
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Ejercicios del Usuario</h2>
          <p className="text-muted-foreground">
            Gestiona los ejercicios asignados ({exercises?.length || 0} total)
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refrescar
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Crear Ejercicio
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Columna Asignado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-secondary" />
            <h3 className="font-semibold">
              Asignado ({exercisesByStatus.assigned.length})
            </h3>
          </div>
          <div className="space-y-3">
            {exercisesByStatus.assigned.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={setSelectedExercise}
              />
            ))}
            {exercisesByStatus.assigned.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                Sin ejercicios asignados
              </div>
            )}
          </div>
        </div>

        {/* Columna En Progreso */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-primary" />
            <h3 className="font-semibold">
              En Progreso ({exercisesByStatus.in_progress.length})
            </h3>
          </div>
          <div className="space-y-3">
            {exercisesByStatus.in_progress.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={setSelectedExercise}
              />
            ))}
            {exercisesByStatus.in_progress.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                Sin ejercicios en progreso
              </div>
            )}
          </div>
        </div>

        {/* Columna Enviado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-yellow-500" />
            <h3 className="font-semibold">
              Enviado ({exercisesByStatus.submitted.length})
            </h3>
          </div>
          <div className="space-y-3">
            {exercisesByStatus.submitted.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={setSelectedExercise}
              />
            ))}
            {exercisesByStatus.submitted.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                Sin ejercicios enviados
              </div>
            )}
          </div>
        </div>

        {/* Columna Revisado */}
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <h3 className="font-semibold">
              Revisado ({exercisesByStatus.reviewed.length})
            </h3>
          </div>
          <div className="space-y-3">
            {exercisesByStatus.reviewed.map(exercise => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onViewDetails={setSelectedExercise}
              />
            ))}
            {exercisesByStatus.reviewed.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-8 border border-dashed rounded-lg">
                Sin ejercicios revisados
              </div>
            )}
          </div>
        </div>
      </div>

      <CreateExerciseDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        userId={userId}
      />

      <ExerciseDetailDialog
        exercise={selectedExercise}
        open={!!selectedExercise}
        onOpenChange={(open) => !open && setSelectedExercise(null)}
      />
    </div>
  );
}
