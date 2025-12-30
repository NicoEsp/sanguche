import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Course, CourseLesson, CourseExercise } from '@/types/courses';

// ============= QUERIES =============

export function useAdminCourses() {
  return useQuery({
    queryKey: ['admin-courses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('courses')
        .select(`
          *,
          course_lessons(count),
          course_exercises(count)
        `)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as (Course & { 
        course_lessons: { count: number }[];
        course_exercises: { count: number }[];
      })[];
    },
  });
}

export function useAdminCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: ['admin-course', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID required');
      
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      return data as Course;
    },
    enabled: !!courseId,
  });
}

export function useAdminCourseLessons(courseId: string | undefined) {
  return useQuery({
    queryKey: ['admin-course-lessons', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID required');
      
      const { data, error } = await supabase
        .from('course_lessons')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as CourseLesson[];
    },
    enabled: !!courseId,
  });
}

export function useAdminCourseExercises(courseId: string | undefined) {
  return useQuery({
    queryKey: ['admin-course-exercises', courseId],
    queryFn: async () => {
      if (!courseId) throw new Error('Course ID required');
      
      const { data, error } = await supabase
        .from('course_exercises')
        .select('*')
        .eq('course_id', courseId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as CourseExercise[];
    },
    enabled: !!courseId,
  });
}

// ============= COURSE MUTATIONS =============

export function useCreateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<Course>) => {
      const { error } = await supabase
        .from('courses')
        .insert(data as any);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Curso creado correctamente');
    },
    onError: (error) => {
      console.error('Error creating course:', error);
      toast.error('Error al crear el curso');
    },
  });
}

export function useUpdateCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Course> }) => {
      const { error } = await supabase
        .from('courses')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      queryClient.invalidateQueries({ queryKey: ['admin-course', id] });
      toast.success('Curso actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error updating course:', error);
      toast.error('Error al actualizar el curso');
    },
  });
}

export function useDeleteCourse() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Curso eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error deleting course:', error);
      toast.error('Error al eliminar el curso');
    },
  });
}

// ============= LESSON MUTATIONS =============

export function useCreateLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<CourseLesson>) => {
      const { error } = await supabase
        .from('course_lessons')
        .insert(data as any);
      if (error) throw error;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-lessons', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Lección creada correctamente');
    },
    onError: (error) => {
      console.error('Error creating lesson:', error);
      toast.error('Error al crear la lección');
    },
  });
}

export function useUpdateLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, courseId, data }: { id: string; courseId: string; data: Partial<CourseLesson> }) => {
      const { error } = await supabase
        .from('course_lessons')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      return { courseId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-lessons', result.courseId] });
      toast.success('Lección actualizada correctamente');
    },
    onError: (error) => {
      console.error('Error updating lesson:', error);
      toast.error('Error al actualizar la lección');
    },
  });
}

export function useDeleteLesson() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_lessons')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { courseId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-lessons', result.courseId] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Lección eliminada correctamente');
    },
    onError: (error) => {
      console.error('Error deleting lesson:', error);
      toast.error('Error al eliminar la lección');
    },
  });
}

// ============= EXERCISE MUTATIONS =============

export function useCreateExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: Partial<CourseExercise>) => {
      const { error } = await supabase
        .from('course_exercises')
        .insert(data as any);
      if (error) throw error;
    },
    onSuccess: (_, data) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-exercises', data.course_id] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Ejercicio creado correctamente');
    },
    onError: (error) => {
      console.error('Error creating exercise:', error);
      toast.error('Error al crear el ejercicio');
    },
  });
}

export function useUpdateExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, courseId, data }: { id: string; courseId: string; data: Partial<CourseExercise> }) => {
      const { error } = await supabase
        .from('course_exercises')
        .update(data)
        .eq('id', id);
      if (error) throw error;
      return { courseId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-exercises', result.courseId] });
      toast.success('Ejercicio actualizado correctamente');
    },
    onError: (error) => {
      console.error('Error updating exercise:', error);
      toast.error('Error al actualizar el ejercicio');
    },
  });
}

export function useDeleteExercise() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, courseId }: { id: string; courseId: string }) => {
      const { error } = await supabase
        .from('course_exercises')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { courseId };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['admin-course-exercises', result.courseId] });
      queryClient.invalidateQueries({ queryKey: ['admin-courses'] });
      toast.success('Ejercicio eliminado correctamente');
    },
    onError: (error) => {
      console.error('Error deleting exercise:', error);
      toast.error('Error al eliminar el ejercicio');
    },
  });
}
