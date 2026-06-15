/**
 * Vercel Edge Middleware — SEO en tiempo de request para artículos del blog.
 *
 * Por qué: el sitio es una SPA. El prerender (scripts/prerender-seo.ts) sólo
 * genera HTML para las rutas estáticas de SEO_ROUTES; los artículos /blog/:slug
 * son dinámicos (viven en Supabase) y caen al rewrite catch-all de vercel.json,
 * que sirve el index.html de la home. Resultado: cada artículo se servía con el
 * canonical y los meta tags de la home, por lo que Google los trataba como
 * duplicados de "/" y no los indexaba.
 *
 * Este middleware intercepta /blog/:slug ANTES del rewrite, busca el post
 * publicado en Supabase (misma query anon que usa el cliente) y reescribe los
 * meta tags del shell (title, description, canonical, OpenGraph, Twitter,
 * JSON-LD) con los valores reales del artículo. Funciona para cualquier
 * artículo creado desde el admin sin necesidad de rebuild ni redeploy.
 *
 * Si el post no existe / no está publicado, o falta la config, deja pasar la
 * request tal cual (la SPA ya redirige a /blog en ese caso).
 */

export const config = {
  // Sólo artículos individuales. /blog (listado) ya se prerenderiza por SEO_ROUTES.
  matcher: '/blog/:slug',
};

const SITE_URL = 'https://productprepa.com';
const DEFAULT_IMAGE = `${SITE_URL}/og-preview-v3.png`;
const DEFAULT_IMAGE_ALT = 'ProductPrepa - Plataforma para crecer en Producto';

// Vercel inyecta todas las env vars del proyecto al runtime del edge, sin
// importar el prefijo. Aceptamos tanto los nombres VITE_* (los que usa el build
// del cliente) como los estándar SUPABASE_* (los que usa la edge function del
// sitemap), así funciona sin reconfigurar nada en Vercel.
const SUPABASE_URL =
  process.env.VITE_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://lgscevufwnetegglgpnw.supabase.co';
const SUPABASE_KEY =
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  '';

interface BlogPost {
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  published_at: string | null;
  updated_at: string | null;
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
}

export default async function middleware(request: Request): Promise<Response | undefined> {
  const url = new URL(request.url);
  const slug = url.pathname.replace(/^\/blog\//, '').replace(/\/+$/, '');

  // Un único segmento limpio. Cualquier otra cosa (subrutas, vacío) → la SPA decide.
  if (!slug || slug.includes('/')) return undefined;
  if (!SUPABASE_KEY) return undefined;

  const post = await fetchPost(slug);
  if (!post) return undefined; // no publicado / no existe → la SPA redirige a /blog

  let shell: string;
  try {
    const shellRes = await fetch(new URL('/index.html', url.origin));
    if (!shellRes.ok) return undefined; // shell no disponible → la SPA decide
    shell = await shellRes.text();
  } catch {
    return undefined;
  }
  const html = injectMeta(shell, post);

  return new Response(html, {
    status: 200,
    headers: {
      'content-type': 'text/html; charset=utf-8',
      // Cacheable en el CDN de Vercel por slug; revalida en background.
      'cache-control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}

async function fetchPost(slug: string): Promise<BlogPost | undefined> {
  try {
    const select =
      'slug,title,description,thumbnail_url,published_at,updated_at,meta_title,meta_description,meta_keywords';
    const endpoint =
      `${SUPABASE_URL}/rest/v1/blog_posts` +
      `?slug=eq.${encodeURIComponent(slug)}` +
      `&status=eq.published&select=${select}&limit=1`;
    const res = await fetch(endpoint, {
      headers: { apikey: SUPABASE_KEY, authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return undefined;
    const rows = (await res.json()) as BlogPost[];
    return rows?.[0];
  } catch {
    return undefined;
  }
}

function injectMeta(html: string, post: BlogPost): string {
  const title = post.meta_title || `${post.title} | ProductPrepa`;
  const description = post.meta_description || post.description || '';
  const canonical = `${SITE_URL}/blog/${post.slug}`;
  const image = post.thumbnail_url || DEFAULT_IMAGE;
  const imageAlt = post.thumbnail_url ? post.title : DEFAULT_IMAGE_ALT;

  const t = escapeAttr(title);
  const d = escapeAttr(description);
  const img = escapeAttr(image);
  const imgAlt = escapeAttr(imageAlt);

  // Reemplazos del contenido entre las comillas del atributo (grupos $1/$2).
  // Usamos callbacks para insertar el valor LITERAL: con el form string,
  // secuencias como `$1` o `$&` dentro de un título (ej. precios "$1 millón")
  // se reinterpretarían como referencias de captura y corromperían el tag.
  const attr = (value: string) => (_m: string, p1: string, p2: string) => `${p1}${value}${p2}`;
  const replacements: Array<{ regex: RegExp; fn: (...args: string[]) => string }> = [
    { regex: /<title>[^<]*<\/title>/, fn: () => `<title>${escapeHtml(title)}</title>` },
    { regex: /(<meta\s+name="description"\s+content=")[^"]*(")/, fn: attr(d) },
    { regex: /(<link\s+rel="canonical"\s+href=")[^"]*(")/, fn: attr(escapeAttr(canonical)) },
    { regex: /(<meta\s+property="og:type"\s+content=")[^"]*(")/, fn: attr('article') },
    { regex: /(<meta\s+property="og:url"\s+content=")[^"]*(")/, fn: attr(escapeAttr(canonical)) },
    { regex: /(<meta\s+property="og:title"\s+content=")[^"]*(")/, fn: attr(t) },
    { regex: /(<meta\s+property="og:description"\s+content=")[^"]*(")/, fn: attr(d) },
    { regex: /(<meta\s+property="og:image"\s+content=")[^"]*(")/, fn: attr(img) },
    { regex: /(<meta\s+property="og:image:alt"\s+content=")[^"]*(")/, fn: attr(imgAlt) },
    { regex: /(<meta\s+name="twitter:title"\s+content=")[^"]*(")/, fn: attr(t) },
    { regex: /(<meta\s+name="twitter:description"\s+content=")[^"]*(")/, fn: attr(d) },
    { regex: /(<meta\s+name="twitter:image"\s+content=")[^"]*(")/, fn: attr(img) },
    { regex: /(<meta\s+name="twitter:image:alt"\s+content=")[^"]*(")/, fn: attr(imgAlt) },
  ];

  let out = html;
  for (const { regex, fn } of replacements) {
    out = out.replace(regex, fn);
  }

  // Tags adicionales propias del artículo, insertadas antes de </head>.
  const head: string[] = [];
  if (post.meta_keywords) {
    head.push(`<meta name="keywords" content="${escapeAttr(post.meta_keywords)}" />`);
  }
  if (post.published_at) {
    head.push(`<meta property="article:published_time" content="${escapeAttr(post.published_at)}" />`);
    head.push(`<meta property="article:author" content="ProductPrepa" />`);
  }
  head.push(
    `<script type="application/ld+json" data-seo-jsonld="true">${jsonLdScript(post, canonical, image)}</script>`,
  );

  return out.replace('</head>', () => `${head.join('\n    ')}\n  </head>`);
}

function jsonLdScript(post: BlogPost, canonical: string, image: string): string {
  const graph: object[] = [
    {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.meta_title || post.title,
      description: post.meta_description || post.description || '',
      url: canonical,
      ...(post.published_at && {
        datePublished: post.published_at,
        dateModified: post.updated_at || post.published_at,
      }),
      author: { '@type': 'Organization', name: 'ProductPrepa', url: SITE_URL },
      publisher: {
        '@type': 'Organization',
        name: 'ProductPrepa',
        url: SITE_URL,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/favicon.png` },
      },
      ...(post.thumbnail_url && { image }),
      inLanguage: 'es',
      isAccessibleForFree: true,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Inicio', item: SITE_URL },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: `${SITE_URL}/blog` },
        { '@type': 'ListItem', position: 3, name: post.title, item: canonical },
      ],
    },
  ];
  // Evita romper el <script> si algún campo contiene "</script>" o "<".
  return JSON.stringify(graph).replace(/</g, '\\u003c');
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
