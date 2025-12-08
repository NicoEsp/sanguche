import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Upload, FileText, Video, BookOpen, CheckSquare, File } from 'lucide-react';
import { toast } from 'sonner';
import { StarterPackResource, ResourceType, Audience, AccessType, ResourceLevel } from '@/types/starterpack';

const typeOptions: { value: ResourceType; label: string; icon: React.ReactNode }[] = [
  { value: 'article', label: 'Artículo', icon: <BookOpen className="h-4 w-4" /> },
  { value: 'pdf', label: 'PDF', icon: <FileText className="h-4 w-4" /> },
  { value: 'video', label: 'Video', icon: <Video className="h-4 w-4" /> },
  { value: 'template', label: 'Template', icon: <File className="h-4 w-4" /> },
  { value: 'checklist', label: 'Checklist', icon: <CheckSquare className="h-4 w-4" /> },
];

const audienceOptions: { value: Audience; label: string }[] = [
  { value: 'build', label: 'Build' },
  { value: 'lead', label: 'Lead' },
  { value: 'both', label: 'Ambos' },
];

const accessOptions: { value: AccessType; label: string }[] = [
  { value: 'public', label: 'Público' },
  { value: 'requires_account', label: 'Requiere cuenta' },
  { value: 'premium', label: 'Premium' },
];

const levelOptions: { value: ResourceLevel; label: string }[] = [
  { value: 'beginner', label: 'Principiante' },
  { value: 'intermediate', label: 'Intermedio' },
  { value: 'advanced', label: 'Avanzado' },
];

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

interface ResourceFormData {
  title: string;
  slug: string;
  description: string;
  type: ResourceType;
  audience: Audience;
  access_type: AccessType;
  level: ResourceLevel;
  duration_estimate: string;
  step_order: string;
  display_order: string;
  is_featured: boolean;
  is_active: boolean;
}

const defaultFormData: ResourceFormData = {
  title: '',
  slug: '',
  description: '',
  type: 'article',
  audience: 'both',
  access_type: 'public',
  level: 'beginner',
  duration_estimate: '',
  step_order: '',
  display_order: '0',
  is_featured: false,
  is_active: true,
};

const AdminStarterPack = () => {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<StarterPackResource | null>(null);
  const [formData, setFormData] = useState<ResourceFormData>(defaultFormData);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterAudience, setFilterAudience] = useState<string>('all');

  // Fetch resources
  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['admin-starterpack-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('starterpack_resources')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      return data as StarterPackResource[];
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: {
      formData: ResourceFormData;
      file: File | null;
      existingId?: string;
    }) => {
      let file_path = editingResource?.file_path || null;

      // Upload file if selected
      if (data.file) {
        setIsUploading(true);
        const fileExt = data.file.name.split('.').pop();
        const fileName = `${data.formData.slug}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('starterpack')
          .upload(fileName, data.file, { upsert: true });

        if (uploadError) throw uploadError;
        file_path = fileName;
        setIsUploading(false);
      }

      const resourceData = {
        title: data.formData.title,
        slug: data.formData.slug,
        description: data.formData.description || null,
        type: data.formData.type,
        audience: data.formData.audience,
        access_type: data.formData.access_type,
        level: data.formData.level,
        duration_estimate: data.formData.duration_estimate || null,
        step_order: data.formData.step_order ? parseInt(data.formData.step_order) : null,
        display_order: parseInt(data.formData.display_order) || 0,
        is_featured: data.formData.is_featured,
        is_active: data.formData.is_active,
        file_path,
        bucket_name: 'starterpack',
      };

      if (data.existingId) {
        const { error } = await supabase
          .from('starterpack_resources')
          .update(resourceData)
          .eq('id', data.existingId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('starterpack_resources')
          .insert(resourceData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-starterpack-resources'] });
      toast.success(editingResource ? 'Recurso actualizado' : 'Recurso creado');
      handleCloseDialog();
    },
    onError: (error) => {
      console.error('Error saving resource:', error);
      toast.error('Error al guardar el recurso');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('starterpack_resources')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-starterpack-resources'] });
      toast.success('Recurso eliminado');
    },
    onError: () => {
      toast.error('Error al eliminar el recurso');
    },
  });

  const handleOpenCreate = () => {
    setEditingResource(null);
    setFormData(defaultFormData);
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (resource: StarterPackResource) => {
    setEditingResource(resource);
    setFormData({
      title: resource.title,
      slug: resource.slug,
      description: resource.description || '',
      type: resource.type,
      audience: resource.audience,
      access_type: resource.access_type,
      level: resource.level,
      duration_estimate: resource.duration_estimate || '',
      step_order: resource.step_order?.toString() || '',
      display_order: resource.display_order.toString(),
      is_featured: resource.is_featured,
      is_active: resource.is_active,
    });
    setSelectedFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingResource(null);
    setFormData(defaultFormData);
    setSelectedFile(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({
      formData,
      file: selectedFile,
      existingId: editingResource?.id,
    });
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingResource ? formData.slug : generateSlug(title),
    });
  };

  const filteredResources = resources.filter((r) => {
    if (filterAudience === 'all') return true;
    return r.audience === filterAudience || r.audience === 'both';
  });

  const getAccessBadgeVariant = (access: AccessType) => {
    switch (access) {
      case 'public': return 'secondary';
      case 'requires_account': return 'outline';
      case 'premium': return 'default';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Starter Pack</h1>
          <p className="text-muted-foreground">Gestiona los recursos del Starter Pack</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Recurso
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex gap-4 items-center">
            <Label>Audiencia:</Label>
            <Select value={filterAudience} onValueChange={setFilterAudience}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="build">Build</SelectItem>
                <SelectItem value="lead">Lead</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Audiencia</TableHead>
                <TableHead>Acceso</TableHead>
                <TableHead>Step</TableHead>
                <TableHead>Orden</TableHead>
                <TableHead>Activo</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    Cargando...
                  </TableCell>
                </TableRow>
              ) : filteredResources.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay recursos
                  </TableCell>
                </TableRow>
              ) : (
                filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">
                      {resource.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {resource.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {resource.audience}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getAccessBadgeVariant(resource.access_type)}>
                        {resource.access_type === 'requires_account' ? 'Cuenta' : resource.access_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {resource.step_order !== null ? resource.step_order : '-'}
                    </TableCell>
                    <TableCell>{resource.display_order}</TableCell>
                    <TableCell>
                      <Badge variant={resource.is_active ? 'default' : 'secondary'}>
                        {resource.is_active ? 'Sí' : 'No'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenEdit(resource)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('¿Eliminar este recurso?')) {
                              deleteMutation.mutate(resource.id);
                            }
                          }}
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
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingResource ? 'Editar Recurso' : 'Nuevo Recurso'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Tipo *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(v) => setFormData({ ...formData, type: v as ResourceType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {typeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        <div className="flex items-center gap-2">
                          {opt.icon}
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Audiencia *</Label>
                <Select
                  value={formData.audience}
                  onValueChange={(v) => setFormData({ ...formData, audience: v as Audience })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {audienceOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Acceso *</Label>
                <Select
                  value={formData.access_type}
                  onValueChange={(v) => setFormData({ ...formData, access_type: v as AccessType })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {accessOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Nivel</Label>
                <Select
                  value={formData.level}
                  onValueChange={(v) => setFormData({ ...formData, level: v as ResourceLevel })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">Duración estimada</Label>
                <Input
                  id="duration"
                  placeholder="ej: 15 min"
                  value={formData.duration_estimate}
                  onChange={(e) => setFormData({ ...formData, duration_estimate: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="step_order">Step Order (vacío = no stepper)</Label>
                <Input
                  id="step_order"
                  type="number"
                  placeholder="ej: 1"
                  value={formData.step_order}
                  onChange={(e) => setFormData({ ...formData, step_order: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="display_order">Display Order</Label>
                <Input
                  id="display_order"
                  type="number"
                  value={formData.display_order}
                  onChange={(e) => setFormData({ ...formData, display_order: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Archivo</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                  {editingResource?.file_path && !selectedFile && (
                    <Badge variant="outline">
                      <FileText className="h-3 w-3 mr-1" />
                      Archivo existente
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  id="is_featured"
                  checked={formData.is_featured}
                  onCheckedChange={(v) => setFormData({ ...formData, is_featured: v })}
                />
                <Label htmlFor="is_featured">Destacado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(v) => setFormData({ ...formData, is_active: v })}
                />
                <Label htmlFor="is_active">Activo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending || isUploading}>
                {saveMutation.isPending || isUploading ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminStarterPack;
