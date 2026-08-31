import fs from 'fs';
import type { BlogPost, CoursePublic } from '../../src/seo/contentSeo';
import { BLOG_POST_COLUMNS } from '../../src/seo/contentSeo';
import type { DownloadablePublic } from '../../src/components/downloads/DescargablesSeoContent';

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
  downloadables: DownloadablePublic[];
}

const env = (...names: string[]) => names.map((n) => process.env[n]).find(Boolean);

/** Un SELECT contra PostgREST con la anon key, devuelto ya tipado. */
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

  // PostgREST corta en max-rows (1000 por defecto en Supabase) sin avisar. Lo
  // pedimos explícito para poder detectar el tope más abajo: publicar el
  // listado a medias es justo el bug que este prerender viene a resolver.
  const LIMIT = 1000;

  let response: Response;
  try {
    response = await fetch(`${url.replace(/\/+$/, '')}/rest/v1/${path}&limit=${LIMIT}`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
      // Sin timeout, un Supabase que no responde cuelga el build hasta que lo
      // mata Vercel, sin dejar dicho por qué.
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`[prerender] No se pudo consultar ${path} en Supabase: ${reason}`);
  }

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    // Cortamos el build en vez de seguir: publicar el blog entero vacío es
    // justo el problema que este prerender viene a resolver.
    throw new Error(
      `[prerender] Supabase respondió ${response.status} pidiendo ${path}.\n${body.slice(0, 300)}`
    );
  }

  const rows = await response.json();
  if (!Array.isArray(rows)) {
    throw new Error(`[prerender] Respuesta inesperada de Supabase para ${path}: se esperaba un array.`);
  }
  if (rows.length >= LIMIT) {
    throw new Error(
      `[prerender] ${path} devolvió ${rows.length} filas, el tope de la consulta. ` +
        'Habría contenido sin prerenderizar: hay que paginar antes de seguir.'
    );
  }
  return rows as T[];
}

interface RawCourse extends Omit<CoursePublic, 'lessons'> {
  id: string;
  course_lessons: Array<CoursePublic['lessons'][number] & { is_published: boolean; order_index: number }>;
}

/**
 * Completa las colecciones que falten en un archivo de fixtures.
 *
 * Cada vez que el prerender empieza a usar una colección nueva, los archivos de
 * fixtures que ya existían se quedan sin esa clave. Sin esto, el valor llega
 * `undefined` hasta el componente y el build muere con un "Cannot read
 * properties of undefined" adentro del renderer de React, que no dice ni qué
 * falta ni dónde. Faltar entero es aceptable —se prerenderiza esa sección
 * vacía— pero se avisa; que la clave exista con algo que no es un array es un
 * archivo mal armado y ahí sí conviene cortar.
 */
function normalizeFixtures(raw: unknown, file: string): PrerenderContent {
  // La raíz tiene que ser un objeto. Un array pasaba el resto de los chequeos
  // y prerenderizaba el sitio entero vacío avisando sólo con un warning, que es
  // justo el deploy silencioso que no queremos; un string o un número morían
  // más adelante al intentar escribirles una propiedad, sin decir por qué.
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    // `typeof null` es "object", así que null se nombra aparte: decir que el
    // archivo "contiene object" cuando contiene null es justo el mensaje
    // confuso que este chequeo viene a evitar.
    const encontrado = raw === null ? 'null' : Array.isArray(raw) ? 'un array' : typeof raw;
    throw new Error(
      `[prerender] ${file} tiene que contener un objeto con las colecciones ` +
        `(posts, courses, downloadables) y contiene ${encontrado}.`
    );
  }

  const data = raw as Record<string, unknown>;
  const collections = ['posts', 'courses', 'downloadables'] as const;
  const missing: string[] = [];

  for (const key of collections) {
    if (data[key] === undefined) {
      missing.push(key);
      data[key] = [];
    } else if (!Array.isArray(data[key])) {
      throw new Error(
        `[prerender] En ${file}, "${key}" tiene que ser un array y es ${typeof data[key]}.`
      );
    }
  }

  if (missing.length > 0) {
    console.warn(
      `[prerender] ${file} no trae ${missing.join(', ')}: esas secciones se ` +
        'prerenderizan vacías. Agregá la clave al archivo si querés contenido ahí.'
    );
  }

  return data as unknown as PrerenderContent;
}

/**
 * Todo el contenido que el prerender necesita, en una sola pasada: artículos
 * publicados, cursos con sus lecciones y el catálogo de descargables activos.
 */
export async function fetchContent(): Promise<PrerenderContent> {
  // Escotilla explícita para entornos sin salida a Supabase (sandbox, CI
  // aislado). Nunca se activa sola: sin esta variable, un fetch fallido corta
  // el build.
  const fixtures = process.env.PRERENDER_FIXTURES;
  if (fixtures) {
    console.log(`[prerender] PRERENDER_FIXTURES → leyendo ${fixtures} (sin Supabase)`);
    return normalizeFixtures(JSON.parse(fs.readFileSync(fixtures, 'utf-8')), fixtures);
  }

  const [posts, courses, downloadables] = await Promise.all([
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
    // La metadata de los recursos activos es pública (ver la migración
    // align_downloadable_metadata_visibility), así que la anon key alcanza:
    // vemos exactamente lo que ve un visitante anónimo.
    select<DownloadablePublic>(
      'downloadable_resources?select=slug,title,description,type,access_level,is_featured,display_order' +
        '&is_active=eq.true&order=display_order.asc'
    ),
  ]);

  return {
    posts,
    downloadables,
    courses: courses.map(({ course_lessons, ...course }) => ({
      ...course,
      lessons: (course_lessons ?? [])
        .filter((lesson) => lesson.is_published)
        .sort((a, b) => a.order_index - b.order_index)
        .map(({ id, title, duration_minutes }) => ({ id, title, duration_minutes })),
    })),
  };
}
