import fs from 'fs';
import path from 'path';
import { SEO_ROUTES } from '../src/seo/routes';

const SITE_URL = 'https://productprepa.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-preview-v3.png`;
const DEFAULT_IMAGE_ALT = 'ProductPrepa - Plataforma para crecer en Producto';

/**
 * Vite plugin that runs after build and writes per-route index.html files
 * with route-specific SEO/OG meta tags (title, description, canonical, og:url, etc.).
 *
 * Why: Seo.tsx sets meta tags client-side (useEffect). Social bots and SEO
 * crawlers (Twitter, LinkedIn, Facebook, Googlebot indexing snippets) do not
 * execute JS, so without prerender they all see the homepage's tags for every
 * route. With this plugin, Vercel serves dist/planes/index.html for /planes,
 * dist/cursos-info/index.html for /cursos-info, etc. — each with correct tags.
 *
 * Vercel filesystem lookup beats rewrites, so vercel.json's catch-all rewrite
 * still works for any route NOT in SEO_ROUTES (falls back to root index.html,
 * same behavior as today).
 *
 * If any expected meta tag is missing from the template, the build fails loudly.
 */
export const prerenderSeoPlugin = () => ({
  name: 'prerender-seo',
  apply: 'build' as const,
  closeBundle() {
    const distDir = path.resolve(process.cwd(), 'dist');
    const templatePath = path.join(distDir, 'index.html');
    if (!fs.existsSync(templatePath)) {
      console.warn('[prerender-seo] dist/index.html not found, skipping');
      return;
    }
    const template = fs.readFileSync(templatePath, 'utf-8');

    // La home ya tiene los meta correctos en el template, pero le falta el
    // JSON-LD (Seo.tsx lo inyecta client-side). Lo emitimos estático para que
    // los crawlers que no ejecutan JS también lo vean.
    const homeData = SEO_ROUTES['/'];
    if (homeData?.jsonLd) {
      fs.writeFileSync(templatePath, injectJsonLd(template, homeData.jsonLd));
    }

    let routesWritten = 0;
    for (const [route, data] of Object.entries(SEO_ROUTES)) {
      // Home is already correct in dist/index.html (no replacement needed).
      if (route === '/') continue;

      const replacements: Array<{ regex: RegExp; value: string }> = [
        { regex: /<title>[^<]*<\/title>/, value: `<title>${escapeHtml(data.title)}</title>` },
        { regex: /(<meta\s+name="description"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.description)}$2` },
        { regex: /(<link\s+rel="canonical"\s+href=")[^"]*(")/, value: `$1${escapeAttr(data.canonical)}$2` },
        { regex: /(<meta\s+property="og:url"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.canonical)}$2` },
        { regex: /(<meta\s+property="og:title"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.title)}$2` },
        { regex: /(<meta\s+property="og:description"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.description)}$2` },
        { regex: /(<meta\s+property="og:image"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.image || DEFAULT_IMAGE)}$2` },
        { regex: /(<meta\s+property="og:image:alt"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.imageAlt || DEFAULT_IMAGE_ALT)}$2` },
        { regex: /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.title)}$2` },
        { regex: /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.description)}$2` },
        { regex: /(<meta\s+name="twitter:image"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.image || DEFAULT_IMAGE)}$2` },
        { regex: /(<meta\s+name="twitter:image:alt"\s+content=")[^"]*(")/, value: `$1${escapeAttr(data.imageAlt || DEFAULT_IMAGE_ALT)}$2` },
      ];

      let html = template;
      for (const { regex, value } of replacements) {
        if (!regex.test(html)) {
          console.error(`[prerender-seo] Pattern not matched while building ${route}: ${regex}`);
          console.error('[prerender-seo] Did the structure of index.html change? The plugin uses regex over <meta>/<title>/<link rel="canonical"> tags.');
          process.exit(1);
        }
        html = html.replace(regex, value);
      }

      if (data.jsonLd) {
        html = injectJsonLd(html, data.jsonLd);
      }

      // Strip leading slash so we can join: /planes -> dist/planes/index.html
      const outDir = path.join(distDir, route.replace(/^\//, ''));
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, 'index.html'), html);
      routesWritten++;
    }

    console.log(`✓ Prerendered ${routesWritten} routes with SEO meta tags`);
  },
});

/**
 * Inserta el structured data como <script type="application/ld+json"> estático
 * antes de </head>. Usa el mismo atributo data-seo-jsonld que Seo.tsx: en
 * runtime, Seo.tsx encuentra este script, lo remueve y lo reemplaza por uno
 * idéntico, así no quedan duplicados. Se serializa igual que en Seo.tsx
 * (JSON.stringify del valor completo, sea objeto o array).
 */
function injectJsonLd(html: string, jsonLd: object | object[]): string {
  const json = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  const tag = `<script type="application/ld+json" data-seo-jsonld="true">${json}</script>`;
  return html.replace('</head>', `${tag}</head>`);
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
