import path from 'path';
import type { ViteDevServer } from 'vite';

/**
 * Carga los módulos de render (TSX, alias `@/`) dentro del build.
 *
 * Levanta un servidor Vite propio en middlewareMode sólo para usar
 * ssrLoadModule. Va con `configFile: false` a propósito: si leyera
 * vite.config.ts volvería a instanciar este mismo plugin y la cadena entera
 * (componentTagger, etc.), que no aporta nada para SSR y sí puede sorprender.
 * Lo único que necesita es el alias y el transform de JSX.
 */
export async function createSsrLoader(root: string) {
  const { createServer } = await import('vite');

  const server: ViteDevServer = await createServer({
    configFile: false,
    root,
    logLevel: 'warn',
    appType: 'custom',
    server: { middlewareMode: true, hmr: false, watch: null },
    resolve: { alias: { '@': path.resolve(root, 'src') } },
    esbuild: { jsx: 'automatic' },
  });

  return {
    load: <T,>(modulePath: string) => server.ssrLoadModule(modulePath) as Promise<T>,
    close: () => server.close(),
  };
}
