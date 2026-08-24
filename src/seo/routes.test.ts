import fs from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import { SEO_ROUTES } from './routes';

/**
 * Consistencia entre el router, SEO_ROUTES y las páginas.
 *
 * Existe por un bug real: /evaluacion-product-manager tenía sus datos en
 * SEO_ROUTES y se prerenderizaba bien, pero la página no montaba <Seo />. En
 * una visita directa no se veía; al llegar por el link del nav —navegación de
 * cliente— la página se quedaba con el título y el canonical de la anterior,
 * o sea declarándose duplicada de otra URL.
 */

const root = path.resolve(__dirname, '../..');

/**
 * Saca comentarios antes de buscar el JSX. Sin esto un `<Seo />` mencionado en
 * un comentario alcanzaba para que el test pasara — que es exactamente cómo se
 * escapó el bug la primera vez.
 */
const stripComments = (source: string) =>
  source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
const appSource = fs.readFileSync(path.join(root, 'src/App.tsx'), 'utf-8');

/**
 * Todos los `path` declarados en App.tsx. A propósito no intenta mapear cada
 * ruta a su componente: el árbol tiene rutas anidadas, Navigate y Suspense en
 * el medio, y cualquier regex que lo intente termina emparejando de más.
 */
function routePathsFromApp(): Set<string> {
  return new Set([...appSource.matchAll(/<Route\s+path="([^"]+)"/g)].map((m) => m[1]));
}

describe('SEO_ROUTES', () => {
  it('cada ruta declarada apunta a su propio canonical', () => {
    for (const [route, data] of Object.entries(SEO_ROUTES)) {
      expect(data.canonical, `canonical de ${route}`).toBeTruthy();
      const expectedSuffix = route === '/' ? '/' : route;
      expect(
        data.canonical!.endsWith(expectedSuffix),
        `el canonical de ${route} es ${data.canonical}`,
      ).toBe(true);
    }
  });

  it('cada ruta declarada tiene título y descripción', () => {
    for (const [route, data] of Object.entries(SEO_ROUTES)) {
      expect(data.title, `título de ${route}`).toBeTruthy();
      expect(data.description, `descripción de ${route}`).toBeTruthy();
    }
  });
});

describe('páginas y <Seo />', () => {
  const pagesDir = path.join(root, 'src/pages');
  const pageFiles = fs
    .readdirSync(pagesDir)
    .filter((f) => f.endsWith('.tsx'));

  it.each(pageFiles)('%s monta <Seo />', (file) => {
    const source = stripComments(fs.readFileSync(path.join(pagesDir, file), 'utf-8'));
    expect(
      source.includes('<Seo'),
      `${file} no monta <Seo />: al navegar desde otra página se queda con el ` +
        'título y el canonical de la anterior',
    ).toBe(true);
  });

  it('toda ruta de SEO_ROUTES existe en el router', () => {
    const routerPaths = routePathsFromApp();
    for (const route of Object.keys(SEO_ROUTES)) {
      expect(routerPaths.has(route), `${route} está en SEO_ROUTES pero no en App.tsx`).toBe(true);
    }
  });
});
