import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Seo } from '@/components/Seo';
import { BlogPostList, type BlogListItem } from '@/components/blog/BlogPostList';
import { prerenderedAt, prerenderedPosts } from '@/seo/prerenderedData';

export default function BlogList() {
  const prerendered = prerenderedPosts();

  const { data: posts, isLoading, isError } = useQuery({
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
    initialData: prerendered,
    // Fechado en el build, no ahora: con refetchOnMount la query revalida
    // contra Supabase en segundo plano por si algo cambió después del deploy.
    initialDataUpdatedAt: prerendered ? prerenderedAt() : undefined,
    refetchOnMount: prerendered ? true : undefined,
  });

  return (
    <>
      <Seo />
      <BlogPostList
        posts={posts ?? []}
        state={isLoading ? 'loading' : isError ? 'error' : undefined}
      />
    </>
  );
}
