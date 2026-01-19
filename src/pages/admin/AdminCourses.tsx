import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Pencil, Trash2, Eye, BookOpen, Video, CalendarClock, CircleDashed, CheckCircle, CalendarIcon, Upload, X, ImageIcon } from 'lucide-react';
import {
  useAdminCourses,
  useCreateCourse,
  useUpdateCourse,
  useDeleteCourse,
} from '@/hooks/useAdminCourses';
import { Course, CourseStatus } from '@/types/courses';
import { cn } from '@/lib/utils';

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

interface CourseFormData {
  title: string;
  slug: string;
  description: string;
  outcome: string;
  thumbnail_url: string;
  duration_minutes: string;
  order_index: string;
  status: CourseStatus;
  publish_at: Date | undefined;
}

const defaultFormData: CourseFormData = {
  title: '',
  slug: '',
  description: '',
  outcome: '',
  thumbnail_url: '',
  duration_minutes: '',
  order_index: '0',
  status: 'draft',
  publish_at: undefined,
};

const statusConfig: Record<CourseStatus, { label: string; variant: 'default' | 'secondary' | 'outline'; icon: typeof CircleDashed }> = {
  draft: { label: 'Borrador', variant: 'secondary', icon: CircleDashed },
  coming_soon: { label: 'Próximamente', variant: 'outline', icon: CalendarClock },
  published: { label: 'Publicado', variant: 'default', icon: CheckCircle },
};

const AdminCourses = () => {
  const navigate = useNavigate();
  const { data: courses = [], isLoading } = useAdminCourses();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const deleteCourse = useDeleteCourse();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState<CourseFormData>(defaultFormData);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Thumbnail upload states
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleOpenCreate = () => {
    setEditingCourse(null);
    setFormData(defaultFormData);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      slug: course.slug,
      description: course.description || '',
      outcome: course.outcome || '',
      thumbnail_url: course.thumbnail_url || '',
      duration_minutes: course.duration_minutes?.toString() || '',
      order_index: course.order_index.toString(),
      status: course.status || (course.is_published ? 'published' : 'draft'),
      publish_at: course.publish_at ? new Date(course.publish_at) : undefined,
    });
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
    setFormData(defaultFormData);
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
  };

  const handleThumbnailFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona una imagen válida');
        return;
      }
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast.error('La imagen no puede superar los 2MB');
        return;
      }
      setSelectedThumbnail(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setFormData({ ...formData, thumbnail_url: '' }); // Clear URL if file is selected
    }
  };

  const handleRemoveThumbnail = () => {
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    let thumbnail_url = formData.thumbnail_url || null;
    
    // Upload thumbnail if a file was selected
    if (selectedThumbnail) {
      try {
        setIsUploading(true);
        const ext = selectedThumbnail.name.split('.').pop();
        const fileName = `${formData.slug}-${Date.now()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('course-thumbnails')
          .upload(fileName, selectedThumbnail, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('course-thumbnails')
          .getPublicUrl(fileName);
        
        thumbnail_url = publicUrl;
        toast.success('Imagen subida correctamente');
      } catch (error) {
        console.error('Error uploading thumbnail:', error);
        toast.error('Error al subir la imagen');
        setIsUploading(false);
        return;
      } finally {
        setIsUploading(false);
      }
    }
    
    const courseData = {
      title: formData.title,
      slug: formData.slug,
      description: formData.description || null,
      outcome: formData.outcome || null,
      thumbnail_url,
      duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
      order_index: parseInt(formData.order_index) || 0,
      status: formData.status,
      is_published: formData.status === 'published',
      publish_at: formData.status === 'coming_soon' && formData.publish_at 
        ? formData.publish_at.toISOString() 
        : null,
    };

    if (editingCourse) {
      await updateCourse.mutateAsync({ id: editingCourse.id, data: courseData });
    } else {
      await createCourse.mutateAsync(courseData);
    }
    handleCloseDialog();
  };

  const handleTitleChange = (title: string) => {
    setFormData({
      ...formData,
      title,
      slug: editingCourse ? formData.slug : generateSlug(title),
    });
  };

  const handleDelete = (course: Course) => {
    if (confirm(`¿Eliminar el curso "${course.title}"? Esto también eliminará sus lecciones y ejercicios.`)) {
      deleteCourse.mutate(course.id);
    }
  };

  const filteredCourses = courses.filter((c) => {
    if (filterStatus === 'all') return true;
    // Use status if available, fallback to is_published for backwards compatibility
    const courseStatus = c.status || (c.is_published ? 'published' : 'draft');
    return courseStatus === filterStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Cursos</h1>
          <p className="text-muted-foreground">Administra cursos, lecciones y ejercicios</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Curso
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="py-2">
          <div className="flex gap-4 items-center">
            <Label>Estado:</Label>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="draft">Borradores</SelectItem>
                <SelectItem value="coming_soon">Próximamente</SelectItem>
                <SelectItem value="published">Publicados</SelectItem>
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
                <TableHead>Slug</TableHead>
                <TableHead className="text-center">Lecciones</TableHead>
                <TableHead className="text-center">Ejercicios</TableHead>
                <TableHead className="text-center">Duración</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-center">Orden</TableHead>
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
              ) : filteredCourses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No hay cursos
                  </TableCell>
                </TableRow>
              ) : (
                filteredCourses.map((course) => {
                  const lessonsCount = course.course_lessons?.[0]?.count || 0;
                  const exercisesCount = course.course_exercises?.[0]?.count || 0;
                  const courseStatus: CourseStatus = course.status || (course.is_published ? 'published' : 'draft');
                  const config = statusConfig[courseStatus];
                  const StatusIcon = config.icon;
                  
                  return (
                    <TableRow key={course.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {course.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {course.slug}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Video className="h-3 w-3 text-muted-foreground" />
                          {lessonsCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <BookOpen className="h-3 w-3 text-muted-foreground" />
                          {exercisesCount}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        {course.duration_minutes ? `${course.duration_minutes} min` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant={config.variant} className={courseStatus === 'coming_soon' ? 'border-amber-500 text-amber-600 dark:text-amber-400' : ''}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {config.label}
                          </Badge>
                          {courseStatus === 'coming_soon' && course.publish_at && (
                            <p className="text-xs text-muted-foreground">
                              📅 {format(new Date(course.publish_at), "d MMM yyyy", { locale: es })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">{course.order_index}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/admin/cursos/${course.id}`)}
                            title="Ver detalle"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(course)}
                            title="Editar"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(course)}
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
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
              {editingCourse ? 'Editar Curso' : 'Nuevo Curso'}
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
                <Label htmlFor="slug">Slug *</Label>
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

            <div className="space-y-2">
              <Label htmlFor="outcome">Resultado esperado</Label>
              <Textarea
                id="outcome"
                value={formData.outcome}
                onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                rows={2}
                placeholder="¿Qué aprenderá el estudiante al completar este curso?"
              />
            </div>

            <div className="space-y-3">
              <Label>Thumbnail del Curso</Label>
              <div className="flex gap-4">
                {/* Preview */}
                <div className="flex-shrink-0 w-32 h-20 rounded-md border border-dashed border-muted-foreground/30 overflow-hidden bg-muted/20 flex items-center justify-center">
                  {thumbnailPreview || formData.thumbnail_url ? (
                    <img 
                      src={thumbnailPreview || formData.thumbnail_url} 
                      alt="Thumbnail preview" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground/50" />
                  )}
                </div>
                
                {/* Upload controls */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleThumbnailFileChange}
                      className="hidden"
                      id="thumbnail-upload"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Subir imagen
                    </Button>
                    {selectedThumbnail && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={handleRemoveThumbnail}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                  {selectedThumbnail && (
                    <p className="text-xs text-muted-foreground truncate">
                      {selectedThumbnail.name}
                    </p>
                  )}
                  
                  {/* Divider */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex-1 border-t" />
                    <span>o usar URL</span>
                    <div className="flex-1 border-t" />
                  </div>
                  
                  {/* URL input */}
                  <Input
                    id="thumbnail_url"
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => {
                      setFormData({ ...formData, thumbnail_url: e.target.value });
                      if (e.target.value) {
                        setSelectedThumbnail(null);
                        setThumbnailPreview(null);
                      }
                    }}
                    placeholder="https://..."
                    disabled={!!selectedThumbnail}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Formatos: JPG, PNG, WebP. Máximo 2MB.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duración (minutos)</Label>
                <Input
                  id="duration_minutes"
                  type="number"
                  min="0"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="order_index">Orden</Label>
                <Input
                  id="order_index"
                  type="number"
                  min="0"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Estado</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value: CourseStatus) => setFormData({ 
                    ...formData, 
                    status: value,
                    publish_at: value !== 'coming_soon' ? undefined : formData.publish_at 
                  })}
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">
                      <div className="flex items-center gap-2">
                        <CircleDashed className="h-4 w-4" />
                        Borrador
                      </div>
                    </SelectItem>
                    <SelectItem value="coming_soon">
                      <div className="flex items-center gap-2">
                        <CalendarClock className="h-4 w-4 text-amber-500" />
                        Próximamente
                      </div>
                    </SelectItem>
                    <SelectItem value="published">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Publicado
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Scheduled publishing date picker - only shown when status is coming_soon */}
            {formData.status === 'coming_soon' && (
              <div className="space-y-2">
                <Label>Fecha de lanzamiento programada (opcional)</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.publish_at && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.publish_at 
                        ? format(formData.publish_at, "PPP", { locale: es }) 
                        : "Seleccionar fecha..."
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.publish_at}
                      onSelect={(date) => setFormData({ ...formData, publish_at: date })}
                      disabled={(date) => date < new Date()}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  El curso se publicará automáticamente en esta fecha (revisión cada hora).
                </p>
                {formData.publish_at && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFormData({ ...formData, publish_at: undefined })}
                    className="text-xs"
                  >
                    Quitar fecha programada
                  </Button>
                )}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createCourse.isPending || updateCourse.isPending || isUploading}>
                {isUploading ? 'Subiendo imagen...' : editingCourse ? 'Guardar cambios' : 'Crear curso'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;
