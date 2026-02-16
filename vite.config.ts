import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import fs from "fs";
import { seoPages } from "./vite-plugin-seo-pages";

// Plugin to generate version.json on build
const writeVersionPlugin = () => {
  let versionWritten = false;
  
  return {
    name: 'write-version',
    buildStart() {
      if (!versionWritten) {
        const version = { version: new Date().toISOString() };
        fs.writeFileSync(
          path.resolve(__dirname, 'public/version.json'),
          JSON.stringify(version)
        );
        versionWritten = true;
        console.log('✓ Generated version.json:', version.version);
      }
    }
  };
};

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    headers: {
      'Cache-Control': 'no-store'
    }
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    writeVersionPlugin(),
    seoPages(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
