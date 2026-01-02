-- 1. Tabla de notas por lección
CREATE TABLE lesson_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES course_lessons(id) ON DELETE CASCADE,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);

ALTER TABLE lesson_notes ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para notas
CREATE POLICY "lesson_notes_deny_anonymous" ON lesson_notes
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view own notes" ON lesson_notes
  FOR SELECT USING (user_id = get_profile_id_for_auth());

CREATE POLICY "Users can insert own notes" ON lesson_notes
  FOR INSERT WITH CHECK (user_id = get_profile_id_for_auth());

CREATE POLICY "Users can update own notes" ON lesson_notes
  FOR UPDATE USING (user_id = get_profile_id_for_auth());

CREATE POLICY "Users can delete own notes" ON lesson_notes
  FOR DELETE USING (user_id = get_profile_id_for_auth());

CREATE POLICY "Admins can view all notes" ON lesson_notes
  FOR SELECT USING (is_admin());

-- Trigger para updated_at
CREATE TRIGGER update_lesson_notes_updated_at
  BEFORE UPDATE ON lesson_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Campo Founder en profiles
ALTER TABLE profiles ADD COLUMN is_founder BOOLEAN DEFAULT false;

-- 3. Marcar Founders iniciales (usuarios que pagaron Premium antes del 31/12/2025)
UPDATE profiles p
SET is_founder = true
WHERE p.id IN (
  SELECT us.user_id 
  FROM user_subscriptions us
  WHERE us.plan IN ('premium', 'repremium', 'curso_estrategia', 'cursos_all')
  AND us.created_at <= '2025-12-31T23:59:59Z'
);