import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Plus, Pencil, Trash2, Video, BookOpen, ExternalLink, Upload, Link } from 'lucide-react';
import {
  useAdminCourse,
  useAdminCourseLessons,
  useAdminCourseExercises,
  useCreateLesson,
  useUpdateLesson,
  useDeleteLesson,
  useCreateExercise,
  useUpdateExercise,
  useDeleteExercise,
} from '@/hooks/useAdminCourses';
import { supabase } from '@/integrations/supabase/client';
import { CourseLesson, CourseExercise } from '@/types/courses';
import { toast } from 'sonner';

// ============= LESSON FORM =============

type VideoSourceType = 'external' | 'storage';

interface LessonFormData {
  title: string;
  description: string;
  video_url: string;
  video_source: VideoSourceType;
  duration_minutes: string;
  order_index: string;
  is_published: boolean;
}

const defaultLessonFormData: LessonFormData = {
  title: '',
  description: '',
  video_url: '',
  video_source: 'external',
  duration_minutes: '',
  order_index: '0',
  is_published: true,
};

// ============= EXERCISE FORM =============

interface ExerciseFormData {
  title: string;
  description: string;
  instructions: string;
  order_index: string;
  is_published: boolean;
}

const defaultExerciseFormData: ExerciseFormData = {
  title: '',
  description: '',
  instructions: '',
  order_index: '0',
  is_published: true,
};

// ============= VIDEO PREVIEW =============

function getVideoEmbedUrl(url: string): string | null {
  if (!url) return null;
  
  // YouTube
  const youtubeMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  // Loom
  const loomMatch = url.match(/loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/);
  if (loomMatch) {
    return `https://www.loom.com/embed/${loomMatch[1]}`;
  }
  
  return null;
}

const AdminCourseDetail = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  
  const { data: course, isLoading: courseLoading } = useAdminCourse(courseId);
  const { data: lessons = [], isLoading: lessonsLoading } = useAdminCourseLessons(courseId);
  const { data: exercises = [], isLoading: exercisesLoading } = useAdminCourseExercises(courseId);
  
  // Lesson mutations
  const createLesson = useCreateLesson();
  const updateLesson = useUpdateLesson();
  const deleteLesson = useDeleteLesson();
  
  // Exercise mutations
  const createExercise = useCreateExercise();
  const updateExercise = useUpdateExercise();
  const deleteExercise = useDeleteExercise();
  
  // Lesson dialog state
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<CourseLesson | null>(null);
  const [lessonFormData, setLessonFormData] = useState<LessonFormData>(defaultLessonFormData);
  
  // Exercise dialog state
  const [isExerciseDialogOpen, setIsExerciseDialogOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<CourseExercise | null>(null);
  const [exerciseFormData, setExerciseFormData] = useState<ExerciseFormData>(defaultExerciseFormData);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ============= LESSON HANDLERS =============

  const handleOpenCreateLesson = () => {
    setEditingLesson(null);
    setLessonFormData({
      ...defaultLessonFormData,
      order_index: lessons.length.toString(),
    });
    setIsLessonDialogOpen(true);
  };

  const handleOpenEditLesson = (lesson: CourseLesson) => {
    setEditingLesson(lesson);
    setLessonFormData({
      title: lesson.title,
      description: lesson.description || '',
      video_url: lesson.video_url,
      video_source: (lesson.video_type as VideoSourceType) || 'external',
      duration_minutes: lesson.duration_minutes?.toString() || '',
      order_index: lesson.order_index?.toString() || '0',
      is_published: lesson.is_published ?? true,
    });
    setIsLessonDialogOpen(true);
  };

  const handleCloseLessonDialog = () => {
    setIsLessonDialogOpen(false);
    setEditingLesson(null);
    setLessonFormData(defaultLessonFormData);
  };

  const handleSubmitLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    
    const lessonData = {
      course_id: courseId,
      title: lessonFormData.title,
      description: lessonFormData.description || null,
      video_url: lessonFormData.video_url,
      video_type: lessonFormData.video_source,
      duration_minutes: lessonFormData.duration_minutes ? parseInt(lessonFormData.duration_minutes) : null,
      order_index: parseInt(lessonFormData.order_index) || 0,
      is_published: lessonFormData.is_published,
    };

    if (editingLesson) {
      await updateLesson.mutateAsync({ id: editingLesson.id, courseId, data: lessonData });
    } else {
      await createLesson.mutateAsync(lessonData);
    }
    handleCloseLessonDialog();
  };

  const handleDeleteLesson = (lesson: CourseLesson) => {
    if (!courseId) return;
    if (confirm(`¿Eliminar la lección "${lesson.title}"?`)) {
      deleteLesson.mutate({ id: lesson.id, courseId });
    }
  };

  // ============= EXERCISE HANDLERS =============

  const handleOpenCreateExercise = () => {
    setEditingExercise(null);
    setExerciseFormData({
      ...defaultExerciseFormData,
      order_index: exercises.length.toString(),
    });
    setIsExerciseDialogOpen(true);
  };

  const handleOpenEditExercise = (exercise: CourseExercise) => {
    setEditingExercise(exercise);
    setExerciseFormData({
      title: exercise.title,
      description: exercise.description || '',
      instructions: exercise.instructions || '',
      order_index: exercise.order_index?.toString() || '0',
      is_published: exercise.is_published ?? true,
    });
    setIsExerciseDialogOpen(true);
  };

  const handleCloseExerciseDialog = () => {
    setIsExerciseDialogOpen(false);
    setEditingExercise(null);
    setExerciseFormData(defaultExerciseFormData);
  };

  const handleSubmitExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId) return;
    
    const exerciseData = {
      course_id: courseId,
      title: exerciseFormData.title,
      description: exerciseFormData.description || null,
      instructions: exerciseFormData.instructions || null,
      order_index: parseInt(exerciseFormData.order_index) || 0,
      is_published: exerciseFormData.is_published,
    };

    if (editingExercise) {
      await updateExercise.mutateAsync({ id: editingExercise.id, courseId, data: exerciseData });
    } else {
      await createExercise.mutateAsync(exerciseData);
    }
    handleCloseExerciseDialog();
  };

  const handleDeleteExercise = (exercise: CourseExercise) => {
    if (!courseId) return;
    if (confirm(`¿Eliminar el ejercicio "${exercise.title}"?`)) {
      deleteExercise.mutate({ id: exercise.id, courseId });
    }
  };

  // ============= RENDER =============

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Cargando curso...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => navigate('/admin/cursos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Volver a cursos
        </Button>
        <p className="text-muted-foreground">Curso no encontrado</p>
      </div>
    );
  }

  const embedUrl = getVideoEmbedUrl(lessonFormData.video_url);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/cursos')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Cursos
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground text-sm">
            {course.slug} • {course.is_published ? 'Publicado' : 'Borrador'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="lessons" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lessons" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            Lecciones ({lessons.length})
          </TabsTrigger>
          <TabsTrigger value="exercises" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            Ejercicios ({exercises.length})
          </TabsTrigger>
        </TabsList>

        {/* LESSONS TAB */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleOpenCreateLesson}>
              <Plus className="h-4 w-4 mr-2" />
              Nueva Lección
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Orden</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Duración</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lessonsLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : lessons.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay lecciones. Crea la primera.
                      </TableCell>
                    </TableRow>
                  ) : (
                    lessons.map((lesson) => (
                      <TableRow key={lesson.id}>
                        <TableCell className="text-center">{lesson.order_index}</TableCell>
                        <TableCell className="font-medium">{lesson.title}</TableCell>
                        <TableCell>
                          {lesson.duration_minutes ? `${lesson.duration_minutes} min` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={lesson.is_published ? 'default' : 'secondary'}>
                            {lesson.is_published ? 'Publicado' : 'Borrador'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(lesson.video_url, '_blank')}
                              title="Ver video"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditLesson(lesson)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson)}
                              title="Eliminar"
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
        </TabsContent>

        {/* EXERCISES TAB */}
        <TabsContent value="exercises" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={handleOpenCreateExercise}>
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Ejercicio
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Orden</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {exercisesLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Cargando...
                      </TableCell>
                    </TableRow>
                  ) : exercises.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        No hay ejercicios. Crea el primero.
                      </TableCell>
                    </TableRow>
                  ) : (
                    exercises.map((exercise) => (
                      <TableRow key={exercise.id}>
                        <TableCell className="text-center">{exercise.order_index}</TableCell>
                        <TableCell className="font-medium">{exercise.title}</TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {exercise.description || '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant={exercise.is_published ? 'default' : 'secondary'}>
                            {exercise.is_published ? 'Publicado' : 'Borrador'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEditExercise(exercise)}
                              title="Editar"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteExercise(exercise)}
                              title="Eliminar"
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
        </TabsContent>
      </Tabs>

      {/* LESSON DIALOG */}
      <Dialog open={isLessonDialogOpen} onOpenChange={setIsLessonDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingLesson ? 'Editar Lección' : 'Nueva Lección'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitLesson} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="lesson-title">Título *</Label>
              <Input
                id="lesson-title"
                value={lessonFormData.title}
                onChange={(e) => setLessonFormData({ ...lessonFormData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="lesson-description">Descripción</Label>
              <Textarea
                id="lesson-description"
                value={lessonFormData.description}
                onChange={(e) => setLessonFormData({ ...lessonFormData, description: e.target.value })}
                rows={2}
              />
            </div>

            {/* Video source toggle */}
            <div className="space-y-3">
              <Label>Fuente del video</Label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={lessonFormData.video_source === 'external' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLessonFormData({ ...lessonFormData, video_source: 'external', video_url: '' })}
                >
                  <Link className="h-4 w-4 mr-2" />
                  URL externa
                </Button>
                <Button
                  type="button"
                  variant={lessonFormData.video_source === 'storage' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setLessonFormData({ ...lessonFormData, video_source: 'storage', video_url: '' })}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Subir video
                </Button>
              </div>
            </div>

            {lessonFormData.video_source === 'external' ? (
              <div className="space-y-2">
                <Label htmlFor="lesson-video">URL del Video *</Label>
                <Input
                  id="lesson-video"
                  type="url"
                  value={lessonFormData.video_url}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, video_url: e.target.value })}
                  placeholder="https://youtube.com/watch?v=... o https://vimeo.com/... o https://loom.com/share/..."
                  required
                />
                {embedUrl && (
                  <div className="mt-2 aspect-video rounded-lg overflow-hidden border">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                      title="Video preview"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="lesson-video-upload">Archivo de video *</Label>
                {lessonFormData.video_url ? (
                  <div className="flex items-center gap-2 p-3 border rounded-lg bg-muted/50">
                    <Video className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium flex-1 truncate">{lessonFormData.video_url}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setLessonFormData({ ...lessonFormData, video_url: '' })}
                    >
                      Cambiar
                    </Button>
                  </div>
                ) : (
                  <>
                    <Input
                      id="lesson-video-upload"
                      type="file"
                      accept="video/*"
                      disabled={isUploading}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !course) return;

                        setIsUploading(true);
                        setUploadProgress(0);

                        // Simulate progress since we can't track real multipart progress
                        const progressInterval = setInterval(() => {
                          setUploadProgress((prev) => Math.min(prev + 10, 90));
                        }, 500);

                        try {
                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('course_slug', course.slug);
                          formData.append('file_name', file.name.replace(/\s+/g, '-').toLowerCase());

                          const { data, error } = await supabase.functions.invoke('upload-course-video', {
                            body: formData,
                          });

                          clearInterval(progressInterval);

                          if (error) throw error;

                          setUploadProgress(100);
                          setLessonFormData({ ...lessonFormData, video_url: data.storage_path });
                          toast.success('Video subido correctamente');
                        } catch (err) {
                          clearInterval(progressInterval);
                          toast.error('Error al subir el video');
                          console.error('Upload error:', err);
                        } finally {
                          setIsUploading(false);
                          setUploadProgress(0);
                        }
                      }}
                    />
                    {isUploading && (
                      <div className="w-full bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="lesson-duration">Duración (minutos)</Label>
                <Input
                  id="lesson-duration"
                  type="number"
                  min="0"
                  value={lessonFormData.duration_minutes}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, duration_minutes: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lesson-order">Orden</Label>
                <Input
                  id="lesson-order"
                  type="number"
                  min="0"
                  value={lessonFormData.order_index}
                  onChange={(e) => setLessonFormData({ ...lessonFormData, order_index: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="lesson-published"
                checked={lessonFormData.is_published}
                onCheckedChange={(checked) => setLessonFormData({ ...lessonFormData, is_published: checked })}
              />
              <Label htmlFor="lesson-published">Publicado</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseLessonDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createLesson.isPending || updateLesson.isPending}>
                {editingLesson ? 'Guardar cambios' : 'Crear lección'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* EXERCISE DIALOG */}
      <Dialog open={isExerciseDialogOpen} onOpenChange={setIsExerciseDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? 'Editar Ejercicio' : 'Nuevo Ejercicio'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitExercise} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="exercise-title">Título *</Label>
              <Input
                id="exercise-title"
                value={exerciseFormData.title}
                onChange={(e) => setExerciseFormData({ ...exerciseFormData, title: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-description">Descripción</Label>
              <Textarea
                id="exercise-description"
                value={exerciseFormData.description}
                onChange={(e) => setExerciseFormData({ ...exerciseFormData, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-instructions">Instrucciones</Label>
              <Textarea
                id="exercise-instructions"
                value={exerciseFormData.instructions}
                onChange={(e) => setExerciseFormData({ ...exerciseFormData, instructions: e.target.value })}
                rows={4}
                placeholder="Instrucciones detalladas para el ejercicio (soporta markdown)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="exercise-order">Orden</Label>
              <Input
                id="exercise-order"
                type="number"
                min="0"
                value={exerciseFormData.order_index}
                onChange={(e) => setExerciseFormData({ ...exerciseFormData, order_index: e.target.value })}
              />
            </div>

            <div className="flex items-center gap-2">
              <Switch
                id="exercise-published"
                checked={exerciseFormData.is_published}
                onCheckedChange={(checked) => setExerciseFormData({ ...exerciseFormData, is_published: checked })}
              />
              <Label htmlFor="exercise-published">Publicado</Label>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={handleCloseExerciseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createExercise.isPending || updateExercise.isPending}>
                {editingExercise ? 'Guardar cambios' : 'Crear ejercicio'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourseDetail;
