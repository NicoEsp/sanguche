import { describe, expect, it } from 'vitest';
import type { ContentSeo } from '../../src/seo/contentSeo';
import { applySeo, assertSeo, injectAppHtml } from './html';

/**
 * El contenido de estos tags lo escribe un admin en Supabase, así que puede
 * traer apóstrofos, comillas y secuencias `$&` que tienen significado especial
 * en el reemplazo de String.replace. Los dos bugs que cubren estos tests
 * cortaban el build o corrompían el HTML servido.
 */

const SHELL = `<!doctype html>
<html lang="es">
  <head>
    <title>ProductPrepa</title>
    <meta name="description" content="Shell por defecto" />
    <link rel="canonical" href="https://productprepa.com/" />
  </head>
  <body>
    <div id="root"></div>
    <noscript>Necesitás JavaScript</noscript>
  </body>
</html>`;

/** El shell tal como queda en el build: con el markup de la página adentro. */
const RENDERED = injectAppHtml(SHELL, '<article><h1>Un artículo</h1></article>');

const seoFor = (over: Partial<ContentSeo> = {}): ContentSeo => ({
  title: 'Un artículo',
  description: 'Una descripción',
  canonical: 'https://productprepa.com/blog/un-articulo',
  image: 'https://productprepa.com/og.png',
  imageAlt: 'ProductPrepa',
  ogType: 'article',
  jsonLd: [],
  ...over,
});

describe('applySeo + assertSeo', () => {
  it('acepta una descripción con apóstrofo', () => {
    // Antes assertSeo capturaba con [^"']*, así que la captura se cortaba en
    // el apóstrofo y el build entero se caía con "no es la de esta ruta".
    const seo = seoFor({ description: "Lo que no te dicen del rol' y por qué importa" });
    const html = applySeo(RENDERED, seo);
    expect(() => assertSeo(html, '/blog/un-articulo', seo)).not.toThrow();
    expect(html).toContain(`content="${seo.description}"`);
  });

  it('acepta comillas dobles y las escapa', () => {
    const seo = seoFor({ description: 'Entrevistas "difíciles" y cómo encararlas' });
    const html = applySeo(RENDERED, seo);
    expect(() => assertSeo(html, '/blog/un-articulo', seo)).not.toThrow();
    expect(html).toContain('&quot;difíciles&quot;');
  });

  // El `&` sí se escapa a &amp; (eso es correcto); lo que se testea acá es que
  // la secuencia no se expanda como patrón de reemplazo.
  const htmlEscaped = (v: string) => v.replace(/&/g, '&amp;');

  it.each(['$&', '$`', "$'", '$1'])('preserva la secuencia %s literal', (token) => {
    const seo = seoFor({
      title: `Título con ${token} adentro`,
      description: `Descripción con ${token} adentro`,
    });
    const html = applySeo(RENDERED, seo);
    expect(() => assertSeo(html, '/blog/un-articulo', seo)).not.toThrow();
    expect(html).toContain(`<title>${htmlEscaped(seo.title)}</title>`);
    expect(html).toContain(`content="${htmlEscaped(seo.description)}"`);
    // Si se hubiera expandido, $& habría insertado el <title> matcheado entero.
    expect(html).not.toContain('<title><title>');
  });

  it('deja un solo canonical y es el de la ruta', () => {
    const seo = seoFor();
    const html = applySeo(RENDERED, seo);
    expect(html.match(/rel="canonical"/g)).toHaveLength(1);
    expect(html).toContain(`href="${seo.canonical}"`);
  });

  it('borra la description del shell cuando la ruta no tiene', () => {
    const seo = seoFor({ description: '' });
    const html = applySeo(RENDERED, seo);
    expect(html).not.toContain('Shell por defecto');
    expect(() => assertSeo(html, '/blog/un-articulo', seo)).not.toThrow();
  });

  it('falla si el canonical no es el de la ruta', () => {
    const seo = seoFor();
    const html = applySeo(RENDERED, seoFor({ canonical: 'https://productprepa.com/otra' }));
    expect(() => assertSeo(html, '/blog/un-articulo', seo)).toThrow(/canonical/);
  });
});

describe('injectAppHtml', () => {
  it('mete el markup en #root y saca el noscript', () => {
    const out = injectAppHtml(SHELL, '<h1>Hola</h1>');
    expect(out).toContain('<div id="root"><h1>Hola</h1></div>');
    expect(out).not.toContain('<noscript>');
  });

  it('preserva $& en el markup en vez de expandirlo', () => {
    // Con la forma string de replace, `$&` se reemplaza por lo que matcheó el
    // patrón —o sea el propio <div id="root"></div>— y el HTML sale roto.
    const out = injectAppHtml(SHELL, '<h1>Precio $& envío</h1>');
    expect(out).toContain('<h1>Precio $& envío</h1>');
    expect(out.match(/<div id="root">/g)).toHaveLength(1);
  });

  it('escapa el < del JSON sembrado para no cerrar el script', () => {
    const out = injectAppHtml(SHELL, '<h1>Hola</h1>', { t: '</script><script>alert(1)</script>' });
    expect(out).not.toContain('</script><script>alert(1)');
    expect(out).toContain('\\u003c');
  });
});
