-- ============================================
-- GESTIÓN DE MENTORÍAS: Estructura de Base de Datos
-- ============================================

-- 1. Transformar exercise_requests → user_exercises
ALTER TABLE public.exercise_requests RENAME TO user_exercises;

-- Agregar nuevas columnas
ALTER TABLE public.user_exercises
  ADD COLUMN exercise_title TEXT NOT NULL DEFAULT 'Ejercicio sin título',
  ADD COLUMN exercise_description TEXT,
  ADD COLUMN exercise_type TEXT CHECK (exercise_type IN ('case_study', 'practical', 'theoretical')) DEFAULT 'case_study',
  ADD COLUMN delivery_method TEXT CHECK (delivery_method IN ('in_app')) DEFAULT 'in_app',
  ADD COLUMN attachment_url TEXT,
  ADD COLUMN due_date TIMESTAMPTZ,
  ADD COLUMN submission_text TEXT,
  ADD COLUMN submission_date TIMESTAMPTZ,
  ADD COLUMN admin_feedback TEXT,
  ADD COLUMN status TEXT CHECK (status IN ('assigned', 'in_progress', 'submitted', 'reviewed')) DEFAULT 'assigned',
  ADD COLUMN assigned_by_admin UUID REFERENCES public.profiles(id);

-- Eliminar la columna exercise_id que ya no necesitamos
ALTER TABLE public.user_exercises DROP COLUMN IF EXISTS exercise_id;

-- RLS Policies para user_exercises
DROP POLICY IF EXISTS "Admins can view all exercise requests" ON public.user_exercises;
DROP POLICY IF EXISTS "Users can create their own exercise requests" ON public.user_exercises;
DROP POLICY IF EXISTS "Users can view their own exercise requests" ON public.user_exercises;

CREATE POLICY "Admins can manage all exercises"
ON public.user_exercises FOR ALL TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

CREATE POLICY "Users can view their assigned exercises"
ON public.user_exercises FOR SELECT TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their exercise submissions"
ON public.user_exercises FOR UPDATE TO authenticated
USING (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  user_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);

-- 2. Crear tabla user_mentoria_opportunities
CREATE TABLE public.user_mentoria_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  opportunity_key TEXT NOT NULL,
  opportunity_label TEXT NOT NULL,
  current_level INTEGER CHECK (current_level BETWEEN 1 AND 5),
  target_level INTEGER CHECK (target_level BETWEEN 1 AND 5),
  notes TEXT,
  created_by_admin UUID REFERENCES public.profiles(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_mentoria_opportunities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage opportunities" 
ON public.user_mentoria_opportunities
FOR ALL TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Users view their opportunities" 
ON public.user_mentoria_opportunities
FOR SELECT TO authenticated 
USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 3. Crear tabla user_mentoria_recommendations
CREATE TABLE public.user_mentoria_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  skill_type TEXT CHECK (skill_type IN ('soft_skill', 'hard_skill')) NOT NULL,
  skill_name TEXT NOT NULL,
  description TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  status TEXT CHECK (status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  created_by_admin UUID REFERENCES public.profiles(id),
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_mentoria_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage recommendations" 
ON public.user_mentoria_recommendations
FOR ALL TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Users view their recommendations" 
ON public.user_mentoria_recommendations
FOR SELECT TO authenticated 
USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

CREATE POLICY "Users update recommendation status" 
ON public.user_mentoria_recommendations
FOR UPDATE TO authenticated 
USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
)
WITH CHECK (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);

-- 4. Crear tabla user_dedicated_resources
CREATE TABLE public.user_dedicated_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  resource_name TEXT NOT NULL,
  resource_type TEXT CHECK (resource_type IN ('document', 'video', 'link', 'other')) NOT NULL,
  file_url TEXT,
  external_url TEXT,
  description TEXT,
  bucket_name TEXT DEFAULT 'private-resources',
  created_by_admin UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_dedicated_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage resources" 
ON public.user_dedicated_resources
FOR ALL TO authenticated 
USING (public.is_admin()) 
WITH CHECK (public.is_admin());

CREATE POLICY "Users view their resources" 
ON public.user_dedicated_resources
FOR SELECT TO authenticated 
USING (
  user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
);