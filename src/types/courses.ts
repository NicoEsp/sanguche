export type CourseStatus = 'draft' | 'coming_soon' | 'published';

export interface Course {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  outcome: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  is_published: boolean;
  status: CourseStatus;
  order_index: number;
  publish_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CourseLesson {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_minutes: number | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserCourseProgress {
  id: string;
  user_id: string;
  lesson_id: string;
  started_at: string;
  completed_at: string | null;
  progress_seconds: number;
  created_at: string;
  updated_at: string;
}

export interface CourseExercise {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  instructions: string | null;
  order_index: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface CourseWithLessons extends Course {
  lessons: CourseLesson[];
  exercises: CourseExercise[];
}

export interface LessonWithProgress extends CourseLesson {
  progress?: UserCourseProgress | null;
  isCompleted: boolean;
}

export interface CourseProgress {
  totalLessons: number;
  completedLessons: number;
  progressPercentage: number;
  isCompleted: boolean;
}
