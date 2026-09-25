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
import { fetchPricing } from './prerender/pricing';
import { planesJsonLd } from '../src/constants/planesContent';

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

/**
 * Página que renderiza cada ruta en el SPA (ver src/routes.ts). Con esto el
 * HTML de la ruta pide el chunk de su página junto con el bundle principal, en
 * vez de descubrirlo recién cuando el bundle ejecuta.
 */
const PAGE_SOURCES: Record<string, string> = {
  '/': 'src/pages/Index.tsx',
  '/planes': 'src/pages/Planes.tsx',
  '/cursos-info': 'src/pages/CursosInfo.tsx',
  '/soy-dev': 'src/pages/SoyDev.tsx',
  '/empresas': 'src/pages/Empresas.tsx',
  '/descargables': 'src/pages/Descargables.tsx',
  '/evaluacion-product-manager': 'src/pages/EvaluacionProductManager.tsx',
  '/blog': 'src/pages/BlogList.tsx',
  '/blog/:slug': 'src/pages/BlogPost.tsx',
  '/cursos/:slug': 'src/pages/CourseDetail.tsx',
  '/autoevaluacion': 'src/pages/Assessment.tsx',
  '/mejoras': 'src/pages/SkillGaps.tsx',
  '/mentoria': 'src/pages/Recommendations.tsx',
  '/progreso': 'src/pages/Progress.tsx',
  '/perfil': 'src/pages/Profile.tsx',
  '/cursos': 'src/pages/Courses.tsx',
};

interface ChunkInfo {
  fileName: string;
  imports: string[];
  isEntry: boolean;
  facadeModuleId: string | null;
  moduleIds: string[];
}

// Estado del build en curso: lo completan configResolved y writeBundle, y lo
// lee closeBundle.
let root = process.cwd();
let distDir = path.resolve(root, 'dist');
let base = '/';
const chunks: ChunkInfo[] = [];

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
  configResolved(config: { root: string; base: string; build: { outDir: string } }) {
    root = config.root;
    distDir = path.resolve(config.root, config.build.outDir);
    base = config.base;
  },
  writeBundle(_options: unknown, bundle: Record<string, { type: string } & Partial<ChunkInfo>>) {
    chunks.length = 0;
    for (const item of Object.values(bundle)) {
      if (item.type !== 'chunk') continue;
      chunks.push({
        fileName: item.fileName!,
        imports: item.imports ?? [],
        isEntry: item.isEntry ?? false,
        facadeModuleId: item.facadeModuleId ?? null,
        moduleIds: item.moduleIds ?? [],
      });
    }
  },
  async closeBundle() {
    const templatePath = path.join(distDir, 'index.html');

    if (!fs.existsSync(templatePath)) {
      console.warn('[prerender-seo] dist/index.html not found, skipping');
      return;
    }
    const template = fs.readFileSync(templatePath, 'utf-8');
    const builtAt = Date.now();

    const { posts, courses, downloadables } = await fetchContent();
    const prices = await fetchPricing();

    const loader = await createSsrLoader(root);

    /**
     * Precarga del chunk de la página de una ruta y de los chunks que importa,
     * salvo el principal (ya lo pide el <script> del shell). Corta el build si
     * la página no tiene chunk: quiere decir que se renombró y PAGE_SOURCES
     * quedó desactualizado.
     *
     * No van como <link rel="modulepreload"> en el head: el navegador los pide
     * junto con el CSS, que bloquea el primer render, y le sacan ancho de banda
     * (con red móvil el FCP empeoraba ~150 ms; fetchpriority="low" no cambia
     * nada en modulepreload). Un script inline al final del body espera a que
     * cargue el CSS antes de ejecutarse, así que recién ahí agrega los links:
     * no compiten con el primer render y llegan igual antes que si se
     * descubrieran al ejecutar el bundle.
     */
    const byFile = new Map(chunks.map((c) => [c.fileName, c]));
    const modulePreloads = (pattern: string) => {
      const source = PAGE_SOURCES[pattern];
      if (!source) return '';
      // Normalmente la página es la fachada de su chunk. Si el chunk además
      // exporta algo que usa otro chunk (un import dinámico desde la página),
      // Rollup no le asigna fachada: entonces se busca por los módulos.
      const isSource = (id: string | null) => !!id && path.relative(root, id) === source;
      const page =
        chunks.find((c) => isSource(c.facadeModuleId)) ??
        chunks.find((c) => c.moduleIds.some(isSource));
      if (!page) {
        throw new Error(`[prerender] No hay chunk para ${source} (ruta ${pattern}). ¿Se renombró la página?`);
      }
      const files = new Set<string>();
      const visit = (file: string) => {
        const chunk = byFile.get(file);
        if (!chunk || chunk.isEntry || files.has(file)) return;
        files.add(file);
        chunk.imports.forEach(visit);
      };
      visit(page.fileName);
      const hrefs = JSON.stringify([...files].map((file) => `${base}${file}`));
      return (
        `<script>${hrefs}.forEach(function (h) { var l = document.createElement("link"); ` +
        `l.rel = "modulepreload"; l.crossOrigin = ""; l.href = h; document.head.appendChild(l); });</script>`
      );
    };
    const withPreloads = (html: string, pattern: string) => {
      const script = modulePreloads(pattern);
      return script ? html.replace('</body>', `    ${script}\n  </body>`) : html;
    };

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
    const writeContent = (
      route: string,
      seo: ContentSeo,
      body: string,
      seed?: object,
      pattern: string = route
    ) => {
      const html = injectAppHtml(
        withPreloads(applySeo(template, seo, 'index, follow'), pattern),
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

      // Shell del catch-all de vercel.json. Ese rol lo cumplía dist/index.html,
      // pero ahora la home trae su contenido dentro del #root: sin un shell
      // aparte, cualquier URL desconocida le serviría el HTML de la home a un
      // crawler que no ejecuta JS. Mantiene los meta de la home, que es lo que
      // esas rutas venían recibiendo.
      fs.writeFileSync(
        path.join(distDir, 'app.html'),
        applySeo(template, routeSeo(SEO_ROUTES['/']))
      );

      // ---- Rutas con meta propios pero sin contenido en la respuesta -------
      // Es lo que este plugin ya hacía.
      for (const [route, data] of Object.entries(SEO_ROUTES)) {
        const seo = routeSeo(data);
        const noindex = PROTECTED_ROUTES.includes(route) ? 'noindex, nofollow' : undefined;
        write(route, withPreloads(applySeo(template, seo, noindex), route));
      }

      // Protegidas sin entrada en SEO_ROUTES: alcanza con el noindex.
      for (const route of PROTECTED_ROUTES.filter((r) => !SEO_ROUTES[r])) {
        write(route, withPreloads(applySeo(template, blankSeo(route), 'noindex, nofollow'), route));
      }

      // ---- Rutas cuyo contenido no sale de Supabase --------------------
      // Son componentes puros, así que se sirven con el contenido dentro del
      // #root igual que el blog. Sin esto, el HTML de /planes no tenía una sola
      // mención de un precio ni de la palabra "Premium": todo lo pinta React en
      // runtime, y los fetchers de los asistentes no ejecutan JS.
      writeContent(
        '/evaluacion-product-manager',
        routeSeo(SEO_ROUTES['/evaluacion-product-manager']),
        render.renderEvaluacionLanding(),
        undefined
      );

      writeContent('/', routeSeo(SEO_ROUTES['/']), render.renderHome(), undefined);

      writeContent(
        '/planes',
        // El JSON-LD de Offer sale del mismo helper que usa la página en
        // runtime, con los precios que se trajeron recién.
        { ...routeSeo(SEO_ROUTES['/planes']), jsonLd: planesJsonLd(prices) },
        render.renderPlanes(prices),
        // Semilla para usePricing: sin ella la página arrancaba con "..." en
        // lugar del precio que el HTML ya mostraba.
        { prices }
      );

      writeContent(
        '/cursos-info',
        routeSeo(SEO_ROUTES['/cursos-info']),
        render.renderCursosInfo(courses, prices),
        { prices }
      );

      writeContent('/soy-dev', routeSeo(SEO_ROUTES['/soy-dev']), render.renderSoyDev(), undefined);

      writeContent('/empresas', routeSeo(SEO_ROUTES['/empresas']), render.renderEmpresas(), undefined);

      writeContent(
        '/descargables',
        routeSeo(SEO_ROUTES['/descargables']),
        render.renderDescargables(downloadables),
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
        writeContent(
          `/blog/${post.slug}`,
          blogPostSeo(post),
          render.renderBlogPost(post),
          { post },
          '/blog/:slug'
        );
      }

      for (const course of courses) {
        safeSlug(course.slug, 'courses');
        writeContent(
          `/cursos/${course.slug}`,
          courseSeo(course),
          render.renderCourse(course),
          { course },
          '/cursos/:slug'
        );
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
function routeSeo(data: SeoRouteData): ContentSeo {
  const jsonLd = data.jsonLd ? (Array.isArray(data.jsonLd) ? data.jsonLd : [data.jsonLd]) : [];
  return {
    title: data.title,
    description: data.description,
    canonical: data.canonical,
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
