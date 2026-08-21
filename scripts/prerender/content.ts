import fs from 'fs';
import type { BlogPost, CoursePublic } from '../../src/seo/contentSeo';
import { BLOG_POST_COLUMNS } from '../../src/seo/contentSeo';

/**
 * Trae de Supabase, en build time, el contenido que se prerenderiza.
 *
 * Usa REST plano a propósito, no src/integrations/supabase/client.ts: ese
 * módulo pasa `storage: localStorage` al crear el cliente y se evalúa al
 * importarlo, así que en Node explota antes de la primera query.
 *
 * Va con la anon key y los mismos filtros que usa el cliente, o sea que ve
 * exactamente lo que ve un visitante anónimo bajo la RLS que ya existe. No hace
 * falta service role ni tocar las políticas.
 */

export interface PrerenderContent {
  posts: BlogPost[];
  courses: CoursePublic[];
}

const env = (...names: string[]) => names.map((n) => process.env[n]).find(Boolean);

async function select<T>(path: string): Promise<T[]> {
  const url = env('VITE_SUPABASE_URL', 'SUPABASE_URL');
  const key = env('VITE_SUPABASE_PUBLISHABLE_KEY', 'SUPABASE_ANON_KEY');

  if (!url || !key) {
    throw new Error(
      '[prerender] Faltan las credenciales de Supabase.\n' +
        '  Configurá VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY en Vercel\n' +
        '  (Settings → Environment Variables, scope Production y Preview).\n' +
        '  Para buildear sin red: PRERENDER_FIXTURES=<archivo.json>.'
    );
  }

  const response = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    // Cortamos el build en vez de seguir: publicar el blog entero vacío es
    // justo el problema que este prerender viene a resolver.
    throw new Error(
      `[prerender] Supabase respondió ${response.status} pidiendo ${path}.\n${body.slice(0, 300)}`
    );
  }
  return response.json();
}

interface RawCourse extends Omit<CoursePublic, 'lessons'> {
  id: string;
  course_lessons: Array<CoursePublic['lessons'][number] & { is_published: boolean; order_index: number }>;
}

export async function fetchContent(): Promise<PrerenderContent> {
  // Escotilla explícita para entornos sin salida a Supabase (sandbox, CI
  // aislado). Nunca se activa sola: sin esta variable, un fetch fallido corta
  // el build.
  const fixtures = process.env.PRERENDER_FIXTURES;
  if (fixtures) {
    console.log(`[prerender] PRERENDER_FIXTURES → leyendo ${fixtures} (sin Supabase)`);
    return JSON.parse(fs.readFileSync(fixtures, 'utf-8'));
  }

  const [posts, courses] = await Promise.all([
    select<BlogPost>(
      `blog_posts?select=${encodeURIComponent(BLOG_POST_COLUMNS)}` +
        '&status=eq.published&order=published_at.desc'
    ),
    // is_published (no status) para que coincida con useCourse, que es lo que
    // decide si el cliente renderiza el curso.
    select<RawCourse>(
      'courses?select=id,slug,title,description,outcome,thumbnail_url,duration_minutes,updated_at,' +
        'course_lessons(id,title,duration_minutes,order_index,is_published)' +
        '&is_published=eq.true'
    ),
  ]);

  return {
    posts,
    courses: courses.map(({ course_lessons, ...course }) => ({
      ...course,
      lessons: (course_lessons ?? [])
        .filter((lesson) => lesson.is_published)
        .sort((a, b) => a.order_index - b.order_index)
        .map(({ id, title, duration_minutes }) => ({ id, title, duration_minutes })),
    })),
  };
}
