import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Seo } from '@/components/Seo';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogPostList, type BlogListItem } from '@/components/blog/BlogPostList';
import { prerenderedPosts } from '@/seo/prerenderedData';

export default function BlogList() {
  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts-public'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select('id, slug, title, description, published_at')
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      if (error) throw error;
      return data as BlogListItem[];
    },
    // El listado ya viene en el HTML del build; ver src/seo/prerenderedData.ts.
    initialData: prerenderedPosts(),
  });

  return (
    <>
      <Seo />

      {isLoading ? (
        <div className="container max-w-4xl py-12 space-y-10">
          <div className="space-y-3">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Blog de Producto
            </h1>
            <p className="text-lg text-muted-foreground">
              Artículos prácticos sobre Producto, carrera y habilidades para builders.
            </p>
          </div>
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
        </div>
      ) : (
        <BlogPostList posts={posts ?? []} />
      )}
    </>
  );
}
