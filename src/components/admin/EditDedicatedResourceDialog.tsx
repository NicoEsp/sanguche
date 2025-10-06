import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useUpdateDedicatedResource, ResourceType, DedicatedResource } from "@/hooks/useUserDedicatedResources";

const resourceSchema = z.object({
  resource_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(200),
  resource_type: z.enum(['article', 'podcast', 'video', 'course', 'tool', 'community', 'other']),
  external_url: z.string().url("Debe ser una URL válida"),
  description: z.string().max(500).optional()
});

type ResourceFormData = z.infer<typeof resourceSchema>;

interface EditDedicatedResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resource: DedicatedResource;
}

const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  article: '📄 Artículo',
  podcast: '🎙️ Podcast',
  video: '🎥 Video',
  course: '📚 Curso',
  tool: '🛠️ Herramienta',
  community: '👥 Comunidad',
  other: '🔗 Otro'
};

export function EditDedicatedResourceDialog({ open, onOpenChange, resource }: EditDedicatedResourceDialogProps) {
  const updateResource = useUpdateDedicatedResource();
  
  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      resource_name: resource.resource_name,
      resource_type: resource.resource_type as ResourceType,
      external_url: resource.external_url || '',
      description: resource.description || ''
    }
  });

  const onSubmit = async (data: ResourceFormData) => {
    await updateResource.mutateAsync({
      id: resource.id,
      resource_name: data.resource_name,
      resource_type: data.resource_type,
      external_url: data.external_url,
      description: data.description || null
    });

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar Recurso Dedicado</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="resource_name">Nombre del recurso *</Label>
            <Input
              id="resource_name"
              {...register('resource_name')}
              placeholder="Ej: Guía completa de Product Discovery"
            />
            {errors.resource_name && (
              <p className="text-sm text-destructive">{errors.resource_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="resource_type">Tipo de recurso *</Label>
            <Select
              onValueChange={(value) => setValue('resource_type', value as ResourceType)}
              defaultValue={resource.resource_type}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="external_url">URL del recurso *</Label>
            <Input
              id="external_url"
              {...register('external_url')}
              placeholder="https://ejemplo.com/recurso"
              type="url"
            />
            {errors.external_url && (
              <p className="text-sm text-destructive">{errors.external_url.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción (opcional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Breve descripción del recurso y por qué es útil para este usuario..."
              rows={4}
            />
            {errors.description && (
              <p className="text-sm text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateResource.isPending}>
              {updateResource.isPending ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
