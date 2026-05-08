import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, FileDown, Star, Loader2, Crown, Lock, Target } from 'lucide-react';
import { SkeletonAdminTable } from '@/components/skeletons/SkeletonAdminTable';
import { DOMAINS } from '@/utils/scoring';

type AccessLevel = 'public' | 'authenticated' | 'premium';
type ResourceType = 'pdf' | 'template' | 'checklist' | 'guide' | 'image';

interface DownloadableResource {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  type: ResourceType;
  file_path: string;
  bucket_name: string | null;
  thumbnail_url: string | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  access_level: AccessLevel;
  condition_domain: string | null;
  condition_min_level: number | null;
  condition_max_level: number | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  title: string;
  slug: string;
  description: string;
  type: ResourceType;
  thumbnail_url: string;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  access_level: AccessLevel;
  condition_domain: string;
  condition_min_level: number;
  condition_max_level: number;
}

const initialFormData: FormData = {
  title: '',
  slug: '',
  description: '',
  type: 'pdf',
  thumbnail_url: '',
  display_order: 0,
  is_featured: false,
  is_active: true,
  access_level: 'authenticated',
  condition_domain: '',
  condition_min_level: 1,
  condition_max_level: 5,
};

const accessLevels: { value: AccessLevel; label: string }[] = [
  { value: 'public', label: 'Público' },
  { value: 'authenticated', label: 'Solo autenticados' },
  { value: 'premium', label: 'Solo Premium' },
];

const resourceTypes: { value: ResourceType; label: string }[] = [
  { value: 'pdf', label: 'PDF' },
  { value: 'template', label: 'Template' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'guide', label: 'Guía' },
  { value: 'image', label: 'Imagen' },
];

const FILE_ACCEPT = '.pdf,.png,.jpg,.jpeg,.webp,.gif,.svg,.docx,.xlsx,.zip';

export default function AdminDescargables() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<DownloadableResource | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: resources, isLoading } = useQuery({
    queryKey: ['admin-downloadable-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('downloadable_resources')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as DownloadableResource[];
    },
  });

  const generateSlug = (title: string) =>
    title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: editingResource ? prev.slug : generateSlug(title),
    }));
  };

  const isConditional = !!formData.condition_domain;

  const saveMutation = useMutation({
    mutationFn: async ({
      data,
      file,
      existingId,
    }: {
      data: FormData;
      file: File | null;
      existingId: string | null;
    }) => {
      let file_path = editingResource?.file_path || '';
      let bucket_name = editingResource?.bucket_name || 'downloads';

      if (file) {
        const ext = file.name.split('.').pop() || 'bin';
        const fileName = `${data.slug}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('downloads')
          .upload(fileName, file, { upsert: true });

        if (uploadError) throw uploadError;
        file_path = fileName;
        bucket_name = 'downloads';
      }

      if (!file_path && !existingId) {
        throw new Error('Debe seleccionar un archivo');
      }

      const conditional = !!data.condition_domain;
      const resourceData = {
        title: data.title,
        slug: data.slug,
        description: data.description || null,
        type: data.type,
        file_path,
        bucket_name,
        thumbnail_url: data.thumbnail_url || null,
        display_order: data.display_order,
        is_featured: data.is_featured,
        is_active: data.is_active,
        access_level: data.access_level,
        condition_domain: conditional ? data.condition_domain : null,
        condition_min_level: conditional ? data.condition_min_level : null,
        condition_max_level: conditional ? data.condition_max_level : null,
      };

      if (existingId) {
        const { error } = await supabase
          .from('downloadable_resources')
          .update(resourceData)
          .eq('id', existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('downloadable_resources')
          .insert(resourceData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['skill-gaps-resources'] });
      toast.success(editingResource ? 'Recurso actualizado' : 'Recurso creado');
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('downloadable_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['skill-gaps-resources'] });
      toast.success('Recurso eliminado');
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => {
      toast.error(`Error al eliminar: ${error.message}`);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: 'is_active' | 'is_featured'; value: boolean }) => {
      const { error } = await supabase
        .from('downloadable_resources')
        .update({ [field]: value })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['downloadable-resources'] });
      queryClient.invalidateQueries({ queryKey: ['skill-gaps-resources'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  const openCreateDialog = () => {
    setEditingResource(null);
    setFormData(initialFormData);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (resource: DownloadableResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      slug: resource.slug,
      description: resource.description || '',
      type: resource.type,
      thumbnail_url: resource.thumbnail_url || '',
      display_order: resource.display_order,
      is_featured: resource.is_featured,
      is_active: resource.is_active,
      access_level: resource.access_level || 'authenticated',
      condition_domain: resource.condition_domain || '',
      condition_min_level: resource.condition_min_level ?? 1,
      condition_max_level: resource.condition_max_level ?? 5,
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingResource(null);
    setFormData(initialFormData);
    setSelectedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      data: formData,
      file: selectedFile,
      existingId: editingResource?.id || null,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  if (isLoading) return <SkeletonAdminTable />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recursos y Descargables</h1>
          <p className="text-muted-foreground">
            Sin condiciones por competencia → aparece en /descargables. Con condiciones → solo en SkillGaps cuando matchea con la evaluación del usuario.
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Recurso
        </Button>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Visibilidad</TableHead>
              <TableHead>Acceso</TableHead>
              <TableHead className="text-center">Orden</TableHead>
              <TableHead className="text-center">Destacado</TableHead>
              <TableHead className="text-center">Activo</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {resources?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  <FileDown className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  No hay recursos registrados
                </TableCell>
              </TableRow>
            ) : (
              resources?.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium">{resource.title}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground">
                      {resourceTypes.find(t => t.value === resource.type)?.label || resource.type}
                    </span>
                  </TableCell>
                  <TableCell>
                    {resource.condition_domain ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-violet-500/20 text-violet-600">
                        <Target className="h-3 w-3" />
                        SkillGaps · {DOMAINS.find(d => d.key === resource.condition_domain)?.label || resource.condition_domain}
                        {' '}({resource.condition_min_level ?? 1}-{resource.condition_max_level ?? 5})
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600">
                        /descargables
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {resource.access_level === 'premium' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-600">
                        <Crown className="h-3 w-3" />
                        Premium
                      </span>
                    ) : resource.access_level === 'authenticated' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-600">
                        <Lock className="h-3 w-3" />
                        Autenticado
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                        Público
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">{resource.display_order}</TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={resource.is_featured}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: resource.id, field: 'is_featured', value: checked })
                      }
                      disabled={!!resource.condition_domain}
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={resource.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: resource.id, field: 'is_active', value: checked })
                      }
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditDialog(resource)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteConfirmId(resource.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="Preguntas de Producto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="preguntas-de-producto"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del recurso..."
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Solo se muestra en /descargables. Se respetan saltos de línea.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: ResourceType) => setFormData(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {resourceTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="display_order">Orden</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData(prev => ({ ...prev, display_order: parseInt(e.target.value) || 0 }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_level">Nivel de Acceso</Label>
              <Select
                value={formData.access_level}
                onValueChange={(value: AccessLevel) => setFormData(prev => ({ ...prev, access_level: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accessLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Card className="p-4 space-y-3">
              <div className="space-y-1">
                <Label className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Visibilidad por competencia (opcional)
                </Label>
                <p className="text-xs text-muted-foreground">
                  Si elegís un dominio, este recurso solo aparece en SkillGaps cuando el assessment del usuario matchea el rango. No aparece en /descargables.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="condition_domain">Dominio</Label>
                <Select
                  value={formData.condition_domain || '__none__'}
                  onValueChange={(value) => setFormData(prev => ({
                    ...prev,
                    condition_domain: value === '__none__' ? '' : value,
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sin condición (aparece en /descargables)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Sin condición — /descargables</SelectItem>
                    {DOMAINS.map((domain) => (
                      <SelectItem key={domain.key} value={domain.key}>
                        {domain.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isConditional && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="condition_min_level">Nivel mínimo</Label>
                    <Input
                      id="condition_min_level"
                      type="number"
                      min={1}
                      max={5}
                      value={formData.condition_min_level}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        condition_min_level: Math.max(1, Math.min(5, parseInt(e.target.value) || 1)),
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="condition_max_level">Nivel máximo</Label>
                    <Input
                      id="condition_max_level"
                      type="number"
                      min={1}
                      max={5}
                      value={formData.condition_max_level}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        condition_max_level: Math.max(1, Math.min(5, parseInt(e.target.value) || 5)),
                      }))}
                    />
                  </div>
                </div>
              )}
            </Card>

            <div className="space-y-2">
              <Label htmlFor="thumbnail_url">URL Thumbnail (opcional)</Label>
              <Input
                id="thumbnail_url"
                value={formData.thumbnail_url}
                onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">
                Archivo {!editingResource && '*'}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="file"
                  type="file"
                  accept={FILE_ACCEPT}
                  onChange={handleFileChange}
                  className="flex-1"
                />
                {selectedFile && (
                  <span className="text-sm text-muted-foreground truncate max-w-32">
                    {selectedFile.name}
                  </span>
                )}
              </div>
              {editingResource && (
                <p className="text-xs text-muted-foreground">
                  Archivo actual: {editingResource.bucket_name}/{editingResource.file_path}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_featured"
                    checked={formData.is_featured}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_featured: checked }))}
                    disabled={isConditional}
                  />
                  <Label htmlFor="is_featured" className="flex items-center gap-1">
                    <Star className="h-4 w-4" />
                    Destacado
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active">Activo</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingResource ? 'Guardar Cambios' : 'Crear Recurso'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar recurso?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El recurso será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
