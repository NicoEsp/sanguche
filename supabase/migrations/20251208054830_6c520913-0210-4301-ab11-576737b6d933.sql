-- Crear tabla para recursos del Starter Pack
CREATE TABLE public.starterpack_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('article', 'pdf', 'video', 'template', 'checklist')),
  audience text NOT NULL CHECK (audience IN ('build', 'lead', 'both')),
  access_type text NOT NULL CHECK (access_type IN ('public', 'requires_account', 'premium')),
  file_path text,
  bucket_name text DEFAULT 'resources',
  duration_estimate text,
  level text DEFAULT 'beginner' CHECK (level IN ('beginner', 'intermediate', 'advanced')),
  step_order integer,
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_starterpack_resources_updated_at
  BEFORE UPDATE ON public.starterpack_resources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.starterpack_resources ENABLE ROW LEVEL SECURITY;

-- Política: Cualquiera puede ver recursos activos (metadata pública)
CREATE POLICY "Anyone can view active starterpack resources"
  ON public.starterpack_resources FOR SELECT
  USING (is_active = true);

-- Política: Solo admins pueden gestionar (INSERT, UPDATE, DELETE)
CREATE POLICY "Admins can manage starterpack resources"
  ON public.starterpack_resources FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());