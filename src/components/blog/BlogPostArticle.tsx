import ReactMarkdown from 'react-markdown';
import { Link } from 'react-router-dom';
import { ArrowLeft, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import type { BlogPost } from '@/seo/contentSeo';

/**
 * Vista del artículo, sin hooks ni acceso a browser globals.
 *
 * Es a propósito una función pura de `post`: la ejecuta tanto el cliente (desde
 * BlogPost.tsx) como el build (desde scripts/prerender/render.tsx vía
 * renderToStaticMarkup, donde no existen window ni document). Cualquier hook o
 * referencia a window acá rompe el prerender, así que si necesitás estado,
 * ponelo en la página que la envuelve, no acá.
 *
 * El único requisito del entorno es un Router en contexto, por los <Link>:
 * BrowserRouter en el cliente, StaticRouter en el build.
 *
 * El <h1> del título vive acá y es el único de la página: los h1 del markdown
 * se remapean a h2 más abajo, y assertSeo lo verifica en el build.
 */
export function BlogPostArticle({ post }: { post: BlogPost }) {
  return (
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
        {/* Si el markdown del artículo trae un "# Título", saldría un segundo
            h1 y assertSeo cortaría el build. Los bajamos a h2 para que el único
            h1 siga siendo el título del post. */}
        <ReactMarkdown components={{ h1: 'h2' }}>{post.content}</ReactMarkdown>
      </article>

      <div className="border-t border-border pt-8">
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-6 space-y-3 text-center">
          <h2 className="font-semibold text-foreground text-lg">
            ¿Querés crecer como Product Builder?
          </h2>
          <p className="text-muted-foreground text-sm">
            Hacé la autoevaluación gratuita y descubrí qué habilidades necesitás desarrollar.
          </p>
          <Link
            to="/autoevaluacion"
            className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground px-6 py-2.5 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Evaluar mis habilidades gratis
          </Link>
        </div>
      </div>
    </div>
  );
}
