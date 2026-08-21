import type { ContentSeo } from '../../src/seo/contentSeo';
import { DEFAULT_OG_IMAGE } from '../../src/seo/contentSeo';

/**
 * Manipulación del shell HTML que emite Vite (dist/index.html).
 *
 * Reemplaza al enfoque anterior, que corría un regex por meta tag y abortaba el
 * build si el patrón no matcheaba. Ese chequeo validaba la *entrada* (¿sigue
 * existiendo el tag?) pero no la *salida*, así que un reemplazo que dejaba el
 * valor viejo pasaba sin ruido. Acá los tags se insertan si faltan, y assertSeo
 * verifica el HTML resultante.
 */

const escapeHtml = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const escapeAttr = (v: string) => escapeHtml(v).replace(/"/g, '&quot;');
const escapeRegex = (v: string) => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const intoHead = (html: string, tag: string) => html.replace('</head>', `    ${tag}\n  </head>`);

/** Reemplaza el tag que matchea `find`, o lo inserta en el head si no está. */
function upsert(html: string, find: RegExp, tag: string): string {
  return find.test(html) ? html.replace(find, tag) : intoHead(html, tag);
}

const setMeta = (html: string, attr: 'name' | 'property', key: string, value: string) =>
  upsert(
    html,
    new RegExp(`<meta\\s+[^>]*?${attr}=["']${escapeRegex(key)}["'][^>]*?>`, 'i'),
    `<meta ${attr}="${key}" content="${escapeAttr(value)}" />`
  );

const dropMeta = (html: string, attr: 'name' | 'property', key: string) =>
  html.replace(new RegExp(`\\s*<meta\\s+[^>]*?${attr}=["']${escapeRegex(key)}["'][^>]*?>`, 'gi'), '');

/**
 * Escribe en el shell el SEO de una página. `robots` por defecto deja que el
 * shell mantenga el suyo ("index, follow"); las rutas protegidas pasan noindex.
 */
export function applySeo(html: string, seo: ContentSeo, robots?: string): string {
  html = upsert(html, /<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(seo.title)}</title>`);
  html = upsert(
    html,
    /<link\s+[^>]*?rel=["']canonical["'][^>]*?>/i,
    `<link rel="canonical" href="${escapeAttr(seo.canonical)}" />`
  );
  html = setMeta(html, 'name', 'description', seo.description);
  html = setMeta(html, 'property', 'og:type', seo.ogType);
  html = setMeta(html, 'property', 'og:url', seo.canonical);
  html = setMeta(html, 'property', 'og:title', seo.title);
  html = setMeta(html, 'property', 'og:description', seo.description);
  html = setMeta(html, 'property', 'og:image', seo.image);
  html = setMeta(html, 'property', 'og:image:alt', seo.imageAlt);
  html = setMeta(html, 'name', 'twitter:title', seo.title);
  html = setMeta(html, 'name', 'twitter:description', seo.description);
  html = setMeta(html, 'name', 'twitter:image', seo.image);
  html = setMeta(html, 'name', 'twitter:image:alt', seo.imageAlt);
  if (robots) html = setMeta(html, 'name', 'robots', robots);
  if (seo.keywords) html = setMeta(html, 'name', 'keywords', seo.keywords);
  if (seo.publishedTime) {
    html = setMeta(html, 'property', 'article:published_time', seo.publishedTime);
    html = setMeta(html, 'property', 'article:author', 'ProductPrepa');
  }

  // El shell declara 1200x630, las medidas de la imagen por defecto. Si el
  // contenido trae imagen propia no sabemos sus medidas, y anunciar las
  // equivocadas rompe el preview: mejor no declarar ninguna.
  if (seo.image !== DEFAULT_OG_IMAGE) {
    html = dropMeta(html, 'property', 'og:image:width');
    html = dropMeta(html, 'property', 'og:image:height');
  }

  if (seo.jsonLd.length) {
    // El `<` escapado evita que un "</script>" dentro del JSON cierre el bloque.
    // Mismo data-seo-jsonld que usa Seo.tsx: al montar lo encuentra, lo borra y
    // lo reescribe, así no quedan dos bloques al navegar client-side.
    const json = JSON.stringify(seo.jsonLd).replace(/</g, '\\u003c');
    html = intoHead(html, `<script type="application/ld+json" data-seo-jsonld="true">${json}</script>`);
  }
  return html;
}

/**
 * Mete el HTML renderizado dentro de #root.
 *
 * El SPA arranca con createRoot().render(), que limpia el contenedor y vuelve a
 * pintar: no es hidratación, así que no hay riesgo de mismatch. Para el crawler
 * y para quien navega sin JS, el contenido ya está entero en la respuesta.
 *
 * También saca el <noscript> del shell, que trae un h1 y un índice del sitio
 * como fallback del #root vacío. En una página con contenido real sobra, y
 * dejaría dos h1 para un cliente sin JS. Las rutas que no se prerenderizan
 * siguen sirviendo el shell con su noscript intacto.
 */
export function injectAppHtml(html: string, appHtml: string, data?: unknown): string {
  const root = /<div id="root">\s*<\/div>/;
  if (!root.test(html)) {
    throw new Error('[prerender] No se encontró <div id="root"></div> en dist/index.html.');
  }
  html = html.replace(/\s*<noscript>[\s\S]*?<\/noscript>/i, '');

  // Los mismos datos que se prerenderizaron, para que el cliente arranque con
  // ellos y el reemplazo del DOM no se vea. Ver src/seo/prerenderedData.ts.
  // U+2028/2029 son saltos de línea válidos en JS pero no en JSON.
  const seed = data
    ? `<script>window.__PP_DATA__=${JSON.stringify(data)
        .replace(/</g, '\\u003c')
        .replace(/\u2028/g, '\\u2028')
        .replace(/\u2029/g, '\\u2029')}</script>\n    `
    : '';
  return html.replace(root, `${seed}<div id="root">${appHtml}</div>`);
}

/**
 * Verifica el HTML ya generado. Corre por cada ruta y corta el build ante
 * cualquier problema: un deploy con el canonical de la home en todos los
 * artículos es justamente el bug que estamos arreglando.
 */
export function assertSeo(html: string, route: string, seo: ContentSeo): void {
  const fail = (msg: string) => {
    throw new Error(`[prerender] ${route}: ${msg}`);
  };

  const title = html.match(/<title>([\s\S]*?)<\/title>/i);
  if (title?.[1] !== escapeHtml(seo.title)) fail(`<title> quedó "${title?.[1]}"`);

  const canonicals = html.match(/<link\s+[^>]*?rel=["']canonical["'][^>]*?>/gi) ?? [];
  if (canonicals.length !== 1) fail(`se esperaba 1 canonical, hay ${canonicals.length}`);
  else if (!canonicals[0].includes(`href="${escapeAttr(seo.canonical)}"`)) {
    fail(`el canonical no apunta a ${seo.canonical}`);
  }

  // Sin comentarios HTML: no se renderizan, y uno que mencione un h1 en prosa
  // no debería hacer fallar el build.
  const body = html.slice(html.indexOf('<body')).replace(/<!--[\s\S]*?-->/g, '');
  const h1s = (body.match(/<h1[\s>]/gi) ?? []).length;
  if (h1s !== 1) fail(`se esperaba exactamente 1 <h1> y hay ${h1s}`);
}
