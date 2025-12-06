import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2, Edit, Eye } from 'lucide-react';
import { SkeletonAdminTable } from '@/components/skeletons/SkeletonAdminTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useResources, Resource } from '@/hooks/useResources';
import { DOMAINS } from '@/utils/scoring';

const resourceSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  visibility_type: z.enum(['public', 'conditional']),
  condition_domain: z.string().optional(),
  condition_min_level: z.number().min(1).max(5).optional(),
  condition_max_level: z.number().min(1).max(5).optional(),
  display_order: z.number().min(0),
  is_active: z.boolean(),
});

type ResourceFormData = z.infer<typeof resourceSchema>;

export default function AdminResources() {
  const { resources, loading, refetch } = useResources();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [resourceToDelete, setResourceToDelete] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<ResourceFormData>({
    resolver: zodResolver(resourceSchema),
    defaultValues: {
      name: '',
      visibility_type: 'public',
      display_order: 0,
      is_active: true,
    },
  });

  const visibilityType = form.watch('visibility_type');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        toast({
          title: 'Error',
          description: 'Solo se permiten archivos PDF',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'El archivo no debe superar los 50MB',
          variant: 'destructive',
        });
        return;
      }
      setUploadedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string | null> => {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from('resources')
        .upload(fileName, file, {
          cacheControl: '0',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('resources')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error uploading file:', error);
      return null;
    }
  };

  const onSubmit = async (data: ResourceFormData) => {
    try {
      setUploading(true);

      let fileUrl = editingResource?.file_url || '';

      if (uploadedFile) {
        const url = await uploadFile(uploadedFile);
        if (!url) {
          toast({
            title: 'Error',
            description: 'Error al subir el archivo',
            variant: 'destructive',
          });
          return;
        }
        fileUrl = url;
      }

      if (!fileUrl && !editingResource) {
        toast({
          title: 'Error',
          description: 'Debe seleccionar un archivo PDF',
          variant: 'destructive',
        });
        return;
      }

      const resourceData = {
        name: data.name,
        file_url: fileUrl,
        visibility_type: data.visibility_type,
        condition_domain: data.visibility_type === 'conditional' ? data.condition_domain : null,
        condition_min_level: data.visibility_type === 'conditional' ? data.condition_min_level : null,
        condition_max_level: data.visibility_type === 'conditional' ? data.condition_max_level : null,
        display_order: data.display_order,
        is_active: data.is_active,
      };

      if (editingResource) {
        const { error } = await supabase
          .from('resources')
          .update(resourceData)
          .eq('id', editingResource.id);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Recurso actualizado correctamente',
        });
      } else {
        const { error } = await supabase
          .from('resources')
          .insert([resourceData]);

        if (error) throw error;

        toast({
          title: 'Éxito',
          description: 'Recurso creado correctamente',
        });
      }

      setIsDialogOpen(false);
      setEditingResource(null);
      setUploadedFile(null);
      form.reset();
      refetch();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error saving resource:', error);
      toast({
        title: 'Error',
        description: 'Error al guardar el recurso',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    form.reset({
      name: resource.name,
      visibility_type: resource.visibility_type,
      condition_domain: resource.condition_domain || undefined,
      condition_min_level: resource.condition_min_level || undefined,
      condition_max_level: resource.condition_max_level || undefined,
      display_order: resource.display_order,
      is_active: resource.is_active,
    });
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (resource: Resource) => {
    setResourceToDelete(resource);
  };

  const confirmDelete = async () => {
    if (!resourceToDelete) return;
    
    setDeleting(true);
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', resourceToDelete.id);

      if (error) throw error;

      toast({
        title: 'Éxito',
        description: 'Recurso eliminado correctamente',
      });
      refetch();
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error deleting resource:', error);
      toast({
        title: 'Error',
        description: 'Error al eliminar el recurso',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setResourceToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Recursos PDF</h1>
          <p className="text-muted-foreground">
            Gestiona los recursos disponibles para los usuarios
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setEditingResource(null);
              setUploadedFile(null);
              form.reset();
            }}>
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Recurso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
              </DialogTitle>
              <DialogDescription>
                {editingResource
                  ? 'Modifica los datos del recurso'
                  : 'Completa los datos para crear un nuevo recurso PDF'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label htmlFor="name">Nombre del recurso *</Label>
                <Input
                  id="name"
                  {...form.register('name')}
                  placeholder="Ej: Métricas de Producto: Lo esencial"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="file">Archivo PDF {!editingResource && '*'}</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="file"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                  />
                  {uploadedFile && (
                    <Badge variant="secondary">{uploadedFile.name}</Badge>
                  )}
                </div>
                {editingResource && !uploadedFile && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Deja vacío si no quieres cambiar el archivo
                  </p>
                )}
              </div>

              <div>
                <Label>Visibilidad *</Label>
                <RadioGroup
                  value={form.watch('visibility_type')}
                  onValueChange={(value) => form.setValue('visibility_type', value as 'public' | 'conditional')}
                  className="flex gap-4 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="public" id="public" />
                    <Label htmlFor="public" className="font-normal">Público</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="conditional" id="conditional" />
                    <Label htmlFor="conditional" className="font-normal">Condicional</Label>
                  </div>
                </RadioGroup>
              </div>

              {visibilityType === 'conditional' && (
                <Card className="p-4 space-y-4">
                  <h4 className="font-medium">Condiciones de visibilidad</h4>
                  
                  <div>
                    <Label htmlFor="domain">Dominio asociado *</Label>
                    <Select
                      value={form.watch('condition_domain')}
                      onValueChange={(value) => form.setValue('condition_domain', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un dominio" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOMAINS.map((domain) => (
                          <SelectItem key={domain.key} value={domain.key}>
                            {domain.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="min_level">Nivel mínimo *</Label>
                      <Input
                        id="min_level"
                        type="number"
                        min="1"
                        max="5"
                        {...form.register('condition_min_level', { valueAsNumber: true })}
                        placeholder="1-5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="max_level">Nivel máximo</Label>
                      <Input
                        id="max_level"
                        type="number"
                        min="1"
                        max="5"
                        {...form.register('condition_max_level', { valueAsNumber: true })}
                        placeholder="1-5 (opcional)"
                      />
                    </div>
                  </div>
                </Card>
              )}

              <div>
                <Label htmlFor="display_order">Orden de visualización</Label>
                <Input
                  id="display_order"
                  type="number"
                  min="0"
                  {...form.register('display_order', { valueAsNumber: true })}
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={form.watch('is_active')}
                  onCheckedChange={(checked) => form.setValue('is_active', checked)}
                />
                <Label htmlFor="is_active" className="font-normal">
                  Recurso activo
                </Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={uploading}>
                  {uploading ? 'Guardando...' : editingResource ? 'Actualizar' : 'Crear'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <SkeletonAdminTable columns={6} rows={5} showHeader={false} showFilters={false} />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Visibilidad</TableHead>
                <TableHead>Condición</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {resources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No hay recursos creados
                  </TableCell>
                </TableRow>
              ) : (
                resources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium">{resource.name}</TableCell>
                    <TableCell>
                      <Badge variant={resource.visibility_type === 'public' ? 'secondary' : 'default'}>
                        {resource.visibility_type === 'public' ? 'Público' : 'Condicional'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resource.visibility_type === 'conditional' && resource.condition_domain ? (
                        <span className="text-sm">
                          {DOMAINS.find(d => d.key === resource.condition_domain)?.label || resource.condition_domain}
                          {' '}
                          ({resource.condition_min_level || 1}-{resource.condition_max_level || 5})
                        </span>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{resource.display_order}</TableCell>
                    <TableCell>
                      <Badge variant={resource.is_active ? 'default' : 'outline'}>
                        {resource.is_active ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          asChild
                        >
                          <a href={resource.file_url} target="_blank" rel="noopener noreferrer">
                            <Eye className="w-4 h-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(resource)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteClick(resource)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!resourceToDelete} onOpenChange={() => setResourceToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el recurso "{resourceToDelete?.name}" permanentemente.
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={deleting}>
              {deleting ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
