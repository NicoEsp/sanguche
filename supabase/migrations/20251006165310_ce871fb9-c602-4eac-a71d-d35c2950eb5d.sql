-- Create progress_objectives table (global catalog)
CREATE TABLE public.progress_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  type TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  level JSONB,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('now', 'soon', 'later')),
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_progress_objectives table (user assignments)
CREATE TABLE public.user_progress_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  objective_id UUID REFERENCES public.progress_objectives(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  type TEXT NOT NULL,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  level JSONB,
  source TEXT NOT NULL CHECK (source IN ('mentor', 'custom')),
  assigned_by_admin UUID REFERENCES public.profiles(id),
  mentor_notes TEXT,
  timeframe TEXT NOT NULL CHECK (timeframe IN ('now', 'soon', 'later')),
  due_date TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'not-started' CHECK (status IN ('not-started', 'in-progress', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.progress_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_progress_objectives ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress_objectives
CREATE POLICY "Anyone can view active objectives"
  ON public.progress_objectives
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "Only admins can manage objectives"
  ON public.progress_objectives
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- RLS Policies for user_progress_objectives
CREATE POLICY "Users can view their own objectives"
  ON public.user_progress_objectives
  FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their own custom objectives"
  ON public.user_progress_objectives
  FOR INSERT
  WITH CHECK (
    source = 'custom' 
    AND user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own custom objectives"
  ON public.user_progress_objectives
  FOR UPDATE
  USING (
    source = 'custom'
    AND user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own custom objectives"
  ON public.user_progress_objectives
  FOR DELETE
  USING (
    source = 'custom'
    AND user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all user objectives"
  ON public.user_progress_objectives
  FOR SELECT
  USING (is_admin());

CREATE POLICY "Admins can manage all user objectives"
  ON public.user_progress_objectives
  FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- Create triggers for updated_at
CREATE TRIGGER update_progress_objectives_updated_at
  BEFORE UPDATE ON public.progress_objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_progress_objectives_updated_at
  BEFORE UPDATE ON public.user_progress_objectives
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Populate with initial suggested objectives
INSERT INTO public.progress_objectives (title, summary, type, steps, timeframe, display_order) VALUES
(
  'Mejora en comunicación estratégica',
  'Desarrollar habilidades para comunicar la visión del producto de manera clara y convincente',
  'Comunicación',
  '[
    {"id": "1", "title": "Identificar stakeholders clave", "completed": false},
    {"id": "2", "title": "Practicar elevator pitch", "completed": false},
    {"id": "3", "title": "Presentar roadmap en reunión", "completed": false}
  ]'::jsonb,
  'now',
  1
),
(
  'Dominio de métricas de producto',
  'Comprender y aplicar métricas clave para tomar decisiones data-driven',
  'Análisis',
  '[
    {"id": "1", "title": "Definir métricas North Star", "completed": false},
    {"id": "2", "title": "Configurar dashboard de KPIs", "completed": false},
    {"id": "3", "title": "Analizar funnel de conversión", "completed": false}
  ]'::jsonb,
  'now',
  2
),
(
  'Gestión de stakeholders',
  'Aprender a manejar expectativas y alinear diferentes equipos',
  'Liderazgo',
  '[
    {"id": "1", "title": "Mapear stakeholders", "completed": false},
    {"id": "2", "title": "Definir estrategia de comunicación", "completed": false},
    {"id": "3", "title": "Realizar sesiones 1-1", "completed": false}
  ]'::jsonb,
  'soon',
  3
),
(
  'Priorización estratégica',
  'Dominar frameworks de priorización como RICE, ICE y Value vs Effort',
  'Estrategia',
  '[
    {"id": "1", "title": "Estudiar frameworks", "completed": false},
    {"id": "2", "title": "Aplicar RICE a backlog", "completed": false},
    {"id": "3", "title": "Validar con stakeholders", "completed": false}
  ]'::jsonb,
  'soon',
  4
),
(
  'User Research avanzado',
  'Profundizar en técnicas de investigación de usuarios y validación de hipótesis',
  'Research',
  '[
    {"id": "1", "title": "Planificar estudio de usuarios", "completed": false},
    {"id": "2", "title": "Conducir 5 entrevistas", "completed": false},
    {"id": "3", "title": "Sintetizar insights", "completed": false}
  ]'::jsonb,
  'later',
  5
),
(
  'Visión de producto a largo plazo',
  'Desarrollar capacidad para crear y comunicar una visión estratégica del producto',
  'Estrategia',
  '[
    {"id": "1", "title": "Análisis de mercado", "completed": false},
    {"id": "2", "title": "Definir visión 3 años", "completed": false},
    {"id": "3", "title": "Crear roadmap estratégico", "completed": false}
  ]'::jsonb,
  'later',
  6
);