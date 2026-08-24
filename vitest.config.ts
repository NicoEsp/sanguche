import { defineConfig } from 'vitest/config';
import path from 'path';

/**
 * Los tests corren sobre lógica pura: scoring, reglas de planes y la
 * consistencia entre el router y el SEO. Nada de DOM, así que no hace falta
 * jsdom ni testing-library — la dependencia es sólo vitest.
 */
export default defineConfig({
  resolve: {
    alias: { '@': path.resolve(import.meta.dirname, './src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
