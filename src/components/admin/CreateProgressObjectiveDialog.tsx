import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { ProgressObjective, useCreateProgressObjective, useUpdateProgressObjective } from '@/hooks/useProgressObjectives';
import { z } from 'zod';

const objectiveSchema = z.object({
  title: z.string().min(1, 'El título es requerido').max(200, 'Máximo 200 caracteres'),
  summary: z.string().min(1, 'El resumen es requerido').max(500, 'Máximo 500 caracteres'),
  type: z.string().min(1, 'El tipo es requerido'),
  timeframe: z.enum(['now', 'soon', 'later']),
});

interface CreateProgressObjectiveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  objective?: ProgressObjective | null;
  timeframe: 'now' | 'soon' | 'later';
  displayOrder: number;
}

export function CreateProgressObjectiveDialog({
  open,
  onOpenChange,
  objective,
  timeframe,
  displayOrder,
}: CreateProgressObjectiveDialogProps) {
  const createMutation = useCreateProgressObjective();
  const updateMutation = useUpdateProgressObjective();

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    type: '',
    timeframe: timeframe as 'now' | 'soon' | 'later',
    access_level: 'free' as 'free' | 'premium',
    steps: [] as Array<{ id: string; title: string; completed: boolean; description?: string }>,
    level: null as { current: number; target: number; label?: string } | null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (objective) {
      setFormData({
        title: objective.title,
        summary: objective.summary,
        type: objective.type,
        timeframe: objective.timeframe,
        access_level: objective.access_level || 'free',
        steps: objective.steps || [],
        level: objective.level || null,
      });
    } else {
      setFormData({
        title: '',
        summary: '',
        type: '',
        timeframe,
        access_level: 'free',
        steps: [],
        level: null,
      });
    }
    setErrors({});
  }, [objective, timeframe, open]);

  const handleSubmit = async () => {
    try {
      // SECURITY: Validate inputs with Zod
      objectiveSchema.parse(formData);
      setErrors({});

      const payload = {
        ...formData,
        display_order: objective?.display_order ?? displayOrder,
        is_active: true,
      };

      if (objective) {
        await updateMutation.mutateAsync({ id: objective.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }

      onOpenChange(false);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
    }
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        { id: crypto.randomUUID(), title: '', completed: false },
      ],
    });
  };

  const updateStep = (index: number, title: string) => {
    const newSteps = [...formData.steps];
    newSteps[index] = { ...newSteps[index], title };
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{objective ? 'Editar Objetivo' : 'Crear Nuevo Objetivo'}</DialogTitle>
          <DialogDescription>
            {objective ? 'Modifica los detalles del objetivo' : 'Añade un nuevo objetivo al catálogo global'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Dominar frameworks de priorización"
            />
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Resumen *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
              placeholder="Descripción breve del objetivo"
              rows={3}
            />
            {errors.summary && <p className="text-sm text-destructive">{errors.summary}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo *</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Metodologías">Metodologías</SelectItem>
                  <SelectItem value="Habilidades técnicas">Habilidades técnicas</SelectItem>
                  <SelectItem value="Soft skills">Soft skills</SelectItem>
                  <SelectItem value="Liderazgo">Liderazgo</SelectItem>
                  <SelectItem value="Estrategia">Estrategia</SelectItem>
                </SelectContent>
              </Select>
              {errors.type && <p className="text-sm text-destructive">{errors.type}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeframe">Timeframe *</Label>
              <Select value={formData.timeframe} onValueChange={(value: any) => setFormData({ ...formData, timeframe: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="now">🔥 En foco (Now)</SelectItem>
                  <SelectItem value="soon">⏭️ Próximo paso (Soon)</SelectItem>
                  <SelectItem value="later">🎯 Visión (Later)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="access_level">Nivel de Acceso *</Label>
            <Select value={formData.access_level} onValueChange={(value: any) => setFormData({ ...formData, access_level: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">📦 Gratis</SelectItem>
                <SelectItem value="premium">👑 Premium</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Los objetivos premium solo serán visibles para usuarios con suscripción activa
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Pasos</Label>
              <Button type="button" variant="outline" size="sm" onClick={addStep}>
                <Plus className="h-4 w-4 mr-1" />
                Añadir paso
              </Button>
            </div>

            <div className="space-y-2">
              {formData.steps.map((step, index) => (
                <div key={step.id} className="flex gap-2">
                  <Input
                    value={step.title}
                    onChange={(e) => updateStep(index, e.target.value)}
                    placeholder={`Paso ${index + 1}`}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeStep(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Nivel (Opcional)</Label>
            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                placeholder="Actual"
                value={formData.level?.current ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: { current: parseInt(e.target.value) || 0, target: formData.level?.target || 0 },
                  })
                }
              />
              <Input
                type="number"
                placeholder="Objetivo"
                value={formData.level?.target ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: { current: formData.level?.current || 0, target: parseInt(e.target.value) || 0 },
                  })
                }
              />
              <Input
                placeholder="Etiqueta"
                value={formData.level?.label ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    level: { ...(formData.level || { current: 0, target: 0 }), label: e.target.value },
                  })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
            {objective ? 'Actualizar' : 'Crear'} Objetivo
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
