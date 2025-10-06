import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useUpdateUserObjective } from '@/hooks/useUserProgressObjectives';
import { Loader2, Calendar } from 'lucide-react';
import type { UserProgressObjective } from '@/hooks/useUserProgressObjectives';

const editSchema = z.object({
  timeframe: z.enum(['now', 'soon', 'later']),
  mentor_notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
  due_date: z.string().optional(),
  status: z.enum(['not-started', 'in-progress', 'completed']),
});

type EditFormData = z.infer<typeof editSchema>;

interface EditUserObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective: UserProgressObjective | null;
  userId: string;
}

export function EditUserObjectiveDialog({
  open,
  onOpenChange,
  objective,
  userId,
}: EditUserObjectiveDialogProps) {
  const updateObjective = useUpdateUserObjective();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditFormData>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (objective) {
      reset({
        timeframe: objective.timeframe as 'now' | 'soon' | 'later',
        mentor_notes: objective.mentor_notes || '',
        due_date: objective.due_date
          ? new Date(objective.due_date).toISOString().split('T')[0]
          : '',
        status: objective.status as 'not-started' | 'in-progress' | 'completed',
      });
    }
  }, [objective, reset]);

  const onSubmit = async (data: EditFormData) => {
    if (!objective) return;

    await updateObjective.mutateAsync({
      id: objective.id,
      userId,
      updates: {
        timeframe: data.timeframe,
        mentor_notes: data.mentor_notes || null,
        due_date: data.due_date || null,
        status: data.status,
      },
    });

    handleClose();
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  if (!objective) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Objetivo</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Objetivo</Label>
            <div className="text-sm font-medium">{objective.title}</div>
            <p className="text-xs text-muted-foreground">{objective.summary}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe">Ubicación en canvas</Label>
            <select
              id="timeframe"
              {...register('timeframe')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="now">🔥 En foco</option>
              <option value="soon">⏭️ Próximo paso</option>
              <option value="later">🎯 Visión</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Estado</Label>
            <select
              id="status"
              {...register('status')}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="not-started">No iniciado</option>
              <option value="in-progress">En progreso</option>
              <option value="completed">Completado</option>
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mentor_notes">Notas del mentor (opcional)</Label>
            <Textarea
              id="mentor_notes"
              {...register('mentor_notes')}
              placeholder="Agrega contexto o instrucciones específicas..."
              rows={3}
              maxLength={1000}
            />
            {errors.mentor_notes && (
              <p className="text-sm text-destructive">{errors.mentor_notes.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="due_date">Fecha límite (opcional)</Label>
            <div className="relative">
              <input
                id="due_date"
                type="date"
                {...register('due_date')}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-10"
              />
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateObjective.isPending}>
              {updateObjective.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Guardar Cambios
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
