import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useProgressObjectives } from '@/hooks/useProgressObjectives';
import { useAssignObjective, useUserProgressObjectives } from '@/hooks/useUserProgressObjectives';
import { Loader2, Calendar } from 'lucide-react';
import type { CanvasStage } from '@/types/progress';

const assignSchema = z.object({
  timeframe: z.enum(['now', 'soon', 'later']),
  mentor_notes: z.string().max(1000, 'Las notas no pueden exceder 1000 caracteres').optional(),
  due_date: z.string().optional(),
});

type AssignFormData = z.infer<typeof assignSchema>;

interface AssignObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function AssignObjectiveDialog({ open, onOpenChange, userId }: AssignObjectiveDialogProps) {
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<CanvasStage>('now');
  
  const { data: globalObjectives, isLoading: loadingGlobal } = useProgressObjectives();
  const { data: userObjectives, isLoading: loadingUser } = useUserProgressObjectives(userId);
  const assignObjective = useAssignObjective();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AssignFormData>({
    resolver: zodResolver(assignSchema),
    defaultValues: {
      timeframe: 'now',
      mentor_notes: '',
      due_date: '',
    },
  });

  const selectedObjective = globalObjectives?.find(obj => obj.id === selectedObjectiveId);
  const assignedObjectiveIds = new Set(
    userObjectives?.map(obj => obj.objective_id).filter(Boolean) || []
  );

  const availableObjectives = globalObjectives?.filter(
    obj => !assignedObjectiveIds.has(obj.id)
  ) || [];

  const onSubmit = async (data: AssignFormData) => {
    if (!selectedObjectiveId) return;

    await assignObjective.mutateAsync({
      userId,
      objectiveId: selectedObjectiveId,
      timeframe: data.timeframe,
      mentorNotes: data.mentor_notes,
      dueDate: data.due_date || undefined,
    });

    handleClose();
  };

  const handleClose = () => {
    setSelectedObjectiveId(null);
    reset();
    onOpenChange(false);
  };

  const handleObjectiveSelect = (objectiveId: string, originalTimeframe: CanvasStage) => {
    setSelectedObjectiveId(objectiveId);
    setValue('timeframe', originalTimeframe);
  };

  if (loadingGlobal || loadingUser) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar Objetivo desde Catálogo</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CanvasStage)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="now">🔥 En foco</TabsTrigger>
            <TabsTrigger value="soon">⏭️ Próximo paso</TabsTrigger>
            <TabsTrigger value="later">🎯 Visión</TabsTrigger>
          </TabsList>

          {(['now', 'soon', 'later'] as CanvasStage[]).map((timeframe) => (
            <TabsContent key={timeframe} value={timeframe} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableObjectives
                  .filter(obj => obj.timeframe === timeframe)
                  .map(objective => (
                    <Card
                      key={objective.id}
                      className={`p-4 cursor-pointer transition-all hover:border-primary ${
                        selectedObjectiveId === objective.id
                          ? 'border-primary bg-primary/5'
                          : ''
                      }`}
                      onClick={() => handleObjectiveSelect(objective.id, timeframe)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-semibold text-sm">{objective.title}</h4>
                          <Badge variant="outline" className="text-xs shrink-0">
                            {objective.type}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {objective.summary}
                        </p>
                        {objective.level && (
                          <div className="text-xs text-muted-foreground">
                            Nivel: {objective.level.current} → {objective.level.target}
                          </div>
                        )}
                        <div className="text-xs text-muted-foreground">
                          {objective.steps.length} pasos
                        </div>
                      </div>
                    </Card>
                  ))}
              </div>

              {availableObjectives.filter(obj => obj.timeframe === timeframe).length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No hay objetivos disponibles en esta categoría
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>

        {selectedObjective && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 border-t pt-4">
            <div className="space-y-2">
              <Label>Objetivo seleccionado</Label>
              <div className="text-sm font-medium">{selectedObjective.title}</div>
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
              <Label htmlFor="mentor_notes">Notas del mentor (opcional)</Label>
              <Textarea
                id="mentor_notes"
                {...register('mentor_notes')}
                placeholder="Agrega contexto o instrucciones específicas para este usuario..."
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
              <Button type="submit" disabled={assignObjective.isPending}>
                {assignObjective.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Asignar Objetivo
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
