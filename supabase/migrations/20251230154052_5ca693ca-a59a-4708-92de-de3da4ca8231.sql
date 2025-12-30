-- ===========================================
-- COURSES SECTION - Database Schema
-- ===========================================

-- Table: courses (main course info)
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  outcome TEXT, -- "Al finalizar podrás..."
  thumbnail_url TEXT,
  duration_minutes INTEGER,
  is_published BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: course_lessons (videos/lessons within a course)
CREATE TABLE public.course_lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration_minutes INTEGER,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: user_course_progress (track user progress on lessons)
CREATE TABLE public.user_course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES public.course_lessons(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  progress_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

-- Table: course_exercises (practical exercises for courses)
CREATE TABLE public.course_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  instructions TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ===========================================
-- INDEXES
-- ===========================================

CREATE INDEX idx_courses_slug ON public.courses(slug);
CREATE INDEX idx_courses_published ON public.courses(is_published);
CREATE INDEX idx_course_lessons_course_id ON public.course_lessons(course_id);
CREATE INDEX idx_course_lessons_order ON public.course_lessons(course_id, order_index);
CREATE INDEX idx_user_course_progress_user ON public.user_course_progress(user_id);
CREATE INDEX idx_user_course_progress_lesson ON public.user_course_progress(lesson_id);
CREATE INDEX idx_course_exercises_course ON public.course_exercises(course_id);

-- ===========================================
-- TRIGGERS for updated_at
-- ===========================================

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_lessons_updated_at
  BEFORE UPDATE ON public.course_lessons
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_course_progress_updated_at
  BEFORE UPDATE ON public.user_course_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_course_exercises_updated_at
  BEFORE UPDATE ON public.course_exercises
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ===========================================
-- ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_course_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_exercises ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- COURSES POLICIES
-- ===========================================

-- Deny anonymous access
CREATE POLICY "courses_deny_anonymous" ON public.courses
  AS RESTRICTIVE FOR ALL
  USING (false);

-- Require authentication
CREATE POLICY "courses_require_auth" ON public.courses
  AS RESTRICTIVE FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Anyone authenticated can view published courses (for catalog)
CREATE POLICY "courses_select_published" ON public.courses
  FOR SELECT
  USING (is_published = true);

-- Admins can manage all courses
CREATE POLICY "courses_admin_all" ON public.courses
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ===========================================
-- COURSE LESSONS POLICIES
-- ===========================================

-- Deny anonymous access
CREATE POLICY "course_lessons_deny_anonymous" ON public.course_lessons
  AS RESTRICTIVE FOR ALL
  USING (false);

-- Require authentication
CREATE POLICY "course_lessons_require_auth" ON public.course_lessons
  AS RESTRICTIVE FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Anyone authenticated can view published lessons from published courses
CREATE POLICY "course_lessons_select_published" ON public.course_lessons
  FOR SELECT
  USING (
    is_published = true 
    AND EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_lessons.course_id 
      AND courses.is_published = true
    )
  );

-- Admins can manage all lessons
CREATE POLICY "course_lessons_admin_all" ON public.course_lessons
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ===========================================
-- USER COURSE PROGRESS POLICIES
-- ===========================================

-- Deny anonymous access
CREATE POLICY "user_course_progress_deny_anonymous" ON public.user_course_progress
  AS RESTRICTIVE FOR ALL
  USING (false);

-- Require authentication
CREATE POLICY "user_course_progress_require_auth" ON public.user_course_progress
  AS RESTRICTIVE FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Users can view their own progress
CREATE POLICY "user_course_progress_select_own" ON public.user_course_progress
  FOR SELECT
  USING (user_id = get_profile_id_for_auth());

-- Users can insert their own progress
CREATE POLICY "user_course_progress_insert_own" ON public.user_course_progress
  FOR INSERT
  WITH CHECK (user_id = get_profile_id_for_auth());

-- Users can update their own progress
CREATE POLICY "user_course_progress_update_own" ON public.user_course_progress
  FOR UPDATE
  USING (user_id = get_profile_id_for_auth())
  WITH CHECK (user_id = get_profile_id_for_auth());

-- Admins can view all progress
CREATE POLICY "user_course_progress_admin_select" ON public.user_course_progress
  FOR SELECT
  USING (is_admin());

-- ===========================================
-- COURSE EXERCISES POLICIES
-- ===========================================

-- Deny anonymous access
CREATE POLICY "course_exercises_deny_anonymous" ON public.course_exercises
  AS RESTRICTIVE FOR ALL
  USING (false);

-- Require authentication
CREATE POLICY "course_exercises_require_auth" ON public.course_exercises
  AS RESTRICTIVE FOR ALL
  USING (auth.uid() IS NOT NULL);

-- Anyone authenticated can view published exercises from published courses
CREATE POLICY "course_exercises_select_published" ON public.course_exercises
  FOR SELECT
  USING (
    is_published = true 
    AND EXISTS (
      SELECT 1 FROM public.courses 
      WHERE courses.id = course_exercises.course_id 
      AND courses.is_published = true
    )
  );

-- Admins can manage all exercises
CREATE POLICY "course_exercises_admin_all" ON public.course_exercises
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ===========================================
-- HELPER FUNCTION: Check course access
-- ===========================================

CREATE OR REPLACE FUNCTION public.has_course_access(p_course_slug TEXT DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_user_profile_id UUID;
  user_plan subscription_plan;
BEGIN
  -- Get current user's profile ID
  SELECT id INTO current_user_profile_id
  FROM public.profiles
  WHERE user_id = auth.uid();
  
  IF current_user_profile_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get user's subscription plan
  SELECT plan INTO user_plan
  FROM public.user_subscriptions
  WHERE user_id = current_user_profile_id
    AND status = 'active';
  
  -- Admins always have access
  IF public.is_admin() THEN
    RETURN TRUE;
  END IF;
  
  -- cursos_all: access to all courses
  IF user_plan = 'cursos_all' THEN
    RETURN TRUE;
  END IF;
  
  -- repremium: access to all courses
  IF user_plan = 'repremium' THEN
    RETURN TRUE;
  END IF;
  
  -- curso_estrategia: only access to estrategia course
  IF user_plan = 'curso_estrategia' THEN
    RETURN p_course_slug = 'estrategia-producto-principiantes' OR p_course_slug IS NULL;
  END IF;
  
  -- free/premium: no course access
  RETURN FALSE;
END;
$$;