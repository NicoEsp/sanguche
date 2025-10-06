import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { UserExercise } from "@/hooks/useUserExercises";
import { useUpdateExercise, useDeleteExercise } from "@/hooks/useUserExercises";
import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Calendar, Link as LinkIcon, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ExerciseDetailDialogProps {
  exercise: UserExercise | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusLabels = {
  assigned: "Asignado",
  in_progress: "En Progreso",
  submitted: "Enviado",
  reviewed: "Revisado"
};

const typeLabels = {
  case_study: "Caso de estudio",
  practical: "Ejercicio práctico",
  theoretical: "Teórico"
};

export function ExerciseDetailDialog({ exercise, open, onOpenChange }: ExerciseDetailDialogProps) {
  const [feedback, setFeedback] = useState(exercise?.admin_feedback || '');
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();

  if (!exercise) return null;

  const handleMarkAsReviewed = async () => {
    await updateExercise.mutateAsync({
      id: exercise.id,
      status: 'reviewed',
      admin_feedback: feedback
    });
    onOpenChange(false);
  };

  const handleDelete = async () => {
    await deleteExercise.mutateAsync(exercise.id);
    setShowDeleteAlert(false);
    onOpenChange(false);
  };

  const canEdit = exercise.status === 'assigned' || exercise.status === 'in_progress';
  const canReview = exercise.status === 'submitted';

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <DialogTitle className="flex-1">{exercise.exercise_title}</DialogTitle>
              <Badge>{statusLabels[exercise.status]}</Badge>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span>{typeLabels[exercise.exercise_type]}</span>
              </div>
              {exercise.due_date && (
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Vence: {format(new Date(exercise.due_date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                </div>
              )}
            </div>

            {exercise.exercise_description && (
              <div className="space-y-2">
                <Label>Descripción</Label>
                <div className="rounded-lg border p-4 bg-muted/30 whitespace-pre-wrap">
                  {exercise.exercise_description}
                </div>
              </div>
            )}

            {exercise.attachment_url && (
              <div className="space-y-2">
                <Label>Material adjunto</Label>
                <a 
                  href={exercise.attachment_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline"
                >
                  <LinkIcon className="h-4 w-4" />
                  Ver material
                </a>
              </div>
            )}

            {(exercise.status === 'submitted' || exercise.status === 'reviewed') && (
              <>
                <div className="border-t pt-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Respuesta del usuario</Label>
                    {exercise.submission_date && (
                      <span className="text-xs text-muted-foreground">
                        Enviado el {format(new Date(exercise.submission_date), "d 'de' MMMM, yyyy", { locale: es })}
                      </span>
                    )}
                  </div>
                  <div className="rounded-lg border p-4 bg-muted/30 whitespace-pre-wrap min-h-[100px]">
                    {exercise.submission_text || "Sin respuesta"}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="feedback">Feedback del admin</Label>
                  <Textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="Agrega tu feedback para el usuario..."
                    rows={6}
                    disabled={exercise.status === 'reviewed'}
                  />
                </div>
              </>
            )}

            <div className="flex justify-between gap-2 pt-4">
              <Button
                variant="destructive"
                onClick={() => setShowDeleteAlert(true)}
                disabled={!canEdit}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Eliminar
              </Button>

              <div className="flex gap-2">
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cerrar
                </Button>
                {canReview && (
                  <Button onClick={handleMarkAsReviewed} disabled={updateExercise.isPending}>
                    {updateExercise.isPending ? "Guardando..." : "Marcar como Revisado"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar ejercicio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El ejercicio será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
