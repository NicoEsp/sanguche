import { matchPath } from "react-router-dom";
import { lazyPage } from "@/lib/lazyPage";

// Páginas públicas y de usuario, con code splitting. lazyPage además permite
// precargarlas: ver preloadRoute y main.tsx.
export const Index = lazyPage(() => import("./pages/Index"));
export const Assessment = lazyPage(() => import("./pages/Assessment"));
export const SkillGaps = lazyPage(() => import("./pages/SkillGaps"));
export const Recommendations = lazyPage(() => import("./pages/Recommendations"));
export const Progress = lazyPage(() => import("./pages/Progress"));
export const Planes = lazyPage(() => import("./pages/Planes"));
export const CursosInfo = lazyPage(() => import("./pages/CursosInfo"));
export const Profile = lazyPage(() => import("./pages/Profile"));
export const Auth = lazyPage(() => import("./pages/Auth"));
export const Welcome = lazyPage(() => import("./pages/Welcome"));
export const GraciasReview = lazyPage(() => import("./pages/GraciasReview"));
export const GraciasB2B = lazyPage(() => import("./pages/GraciasB2B"));
export const NotFound = lazyPage(() => import("./pages/NotFound"));
export const Courses = lazyPage(() => import("./pages/Courses"));
export const CourseDetail = lazyPage(() => import("./pages/CourseDetail"));
export const Descargables = lazyPage(() => import("./pages/Descargables"));
export const SoyDev = lazyPage(() => import("./pages/SoyDev"));
export const EvaluacionProductManager = lazyPage(() => import("./pages/EvaluacionProductManager"));
export const Empresas = lazyPage(() => import("./pages/Empresas"));
export const SessionReservation = lazyPage(() => import("./pages/SessionReservation"));
export const BlogList = lazyPage(() => import("./pages/BlogList"));
export const BlogPost = lazyPage(() => import("./pages/BlogPost"));

/**
 * Página de cada ruta, para precargar su chunk antes del primer render. Si se
 * suma una ruta a <Routes> y no acá, solo pierde la precarga.
 */
const ROUTE_PAGES: ReadonlyArray<readonly [string, { preload: () => Promise<void> }]> = [
  ["/", Index],
  ["/auth", Auth],
  ["/planes", Planes],
  ["/cursos-info", CursosInfo],
  ["/welcome", Welcome],
  ["/gracias-review", GraciasReview],
  ["/gracias-b2b", GraciasB2B],
  ["/descargables", Descargables],
  ["/soy-dev", SoyDev],
  ["/evaluacion-product-manager", EvaluacionProductManager],
  ["/empresas", Empresas],
  ["/sesion/:slug", SessionReservation],
  ["/blog", BlogList],
  ["/blog/:slug", BlogPost],
  ["/cursos", Courses],
  ["/cursos/:slug", CourseDetail],
  ["/perfil", Profile],
  ["/autoevaluacion", Assessment],
  ["/mejoras", SkillGaps],
  ["/mentoria", Recommendations],
  ["/progreso", Progress],
];

/**
 * Descarga el chunk de la página que corresponde a la URL. Nunca rechaza: es
 * una ayuda. Si el chunk falla, el render de la página lo vuelve a pedir y ahí
 * el error sigue su camino normal (vite:preloadError o el ErrorBoundary).
 */
export function preloadRoute(pathname: string): Promise<void> {
  const match = ROUTE_PAGES.find(([path]) => matchPath(path, pathname));
  return match ? match[1].preload().catch(() => undefined) : Promise.resolve();
}
