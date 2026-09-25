import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { prerenderSeoPlugin } from "./scripts/prerender-seo";

/**
 * Versión del build. Va embebida en el bundle (__APP_VERSION__) y publicada en
 * /version.json: src/lib/versionCheck.ts compara las dos para saber si la
 * pestaña quedó corriendo un deploy viejo.
 */
const APP_VERSION = new Date().toISOString();

// Se emite como asset del build en vez de escribirse en public/: así el build
// no ensucia el working tree con un version.json nuevo cada vez.
const versionFilePlugin = (): Plugin => ({
  name: "version-file",
  apply: "build",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "version.json",
      source: JSON.stringify({ version: APP_VERSION }),
    });
  },
});

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(APP_VERSION),
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    versionFilePlugin(),
    prerenderSeoPlugin(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
