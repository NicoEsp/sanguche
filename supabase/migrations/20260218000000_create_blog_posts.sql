-- Create blog_posts table for the public blog
CREATE TABLE public.blog_posts (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          text UNIQUE NOT NULL,
  title         text NOT NULL,
  description   text,
  content       text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  published_at  timestamp with time zone,
  thumbnail_url text,
  meta_title    text,
  meta_description text,
  meta_keywords text,
  created_at    timestamp with time zone NOT NULL DEFAULT now(),
  updated_at    timestamp with time zone NOT NULL DEFAULT now()
);

-- Auto-update updated_at on row changes
CREATE TRIGGER update_blog_posts_updated_at
BEFORE UPDATE ON public.blog_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read published posts
CREATE POLICY "Public can view published blog posts"
ON public.blog_posts FOR SELECT
TO anon, authenticated
USING (status = 'published');

-- Admins can do everything
CREATE POLICY "Admins can manage all blog posts"
ON public.blog_posts FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Seed post 1
INSERT INTO public.blog_posts (slug, title, description, content, status, published_at, meta_title, meta_description, meta_keywords)
VALUES (
  'como-prepararse-para-entrevistas-pm',
  'Cómo prepararse para entrevistas de Product Manager',
  'Una guía práctica con los pasos concretos para preparar entrevistas de PM en empresas de tecnología.',
  E'## Por qué las entrevistas de PM son diferentes\n\nLas entrevistas de Product Manager no son como las de ingeniería o diseño. No hay una respuesta "correcta" — lo que buscan los entrevistadores es cómo pensás, cómo priorizás y cómo comunicás.\n\n## Los tres pilares de preparación\n\n### 1. Practica el framework de producto\n\nLa mayoría de las preguntas de diseño de producto siguen una estructura:\n\n- ¿Para quién lo diseñamos?\n- ¿Cuál es el problema a resolver?\n- ¿Cuáles son las métricas de éxito?\n- ¿Qué soluciones posibles existen?\n- ¿Cuál priorizamos y por qué?\n\n### 2. Conocé bien tus casos de uso\n\nPrepará 3 a 5 historias de tu experiencia profesional que puedas adaptar a distintos tipos de preguntas (conflictos, impacto, liderazgo, fracasos).\n\n### 3. Estudiá el producto de la empresa\n\nUsá el producto antes de la entrevista. Identificá tres cosas que mejorarías y por qué. Tené criterio propio.\n\n## Recursos adicionales\n\nEn ProductPrepa tenés acceso a una [autoevaluación gratuita](/autoevaluacion) para identificar qué habilidades de PM necesitás reforzar antes de tu próxima entrevista.',
  'published',
  now(),
  'Cómo prepararse para entrevistas de Product Manager | ProductPrepa',
  'Guía práctica con pasos concretos para preparar entrevistas de PM: frameworks, historias profesionales y cómo estudiar el producto de la empresa.',
  'entrevistas product manager, preparación PM, entrevista PM, cómo ser PM'
);

-- Seed post 2
INSERT INTO public.blog_posts (slug, title, description, content, status, published_at, meta_title, meta_description, meta_keywords)
VALUES (
  'diferencia-entre-pm-y-po',
  'Cuál es la diferencia entre Product Manager y Product Owner',
  'Muchos confunden los roles de PM y PO. Acá te explicamos cuándo son lo mismo y cuándo son completamente distintos.',
  E'## El debate de siempre\n\nEn foros y redes de producto hay un debate eterno: ¿Product Manager y Product Owner son lo mismo? La respuesta honesta es: **depende del contexto**.\n\n## Product Owner: el origen ágil\n\nEl rol de Product Owner nace en el framework Scrum. Su función principal es gestionar el backlog del equipo: escribir historias de usuario, definir criterios de aceptación y priorizar el trabajo de desarrollo.\n\nEl PO es el nexo entre los stakeholders y el equipo técnico.\n\n## Product Manager: el alcance estratégico\n\nEl Product Manager tiene un alcance más amplio. Además de las responsabilidades del PO, el PM:\n\n- Define la visión y estrategia del producto\n- Habla directamente con usuarios y clientes\n- Trabaja con marketing, ventas y liderazgo\n- Define métricas de negocio y las monitorea\n\n## ¿Cuándo son lo mismo?\n\nEn startups y empresas medianas, una misma persona suele hacer ambos roles. En empresas más grandes y maduras, los roles están separados.\n\n## ¿Qué rol necesitás desarrollar?\n\nSi estás definiendo tu carrera, hacé nuestra [autoevaluación gratuita](/autoevaluacion) para entender en qué habilidades estás más fuerte y qué necesitás desarrollar.',
  'published',
  now(),
  'Diferencia entre Product Manager y Product Owner | ProductPrepa',
  'Explicación clara de cuándo PM y PO son el mismo rol y cuándo son distintos. Guía para entender qué necesitás desarrollar en tu carrera de producto.',
  'product manager vs product owner, diferencia PM PO, rol product manager, rol product owner'
);
