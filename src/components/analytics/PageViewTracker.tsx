import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { Mixpanel } from '@/lib/mixpanel';

/**
 * Único emisor de `page_view` de la app.
 *
 * Antes el evento vivía dentro de useMixpanelTracking, así que se disparaba una
 * vez por cada componente que montaba el hook: /planes emitía 6 vistas por carga
 * y /blog, /soy-dev, /cursos y /sesion no emitían ninguna. Acá se emite una sola
 * vez por navegación, para todas las rutas.
 */

/**
 * Params que sí aportan contexto de producto. Todo lo demás se descarta: la
 * URL de retorno del checkout lleva `?email=`, y esa query no puede terminar
 * en un evento de analytics.
 */
const SAFE_QUERY_PARAMS = new Set([
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid',
  'plan',
  'success',
  'tipo',
  'reevaluar',
  'anonymous',
  'new_user',
]);

const safeSearch = (search: string): string | null => {
  if (!search) return null;
  const source = new URLSearchParams(search);
  const safe = new URLSearchParams();
  source.forEach((value, key) => {
    if (SAFE_QUERY_PARAMS.has(key)) safe.append(key, value);
  });
  const result = safe.toString();
  return result ? `?${result}` : null;
};

export function PageViewTracker() {
  const { pathname, search } = useLocation();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    // El panel de administración no es producto: queda fuera de las métricas.
    // Se registra igual en el ref para que volver de /admin a la misma ruta
    // pública desde la que se entró vuelva a contar como vista.
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      lastTrackedPath.current = pathname;
      return;
    }

    // Blindaje contra StrictMode y contra los navigate(..., {replace:true})
    // que hacen useHomeRedirect y Assessment al limpiar query params.
    if (lastTrackedPath.current === pathname) return;
    lastTrackedPath.current = pathname;

    Mixpanel.track('page_view', {
      page_path: pathname,
      page_search: safeSearch(search),
      referrer: document.referrer || null
    });
    // `search` queda fuera de las deps a propósito: viaja como propiedad del
    // evento, pero un cambio de query no es una vista nueva.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  return null;
}
