import type { ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { BlogPostArticle } from '@/components/blog/BlogPostArticle';
import { BlogPostList, type BlogListItem } from '@/components/blog/BlogPostList';
import { CoursePublicView } from '@/components/courses/CoursePublicView';
import { CursosInfoSeoContent } from '@/components/courses/CursosInfoSeoContent';
import type { BlogPost, CoursePublic } from '@/seo/contentSeo';
import EvaluacionProductManager from '@/pages/EvaluacionProductManager';
import { PlanesSeoContent } from '@/components/planes/PlanesSeoContent';
import { HomeHero, HomeUpgradeTeaser } from '@/components/landing/HomeHero';
import { HowItWorks } from '@/components/sections/HowItWorks';
import { WhyProductPrepa } from '@/components/sections/WhyProductPrepa';
import { PlatformPreview } from '@/components/landing/PlatformPreview';
import { LandingFaq } from '@/components/landing/LandingFaq';
import type { PlanPricing, PricingKey } from '@/constants/planesContent';
import { SoyDevContent } from '@/components/landing/SoyDevContent';
import { EmpresasContent } from '@/components/landing/EmpresasContent';
import {
  DescargablesSeoContent,
  type DownloadablePublic,
} from '@/components/downloads/DescargablesSeoContent';

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

/**
 * Home. Se compone acá con las secciones que ya eran puras, en el mismo orden
 * que Index.tsx. Quedan afuera SocialProofStrip y SocialProofBlock (dependen de
 * una query y de mixpanel) y StickyMobileCTA (depende de la sesión): son
 * chrome, no el contenido que hay que poder leer sin JS.
 */
export const renderHome = () =>
  render(
    '/',
    <main>
      <HomeHero ctaHref="/auth" />
      <HowItWorks />
      <WhyProductPrepa />
      <PlatformPreview />
      <HomeUpgradeTeaser />
      <LandingFaq />
    </main>
  );

export const renderPlanes = (prices: Record<PricingKey, PlanPricing>) =>
  render('/planes', <PlanesSeoContent prices={prices} />);

export const renderCursosInfo = (courses: CoursePublic[], prices: Record<PricingKey, PlanPricing>) =>
  render('/cursos-info', <CursosInfoSeoContent courses={courses} prices={prices} />);

/**
 * /soy-dev. Sin sesión, el CTA de cada evaluación pasa por /auth, que es
 * exactamente lo que ve un visitante anónimo.
 */
export const renderSoyDev = () =>
  render(
    '/soy-dev',
    <SoyDevContent
      assessmentLink={(tipo) => ({
        to: '/auth',
        state: { from: { pathname: `/autoevaluacion?tipo=${tipo}` } },
      })}
      onAssessmentClick={() => {}}
    />
  );

/**
 * /empresas. El checkout depende de useAuth, así que en el HTML estático va en
 * su lugar un link a la sección de planes.
 */
export const renderEmpresas = () =>
  render(
    '/empresas',
    <EmpresasContent
      checkoutSlot={
        <a href="/planes?plan=productprepa-business" className="underline">
          Reservar mi cupo B2B
        </a>
      }
    />
  );

export const renderDescargables = (resources: DownloadablePublic[]) =>
  render('/descargables', <DescargablesSeoContent resources={resources} />);
