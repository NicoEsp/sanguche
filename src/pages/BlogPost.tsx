import { useQuery } from '@tanstack/react-query';
import { useParams, Link, Navigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { supabase } from '@/integrations/supabase/client';
import { Seo } from '@/components/Seo';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';

const SITE_URL = 'https://productprepa.com';

// Cluster B2B: estos posts hablan del equipo, no de la carrera individual.
// El cierre los manda a /empresas en vez de a la autoevaluación.
const B2B_CLUSTER_SLUGS = [
  'como-saber-que-necesita-tu-equipo-de-producto-antes-de-invertir-en-el',
  'cuando-tu-equipo-entrega-pero-las-definiciones-siguen-siendo-tuyas',
  'cuando-producto-es-una-caja-negra-para-el-resto-de-la-empresa',
  'intentaron-scrum-tres-veces-y-nunca-funciono-cambiar-de-framework-no-va-a-resolverlo',
  'mandar-pms-a-cursos-sueltos-no-cambia-la-cultura-del-equipo',
  'que-pasa-cuando-un-equipo-de-producto-trabaja-un-temario-armado-para-sus-problemas',
];

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const { isAuthenticated } = useAuth();
  const { trackEvent } = useMixpanelTracking();

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-post-public', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, description, content, thumbnail_url, published_at, meta_title, meta_description, meta_keywords')
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });

  const articleSchema = post ? [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.meta_title || post.title,
      description: post.meta_description || post.description || '',
      url: `${SITE_URL}/blog/${post.slug}`,
      datePublished: post.published_at || undefined,
      dateModified: post.published_at || undefined,
      author: {
        '@type': 'Organization',
        name: 'ProductPrepa',
        url: SITE_URL,
      },
      publisher: {
        '@type': 'Organization',
        name: 'ProductPrepa',
        url: SITE_URL,
        logo: {
          '@type': 'ImageObject',
          url: `${SITE_URL}/favicon.png`,
        },
      },
      ...(post.thumbnail_url && { image: post.thumbnail_url }),
      inLanguage: 'es',
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: `${SITE_URL}/blog/${post.slug}` },
      ],
    },
  ] : undefined;

  if (isLoading) {
    return (
      <div className="container max-w-3xl py-12 space-y-6">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-4 w-48" />
        <div className="space-y-3 pt-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-4 w-full" />)}
        </div>
      </div>
    );
  }

  if (isError || !post) {
    return <Navigate to="/blog" replace />;
  }

  const isB2BPost = B2B_CLUSTER_SLUGS.includes(post.slug);

  return (
    <>
      <Seo
        title={post.meta_title || `${post.title} | ProductPrepa`}
        description={post.meta_description || post.description || ''}
        canonical={`/blog/${post.slug}`}
        keywords={post.meta_keywords || undefined}
        ogType="article"
        image={post.thumbnail_url || undefined}
        jsonLd={articleSchema}
        articlePublishedTime={post.published_at || undefined}
      />

      <div className="container max-w-3xl py-12 space-y-8">
        <Link
          to="/blog"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al blog
        </Link>

        <header className="space-y-4">
          {post.published_at && (
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CalendarDays className="h-3.5 w-3.5" />
              <time dateTime={post.published_at}>
                {format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: es })}
              </time>
            </div>
          )}
          <h1 className="text-3xl md:text-4xl font-bold text-foreground leading-tight">
            {post.title}
          </h1>
          {post.description && (
            <p className="text-lg text-muted-foreground leading-relaxed">
              {post.description}
            </p>
          )}
        </header>

        {post.thumbnail_url && (
          <div className="aspect-video rounded-xl overflow-hidden bg-muted">
            <img
              src={post.thumbnail_url}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <article
          className="prose prose-neutral dark:prose-invert max-w-none
            prose-headings:font-semibold prose-headings:text-foreground
            prose-p:text-foreground/80 prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-strong:text-foreground prose-strong:font-semibold
            prose-li:text-foreground/80"
        >
          <ReactMarkdown>{post.content}</ReactMarkdown>
        </article>

        <div className="border-t border-border pt-8">
          {isB2BPost ? (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-3 text-center">
              <h3 className="font-semibold text-foreground text-lg">
                ¿Esto le está pasando a tu equipo?
              </h3>
              <p className="text-muted-foreground text-sm">
                Armamos un programa de Producto a medida de los desafíos que tiene tu equipo hoy.
              </p>
              <Link
                to="/empresas"
                onClick={() => trackEvent('blog_b2b_cta_clicked', { cta_location: 'blog_post_footer', slug: post.slug })}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Ver el programa para equipos
              </Link>
            </div>
          ) : (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-3 text-center">
              <h3 className="font-semibold text-foreground text-lg">
                ¿Querés crecer como Product Builder?
              </h3>
              <p className="text-muted-foreground text-sm">
                Hacé la autoevaluación gratuita y descubrí qué habilidades necesitás desarrollar.
              </p>
              <Link
                to={isAuthenticated ? '/autoevaluacion' : '/auth'}
                onClick={() => trackEvent('blog_cta_clicked', { cta_location: 'blog_post_footer', slug: post.slug })}
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Evaluar mis habilidades gratis
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
