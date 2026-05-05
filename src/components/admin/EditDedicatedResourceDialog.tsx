import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useUpdateDedicatedResource,
  ResourceType,
  DedicatedResource,
  PRIVATE_RESOURCES_BUCKET,
} from "@/hooks/useUserDedicatedResources";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FileUp, X } from "lucide-react";

const MAX_FILE_SIZE = 50 * 1024 * 1024;
const ACCEPTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];
const ACCEPT_ATTR = '.pdf,.docx,.xlsx';

const resourceSchema = z.object({
  resource_name: z.string().min(3, "El nombre debe tener al menos 3 caracteres").max(200),
  resource_type: z.enum(['article', 'podcast', 'video', 'course', 'tool', 'community', 'other']),
  external_url: z.string().url("Debe ser una URL válida").optional().or(z.literal('')),
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

const sanitizeFileName = (name: string) =>
  name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '_')
    .replace(/_+/g, '_');

const fileNameFromPath = (path: string) => {
  const segments = path.split('/');
  const last = segments[segments.length - 1] || path;
  return last.replace(/^\d+-/, '');
};

export function EditDedicatedResourceDialog({ open, onOpenChange, resource }: EditDedicatedResourceDialogProps) {
  const updateResource = useUpdateDedicatedResource();
  const { toast } = useToast();

  const initialTab: 'link' | 'file' = resource.file_url ? 'file' : 'link';
  const [sourceTab, setSourceTab] = useState<'link' | 'file'>(initialTab);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [keepExistingFile, setKeepExistingFile] = useState(!!resource.file_url);
  const [isUploading, setIsUploading] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue } = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      resource_name: resource.resource_name,
      resource_type: resource.resource_type as ResourceType,
      external_url: resource.external_url || '',
      description: resource.description || ''
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo debe pesar 50MB o menos",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
      toast({
        title: "Formato no permitido",
        description: "Solo se aceptan PDF, DOCX o XLSX",
        variant: "destructive",
      });
      e.target.value = '';
      return;
    }
    setSelectedFile(file);
    setKeepExistingFile(false);
  };

  const onSubmit = async (data: ResourceFormData) => {
    if (sourceTab === 'link' && !data.external_url) {
      toast({
        title: "Falta la URL",
        description: "Ingresá un link o cambiá a la pestaña Archivo",
        variant: "destructive",
      });
      return;
    }
    if (sourceTab === 'file' && !selectedFile && !keepExistingFile) {
      toast({
        title: "Falta el archivo",
        description: "Seleccioná un archivo o cambiá a la pestaña Link",
        variant: "destructive",
      });
      return;
    }

    let file_url: string | null = null;
    let external_url: string | null = null;
    let oldFileToDelete: string | null = null;

    if (sourceTab === 'file') {
      if (selectedFile) {
        try {
          setIsUploading(true);
          const cleanName = sanitizeFileName(selectedFile.name);
          const path = `${resource.user_id}/${Date.now()}-${cleanName}`;

          const { error: uploadError } = await supabase.storage
            .from(PRIVATE_RESOURCES_BUCKET)
            .upload(path, selectedFile, {
              upsert: false,
              contentType: selectedFile.type,
            });

          if (uploadError) throw uploadError;
          file_url = path;

          if (resource.file_url) {
            oldFileToDelete = resource.file_url;
          }
        } catch (error) {
          toast({
            title: "Error al subir archivo",
            description: error instanceof Error ? error.message : "Intentá de nuevo",
            variant: "destructive",
          });
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      } else if (keepExistingFile) {
        file_url = resource.file_url;
      }
    } else {
      external_url = data.external_url || null;
      if (resource.file_url) {
        oldFileToDelete = resource.file_url;
      }
    }

    await updateResource.mutateAsync({
      id: resource.id,
      resource_name: data.resource_name,
      resource_type: data.resource_type,
      external_url,
      file_url,
      description: data.description || null
    });

    if (oldFileToDelete) {
      await supabase.storage
        .from(resource.bucket_name || PRIVATE_RESOURCES_BUCKET)
        .remove([oldFileToDelete]);
    }

    onOpenChange(false);
  };

  const submitting = updateResource.isPending || isUploading;
  const showExistingFileChip = sourceTab === 'file' && keepExistingFile && !selectedFile && resource.file_url;

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

          <Tabs value={sourceTab} onValueChange={(v) => setSourceTab(v as 'link' | 'file')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="link">🔗 Link</TabsTrigger>
              <TabsTrigger value="file">📎 Archivo</TabsTrigger>
            </TabsList>

            <TabsContent value="link" className="space-y-2 pt-3">
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
            </TabsContent>

            <TabsContent value="file" className="space-y-2 pt-3">
              <Label htmlFor="resource_file">Archivo *</Label>
              {selectedFile ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileUp className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-sm">{selectedFile.name}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setSelectedFile(null)}
                    aria-label="Quitar archivo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : showExistingFileChip ? (
                <div className="flex items-center justify-between gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileUp className="h-4 w-4 shrink-0 text-primary" />
                    <span className="truncate text-sm">
                      {fileNameFromPath(resource.file_url!)}
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground">archivo actual</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => setKeepExistingFile(false)}
                    aria-label="Reemplazar archivo"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Input
                  id="resource_file"
                  type="file"
                  accept={ACCEPT_ATTR}
                  onChange={handleFileChange}
                />
              )}
              <p className="text-xs text-muted-foreground">
                PDF, DOCX o XLSX · Máximo 50MB
              </p>
            </TabsContent>
          </Tabs>

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
            <Button type="submit" disabled={submitting}>
              {isUploading ? "Subiendo archivo..." : submitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
