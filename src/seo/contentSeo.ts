/**
 * Meta tags y structured data del contenido que vive en Supabase.
 *
 * Lo consumen dos caminos que tienen que dar exactamente lo mismo:
 *   - build: scripts/prerender-seo.ts los escribe en el HTML servido
 *   - runtime: BlogPost.tsx / CourseDetail.tsx se los pasan a <Seo> al navegar
 *
 * Si cada lado armara su propio objeto, el HTML que ve Googlebot y el que ve
 * alguien navegando con el router terminarían divergiendo sin que nadie se
 * entere.
 */

export const SITE_URL = 'https://productprepa.com';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-preview-v3.png`;
const DEFAULT_OG_IMAGE_ALT = 'ProductPrepa - Plataforma para crecer en Producto';

const ORGANIZATION = { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL };

export interface ContentSeo {
  title: string;
  description: string;
  canonical: string;
  image: string;
  imageAlt: string;
  ogType: string;
  keywords?: string;
  publishedTime?: string;
  jsonLd: object[];
}

const breadcrumb = (trail: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: trail.map((step, i) => ({
    '@type': 'ListItem',
    position: i + 1,
    name: step.name,
    item: step.url,
  })),
});

// ---------------------------------------------------------------- artículos

export interface BlogPost {
  id?: string;
  slug: string;
  title: string;
  description: string | null;
  content: string;
  thumbnail_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
}

export const BLOG_POST_COLUMNS =
  'id, slug, title, description, content, thumbnail_url, published_at, updated_at, meta_title, meta_description, meta_keywords';

export function blogPostSeo(post: BlogPost): ContentSeo {
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const title = post.meta_title || `${post.title} | ProductPrepa`;
  const description = post.meta_description || post.description || '';
  // Sin fallback, el JSON-LD de Article saldría sin `image` (hoy ningún
  // artículo tiene thumbnail cargado) y Google lo marca como incompleto.
  const image = post.thumbnail_url || DEFAULT_OG_IMAGE;

  return {
    title,
    description,
    canonical,
    image,
    imageAlt: post.thumbnail_url ? post.title : DEFAULT_OG_IMAGE_ALT,
    ogType: 'article',
    keywords: post.meta_keywords || undefined,
    publishedTime: post.published_at || undefined,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        ...(description && { description }),
        url: canonical,
        mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
        ...(post.published_at && { datePublished: post.published_at }),
        // Antes dateModified copiaba a datePublished, así que editar un
        // artículo era invisible para Google. updated_at lo mantiene el trigger.
        ...((post.updated_at || post.published_at) && {
          dateModified: post.updated_at || post.published_at,
        }),
        author: ORGANIZATION,
        publisher: {
          ...ORGANIZATION,
          logo: { '@type': 'ImageObject', url: `${SITE_URL}/assets/sanguche.png` },
        },
        image,
        inLanguage: 'es',
        isAccessibleForFree: true,
      },
      breadcrumb([
        { name: 'Inicio', url: SITE_URL },
        { name: 'Blog', url: `${SITE_URL}/blog` },
        { name: post.title, url: canonical },
      ]),
    ],
  };
}

// ------------------------------------------------------------------ cursos

export interface CourseLesson {
  id: string;
  title: string;
  duration_minutes: number | null;
}

export interface CoursePublic {
  id?: string;
  slug: string;
  title: string;
  description: string | null;
  outcome: string | null;
  thumbnail_url: string | null;
  duration_minutes: number | null;
  updated_at?: string | null;
  lessons: CourseLesson[];
}

export function courseSeo(course: CoursePublic): ContentSeo {
  const canonical = `${SITE_URL}/cursos/${course.slug}`;
  const description = course.description || '';

  return {
    title: `${course.title} - ProductPrepa`,
    description,
    canonical,
    image: course.thumbnail_url || DEFAULT_OG_IMAGE,
    imageAlt: course.thumbnail_url ? course.title : DEFAULT_OG_IMAGE_ALT,
    ogType: 'course',
    keywords: `curso ${course.slug}, producto, formación PM, aprender producto, product builder`,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Course',
        name: course.title,
        ...(description && { description }),
        provider: { '@type': 'Organization', name: 'ProductPrepa', sameAs: SITE_URL },
        hasCourseInstance: {
          '@type': 'CourseInstance',
          courseMode: 'online',
          courseWorkload: `PT${course.duration_minutes || 30}M`,
        },
        ...(course.thumbnail_url && { image: course.thumbnail_url }),
        url: canonical,
      },
      breadcrumb([
        { name: 'Inicio', url: SITE_URL },
        { name: 'Cursos', url: `${SITE_URL}/cursos-info` },
        { name: course.title, url: canonical },
      ]),
    ],
  };
}
