import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateExercise } from "@/hooks/useUserExercises";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";

const exerciseSchema = z.object({
  exercise_title: z.string().min(5, "El título debe tener al menos 5 caracteres").max(200),
  exercise_description: z.string().optional(),
  exercise_type: z.enum(['case_study', 'practical', 'theoretical']),
  due_date: z.date().optional(),
  attachment_url: z.string().url().optional().or(z.literal(''))
});

type ExerciseFormData = z.infer<typeof exerciseSchema>;

interface CreateExerciseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export function CreateExerciseDialog({ open, onOpenChange, userId }: CreateExerciseDialogProps) {
  const { user } = useAuth();
  const createExercise = useCreateExercise();
  
  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<ExerciseFormData>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      exercise_type: 'case_study',
      exercise_title: '',
      exercise_description: '',
      attachment_url: ''
    }
  });

  const dueDate = watch('due_date');

  const onSubmit = async (data: ExerciseFormData) => {
    if (!user) return;
    
    // Get admin's profile id
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    await createExercise.mutateAsync({
      user_id: userId,
      assigned_by_admin: profile.id,
      exercise_title: data.exercise_title,
      exercise_description: data.exercise_description || null,
      exercise_type: data.exercise_type,
      delivery_method: 'in_app',
      due_date: data.due_date?.toISOString() || null,
      attachment_url: data.attachment_url || null,
      status: 'assigned',
      submission_text: null,
      submission_date: null,
      admin_feedback: null
    });

    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Ejercicio</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="exercise_title">Título del ejercicio *</Label>
            <Input
              id="exercise_title"
              {...register('exercise_title')}
              placeholder="Ej: Análisis de producto y roadmap"
            />
            {errors.exercise_title && (
              <p className="text-sm text-destructive">{errors.exercise_title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="exercise_description">Descripción detallada</Label>
            <Textarea
              id="exercise_description"
              {...register('exercise_description')}
              placeholder="Describe el ejercicio, objetivos, y lo que esperas del usuario..."
              rows={6}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="exercise_type">Tipo de ejercicio</Label>
            <Select
              onValueChange={(value) => setValue('exercise_type', value as any)}
              defaultValue="case_study"
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="case_study">Caso de estudio</SelectItem>
                <SelectItem value="practical">Ejercicio práctico</SelectItem>
                <SelectItem value="theoretical">Teórico</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Fecha de entrega (opcional)</Label>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                type="date"
                className="pl-10"
                value={dueDate ? format(dueDate, "yyyy-MM-dd") : ""}
                onChange={(event) => {
                  const value = event.target.value;
                  setValue('due_date', value ? new Date(`${value}T00:00:00`) : undefined, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="attachment_url">Material adjunto (URL opcional)</Label>
            <Input
              id="attachment_url"
              {...register('attachment_url')}
              placeholder="https://..."
              type="url"
            />
            {errors.attachment_url && (
              <p className="text-sm text-destructive">{errors.attachment_url.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createExercise.isPending}>
              {createExercise.isPending ? "Creando..." : "Crear Ejercicio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
