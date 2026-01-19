import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
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
import { Label } from '@/components/ui/label';
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

// Zod validation schema
const courseSchema = z.object({
  title: z.string()
    .trim()
    .min(3, "El título debe tener al menos 3 caracteres")
    .max(200, "El título no puede exceder 200 caracteres"),
  slug: z.string()
    .trim()
    .min(3, "El slug debe tener al menos 3 caracteres")
    .max(100, "El slug no puede exceder 100 caracteres")
    .regex(/^[a-z0-9-]+$/, "El slug solo puede contener letras minúsculas, números y guiones"),
  description: z.string()
    .max(1000, "La descripción no puede exceder 1000 caracteres")
    .optional()
    .or(z.literal('')),
  outcome: z.string()
    .max(500, "El resultado esperado no puede exceder 500 caracteres")
    .optional()
    .or(z.literal('')),
  thumbnail_url: z.string()
    .refine((val) => val === '' || val.startsWith('http://') || val.startsWith('https://'), {
      message: "Debe ser una URL válida (http:// o https://)"
    })
    .optional()
    .or(z.literal('')),
  duration_minutes: z.string()
    .refine((val) => val === '' || (!isNaN(Number(val)) && Number(val) >= 0 && Number(val) <= 600), {
      message: "La duración debe ser un número entre 0 y 600 minutos"
    })
    .optional()
    .or(z.literal('')),
  order_index: z.string()
    .refine((val) => !isNaN(Number(val)) && Number(val) >= 0, {
      message: "El orden debe ser un número mayor o igual a 0"
    }),
  status: z.enum(['draft', 'coming_soon', 'published'], {
    required_error: "Selecciona un estado"
  }),
  publish_at: z.date().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

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
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Thumbnail upload states
  const [selectedThumbnail, setSelectedThumbnail] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // React Hook Form with Zod validation
  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: defaultFormData,
  });

  const handleOpenCreate = () => {
    setEditingCourse(null);
    form.reset(defaultFormData);
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (course: Course) => {
    setEditingCourse(course);
    form.reset({
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
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingCourse(null);
    form.reset(defaultFormData);
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
      form.setValue('thumbnail_url', ''); // Clear URL if file is selected
    }
  };

  const handleRemoveThumbnail = () => {
    setSelectedThumbnail(null);
    setThumbnailPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const onSubmit = async (data: CourseFormData) => {
    let thumbnail_url = data.thumbnail_url || null;
    
    // Upload thumbnail if a file was selected
    if (selectedThumbnail) {
      try {
        setIsUploading(true);
        const ext = selectedThumbnail.name.split('.').pop();
        const fileName = `${data.slug}-${Date.now()}.${ext}`;
        
        const { error: uploadError } = await supabase.storage
          .from('course-thumbnails')
          .upload(fileName, selectedThumbnail, { upsert: true });
        
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('course-thumbnails')
          .getPublicUrl(fileName);
        
        thumbnail_url = publicUrlData.publicUrl;
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
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      outcome: data.outcome || null,
      thumbnail_url,
      duration_minutes: data.duration_minutes ? parseInt(data.duration_minutes) : null,
      order_index: parseInt(data.order_index) || 0,
      status: data.status,
      is_published: data.status === 'published',
      publish_at: data.status === 'coming_soon' && data.publish_at 
        ? data.publish_at.toISOString() 
        : null,
    };

    if (editingCourse) {
      await updateCourse.mutateAsync({ id: editingCourse.id, data: courseData });
    } else {
      await createCourse.mutateAsync(courseData);
    }
    handleCloseDialog();
  };

  const handleTitleChange = (value: string) => {
    form.setValue('title', value, { shouldValidate: true });
    if (!editingCourse) {
      form.setValue('slug', generateSlug(value), { shouldValidate: true });
    }
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

  const watchedStatus = form.watch('status');
  const watchedThumbnailUrl = form.watch('thumbnail_url');

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
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Título *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          onChange={(e) => handleTitleChange(e.target.value)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descripción</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="outcome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Resultado esperado</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        rows={2}
                        placeholder="¿Qué aprenderá el estudiante al completar este curso?"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-3">
                <Label>Thumbnail del Curso</Label>
                <div className="flex gap-4">
                  {/* Preview */}
                  <div className="flex-shrink-0 w-32 h-20 rounded-md border border-dashed border-muted-foreground/30 overflow-hidden bg-muted/20 flex items-center justify-center">
                    {thumbnailPreview || watchedThumbnailUrl ? (
                      <img 
                        src={thumbnailPreview || watchedThumbnailUrl} 
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
                    <FormField
                      control={form.control}
                      name="thumbnail_url"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input
                              {...field}
                              type="url"
                              onChange={(e) => {
                                field.onChange(e);
                                if (e.target.value) {
                                  setSelectedThumbnail(null);
                                  setThumbnailPreview(null);
                                }
                              }}
                              placeholder="https://..."
                              disabled={!!selectedThumbnail}
                              className="h-8 text-sm"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Formatos: JPG, PNG, WebP. Máximo 2MB.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="duration_minutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración (minutos)</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          min="0"
                          max="600"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="order_index"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orden</FormLabel>
                      <FormControl>
                        <Input 
                          {...field}
                          type="number"
                          min="0"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estado</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={(value: CourseStatus) => {
                          field.onChange(value);
                          if (value !== 'coming_soon') {
                            form.setValue('publish_at', undefined);
                          }
                        }}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Scheduled publishing date picker - only shown when status is coming_soon */}
              {watchedStatus === 'coming_soon' && (
                <FormField
                  control={form.control}
                  name="publish_at"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fecha de lanzamiento programada (opcional)</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value 
                                ? format(field.value, "PPP", { locale: es }) 
                                : "Seleccionar fecha..."
                              }
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date()}
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                      <p className="text-xs text-muted-foreground">
                        El curso se publicará automáticamente en esta fecha (revisión cada hora).
                      </p>
                      {field.value && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="sm"
                          onClick={() => field.onChange(undefined)}
                          className="text-xs"
                        >
                          Quitar fecha programada
                        </Button>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createCourse.isPending || updateCourse.isPending || isUploading}
                >
                  {isUploading ? 'Subiendo imagen...' : editingCourse ? 'Guardar cambios' : 'Crear curso'}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;
