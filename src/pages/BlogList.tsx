import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Seo } from '@/components/Seo';
import { Skeleton } from '@/components/ui/skeleton';
import { CalendarDays, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function BlogList() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, description, thumbnail_url, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <>
      <Seo />

      <div className="container max-w-4xl py-12 space-y-10">
        <div className="space-y-3">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Blog de Producto
          </h1>
          <p className="text-lg text-muted-foreground">
            Artículos prácticos sobre Product Management, carrera y habilidades de producto.
          </p>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3 pb-8 border-b border-border last:border-0">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-7 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            ))}
          </div>
        ) : posts?.length === 0 ? (
          <p className="text-muted-foreground">No hay artículos publicados aún.</p>
        ) : (
          <div className="space-y-8">
            {posts?.map((post) => (
              <article
                key={post.id}
                className="group border-b border-border pb-8 last:border-0 last:pb-0"
              >
                <Link to={`/blog/${post.slug}`} className="block space-y-3">
                  {post.published_at && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      <time dateTime={post.published_at}>
                        {format(new Date(post.published_at), "d 'de' MMMM, yyyy", { locale: es })}
                      </time>
                    </div>
                  )}
                  <h2 className="text-xl md:text-2xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  {post.description && (
                    <p className="text-muted-foreground leading-relaxed">
                      {post.description}
                    </p>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                    Leer artículo
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
