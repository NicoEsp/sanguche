import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { BlogPostArticle } from '@/components/blog/BlogPostArticle';
import { BlogPostList, type BlogListItem } from '@/components/blog/BlogPostList';
import { CoursePublicView } from '@/components/courses/CoursePublicView';
import type { BlogPost, CoursePublic } from '@/seo/contentSeo';
import EvaluacionProductManager from '@/pages/EvaluacionProductManager';

/**
 * Render a HTML estático, en build time, de las vistas cuyo contenido vive en
 * Supabase. Lo carga scripts/prerender-seo.ts con ssrLoadModule de Vite, que es
 * lo que resuelve el TSX y el alias `@/`.
 *
 * Sólo se prerenderizan componentes puros: nada de hooks ni de window. Por eso
 * no importa las páginas (BlogPost.tsx arrastra el cliente de Supabase, que
 * toca localStorage al importarse) ni AppLayout (su chrome depende de useAuth).
 * El único contexto que hace falta es el Router, por los <Link>.
 *
 * renderToStaticMarkup y no renderToString porque no hidratamos: el HTML es
 * para crawlers y para clientes sin JS, y no necesita los marcadores de React.
 */
const render = (location: string, children: ReactNode) =>
  renderToStaticMarkup(<StaticRouter location={location}>{children}</StaticRouter>);

export const renderBlogPost = (post: BlogPost) =>
  render(`/blog/${post.slug}`, <BlogPostArticle post={post} />);

export const renderBlogList = (posts: BlogListItem[]) =>
  render('/blog', <BlogPostList posts={posts} />);

export const renderCourse = (course: CoursePublic) =>
  render(`/cursos/${course.slug}`, <CoursePublicView course={course} />);

/**
 * Landing pública de la evaluación. No sale de Supabase, pero es un componente
 * puro igual que los otros, así que se prerenderiza con la misma maquinaria.
 */
export const renderEvaluacionLanding = () =>
  render('/evaluacion-product-manager', <EvaluacionProductManager />);
