import type { BlogPost, CoursePublic } from '@/seo/contentSeo';
import type { BlogListItem } from '@/components/blog/BlogPostList';

/**
 * Puente entre el HTML prerenderizado en build y el SPA cuando arranca.
 *
 * El build escribe el contenido dentro de #root y además serializa los mismos
 * datos en window.__PP_DATA__. Sin eso, React monta, la query a Supabase
 * arranca de cero y el usuario ve el artículo completo desaparecer y volver
 * como skeleton. Con esto, el primer render del cliente ya tiene los datos y el
 * reemplazo del DOM es idéntico a lo que recibió el crawler.
 */
interface PrerenderedData {
  /**
   * Momento del build. Se usa como initialDataUpdatedAt: react-query considera
   * los datos vencidos desde el deploy, así que pinta al instante con lo
   * prerenderizado y revalida en segundo plano. Sin esto los trataría como
   * recién traídos y, con refetchOnMount en false a nivel global, no se
   * refrescarían nunca dentro de la sesión.
   */
  builtAt?: number;
  post?: BlogPost;
  posts?: BlogListItem[];
  course?: CoursePublic;
}

declare global {
  interface Window {
    __PP_DATA__?: PrerenderedData;
  }
}

// Se llama durante el render (initialData de useQuery), así que tiene que
// tolerar no tener window: el propio build importa estos módulos.
const read = (): PrerenderedData | undefined =>
  typeof window === 'undefined' ? undefined : window.__PP_DATA__;

/**
 * Tras navegar client-side a otro slug, el payload del HTML inicial sigue en
 * window pero corresponde a otra página: por eso todo va contra el slug pedido.
 */
export const prerenderedPost = (slug?: string): BlogPost | undefined => {
  const post = read()?.post;
  return slug && post?.slug === slug ? post : undefined;
};

export const prerenderedCourse = (slug?: string): CoursePublic | undefined => {
  const course = read()?.course;
  return slug && course?.slug === slug ? course : undefined;
};

export const prerenderedPosts = (): BlogListItem[] | undefined => read()?.posts;

export const prerenderedAt = (): number | undefined => read()?.builtAt;
