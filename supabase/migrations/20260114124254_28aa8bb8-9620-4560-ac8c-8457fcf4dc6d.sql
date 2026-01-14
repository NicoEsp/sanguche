-- Crear tabla para recursos descargables
CREATE TABLE public.downloadable_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'pdf' CHECK (type IN ('pdf', 'template', 'checklist', 'guide')),
  file_path text NOT NULL,
  bucket_name text DEFAULT 'downloads',
  thumbnail_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  is_featured boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Trigger para updated_at
CREATE TRIGGER update_downloadable_resources_updated_at
BEFORE UPDATE ON public.downloadable_resources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.downloadable_resources ENABLE ROW LEVEL SECURITY;

-- Política: Usuarios autenticados pueden ver recursos activos
CREATE POLICY "Authenticated users can view active downloadables"
ON public.downloadable_resources FOR SELECT
TO authenticated
USING (is_active = true);

-- Política: Admins pueden gestionar todos los recursos
CREATE POLICY "Admins can manage all downloadables"
ON public.downloadable_resources FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Crear bucket para downloads
INSERT INTO storage.buckets (id, name, public)
VALUES ('downloads', 'downloads', false)
ON CONFLICT (id) DO NOTHING;

-- Política: Usuarios autenticados pueden descargar archivos
CREATE POLICY "Authenticated users can download files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'downloads');

-- Política: Admins pueden subir archivos al bucket downloads
CREATE POLICY "Admins can upload to downloads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'downloads' AND public.is_admin());

-- Insertar el primer recurso: Preguntas de Producto
INSERT INTO public.downloadable_resources (slug, title, description, type, file_path, bucket_name, display_order, is_featured)
VALUES (
  'preguntas-de-producto',
  'Preguntas de Producto',
  'Un documento de disparadores para reflexionar sobre tu producto, tu equipo y cómo estás en tu rol actualmente. Contiene preguntas sobre Problema y Valor, Usuarios y Feedback, Métricas y Negocio, Equipo y Capacidades, y más.',
  'pdf',
  'preguntas-de-producto.pdf',
  'downloads',
  1,
  true
);