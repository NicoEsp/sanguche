import fs from 'fs';
import path from 'path';
import { SEO_ROUTES, type SeoRouteData } from '../src/seo/routes';
import {
  blogPostSeo,
  courseSeo,
  DEFAULT_OG_IMAGE,
  SITE_URL,
  type ContentSeo,
} from '../src/seo/contentSeo';
import { fetchContent } from './prerender/content';
import { createSsrLoader } from './prerender/ssrLoader';
import { applySeo, assertSeo, injectAppHtml } from './prerender/html';

const DEFAULT_IMAGE_ALT = 'ProductPrepa - Plataforma para crecer en Producto';

/**
 * Rutas detrás de ProtectedRoute: para un visitante anónimo redirigen a /auth,
 * o sea que no tienen contenido que indexar. Se sirven con noindex.
 */
const PROTECTED_ROUTES = [
  '/autoevaluacion',
  '/mejoras',
  '/mentoria',
  '/progreso',
  '/perfil',
  '/cursos',
  // /admin ya está bloqueada en robots.txt; el noindex es cinturón y tiradores
  // por si alguna vez se llega a la URL desde un link.
  '/admin',
];

/** Rutas que renderizan la misma página que otra y canonicalizan ahí. */
const CANONICAL_OVERRIDES: Record<string, string> = { '/descargables': '/preguntas' };

/**
 * Prerender de las rutas públicas, después del build de Vite.
 *
 * El problema: la app es una SPA, así que el HTML servido era siempre el mismo
 * shell con el #root vacío. Los artículos del blog y los cursos viven en
 * Supabase y se pedían desde el cliente, o sea que un crawler que no ejecuta JS
 * veía una página en blanco con el canonical de la home, y todos los artículos
 * parecían duplicados de "/".
 *
 * Ahora, para el contenido que vive en Supabase (/blog, /blog/:slug y
 * /cursos/:slug) se renderiza el componente real a HTML estático y se inyecta
 * en el #root, con meta y JSON-LD propios. El resto de las rutas sigue como
 * antes: sólo se les reescriben los meta tags.
 *
 * Sólo se prerenderizan componentes puros (ver scripts/prerender/render.tsx),
 * así que no hace falta correr AuthProvider ni shimear browser globals en el
 * build. Y como no hidratamos, tampoco hay riesgo de mismatch.
 *
 * Vercel resuelve el filesystem antes que los rewrites, así que
 * dist/blog/<slug>/index.html gana sobre el catch-all de vercel.json.
 */
export const prerenderSeoPlugin = () => ({
  name: 'prerender-seo',
  apply: 'build' as const,
  async closeBundle() {
    const root = process.cwd();
    const distDir = path.resolve(root, 'dist');
    const templatePath = path.join(distDir, 'index.html');

    if (!fs.existsSync(templatePath)) {
      console.warn('[prerender-seo] dist/index.html not found, skipping');
      return;
    }
    const template = fs.readFileSync(templatePath, 'utf-8');
    const builtAt = Date.now();

    const { posts, courses } = await fetchContent();
    const loader = await createSsrLoader(root);

    const write = (route: string, html: string) => {
      const outDir = route === '/' ? distDir : path.join(distDir, route.replace(/^\//, ''));
      // Los slugs salen de la base. Sólo un admin puede escribirlos y las dos
      // tablas los declaran UNIQUE NOT NULL, sin validar la forma: un valor
      // como ".." pisaría dist/index.html y "../../x" escribiría fuera de dist.
      // Chequeo de contención antes de tocar el filesystem.
      const relative = path.relative(distDir, outDir);
      if (relative.startsWith('..') || path.isAbsolute(relative)) {
        throw new Error(`[prerender] La ruta ${route} escaparía de dist/, no se escribe.`);
      }
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
    };

    /** Un slug tiene que ser un único segmento de URL, sin travesías ni barras. */
    const safeSlug = (slug: string, kind: string) => {
      if (!slug || slug.includes('/') || slug.includes('\\') || slug === '.' || slug === '..') {
        throw new Error(`[prerender] Slug inválido en ${kind}: ${JSON.stringify(slug)}`);
      }
      return slug;
    };

    /** Escribe una ruta con contenido real dentro del #root y la verifica. */
    const writeContent = (route: string, seo: ContentSeo, body: string, seed?: object) => {
      const html = injectAppHtml(
        applySeo(template, seo, 'index, follow'),
        body,
        seed ? { builtAt, ...seed } : undefined
      );
      assertSeo(html, route, seo);
      write(route, html);
    };

    try {
      const render = await loader.load<typeof import('./prerender/render')>(
        '/scripts/prerender/render.tsx'
      );

      // ---- Rutas con meta propios pero sin contenido en la respuesta -------
      // Es lo que este plugin ya hacía. La home queda en dist/index.html, que
      // además es el shell del catch-all de vercel.json.
      for (const [route, data] of Object.entries(SEO_ROUTES)) {
        const seo = routeSeo(data, CANONICAL_OVERRIDES[route]);
        const noindex = PROTECTED_ROUTES.includes(route) ? 'noindex, nofollow' : undefined;
        write(route, applySeo(template, seo, noindex));
      }

      // Protegidas sin entrada en SEO_ROUTES: alcanza con el noindex.
      for (const route of PROTECTED_ROUTES.filter((r) => !SEO_ROUTES[r])) {
        write(route, applySeo(template, blankSeo(route), 'noindex, nofollow'));
      }

      // La landing de la evaluación no sale de Supabase, pero es un componente
      // puro, así que también se sirve con el contenido en el HTML.
      writeContent(
        '/evaluacion-product-manager',
        routeSeo(SEO_ROUTES['/evaluacion-product-manager']),
        render.renderEvaluacionLanding(),
        undefined
      );

      // ---- Contenido de Supabase, con el HTML completo en la respuesta -----
      const listItems = posts.map(({ id, slug, title, description, published_at }) => ({
        id,
        slug,
        title,
        description,
        published_at,
      }));

      writeContent('/blog', routeSeo(SEO_ROUTES['/blog']), render.renderBlogList(listItems), {
        posts: listItems,
      });

      for (const post of posts) {
        safeSlug(post.slug, 'blog_posts');
        writeContent(`/blog/${post.slug}`, blogPostSeo(post), render.renderBlogPost(post), { post });
      }

      for (const course of courses) {
        safeSlug(course.slug, 'courses');
        writeContent(`/cursos/${course.slug}`, courseSeo(course), render.renderCourse(course), {
          course,
        });
      }

      console.log(
        `✓ Prerender: ${posts.length} artículos y ${courses.length} cursos con contenido completo, ` +
          `${Object.keys(SEO_ROUTES).length} rutas con meta propios`
      );
    } finally {
      await loader.close();
    }
  },
});

/** Adapta una entrada de SEO_ROUTES a la forma que usa applySeo. */
function routeSeo(data: SeoRouteData, canonicalOverride?: string): ContentSeo {
  const jsonLd = data.jsonLd ? (Array.isArray(data.jsonLd) ? data.jsonLd : [data.jsonLd]) : [];
  return {
    title: data.title,
    description: data.description,
    canonical: canonicalOverride ? `${SITE_URL}${canonicalOverride}` : data.canonical,
    image: data.image || DEFAULT_OG_IMAGE,
    imageAlt: data.imageAlt || DEFAULT_IMAGE_ALT,
    ogType: data.ogType || 'website',
    keywords: data.keywords,
    jsonLd,
  };
}

/** Para rutas protegidas sin entrada propia: canonical correcto y nada más. */
const blankSeo = (route: string): ContentSeo => ({
  title: 'ProductPrepa',
  description: '',
  canonical: `${SITE_URL}${route}`,
  image: DEFAULT_OG_IMAGE,
  imageAlt: DEFAULT_IMAGE_ALT,
  ogType: 'website',
  jsonLd: [],
});
