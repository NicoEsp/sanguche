import { useQuery } from '@tanstack/react-query';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Seo } from '@/components/Seo';
import { Skeleton } from '@/components/ui/skeleton';
import { BlogPostArticle } from '@/components/blog/BlogPostArticle';
import { BLOG_POST_COLUMNS, blogPostSeo, type BlogPost as Post } from '@/seo/contentSeo';
import { prerenderedAt, prerenderedPost } from '@/seo/prerenderedData';

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const prerendered = prerenderedPost(slug);

  const { data: post, isLoading, isError } = useQuery({
    queryKey: ['blog-post-public', slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('blog_posts')
        .select(BLOG_POST_COLUMNS)
        .eq('slug', slug!)
        .eq('status', 'published')
        .single();
      if (error) throw error;
      return data as Post;
    },
    enabled: !!slug,
    // El build ya dejó este artículo en el HTML: si es el mismo slug, el primer
    // render del cliente es idéntico al HTML servido, sin skeleton intermedio.
    initialData: prerendered,
    // Fechado en el build, no ahora, y revalidado al montar, igual que en
    // BlogList: sin esto, una edición posterior al deploy no se vería en toda
    // la sesión (refetchOnMount es false a nivel global).
    initialDataUpdatedAt: prerendered ? prerenderedAt() : undefined,
    refetchOnMount: prerendered ? true : undefined,
  });

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

  const seo = blogPostSeo(post);

  return (
    <>
      {/* Los mismos valores que el build escribió en el <head>. Acá sólo
          importan al navegar client-side entre artículos. */}
      <Seo
        title={seo.title}
        description={seo.description}
        canonical={seo.canonical}
        keywords={seo.keywords}
        ogType={seo.ogType}
        image={seo.image}
        imageAlt={seo.imageAlt}
        jsonLd={seo.jsonLd}
        articlePublishedTime={seo.publishedTime}
      />
      <BlogPostArticle post={post} />
    </>
  );
}
