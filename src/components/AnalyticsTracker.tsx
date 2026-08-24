import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Mixpanel } from '@/lib/mixpanel';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Identify y page_view, una sola vez por app.
 *
 * Antes vivían dentro de useMixpanelTracking, que también expone trackEvent.
 * Como cada componente que quiere trackear un evento llama al hook, cada uno
 * se llevaba además su propia copia del efecto de page_view: hoy hay 21 call
 * sites y varios conviven en la misma pantalla. En /planes son cinco, y en
 * /descargables DownloadableCard llama al hook por tarjeta, así que una sola
 * navegación disparaba un page_view por cada card renderizada.
 *
 * Se monta una vez en App.tsx, adentro del Router (por useLocation) y del
 * AuthProvider (por useAuth).
 */
export function AnalyticsTracker() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Keyeado por el id y no por el objeto: supabase-js devuelve un objeto nuevo
  // para la misma sesión cada vez que revalida (volver a la pestaña dispara
  // _recoverAndRefresh y re-emite SIGNED_IN), y con el objeto en las deps eso
  // repetía identify y mandaba otro page_view sin que el usuario navegara.
  const userId = user?.id;

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    Mixpanel.identify(user.id);
    Mixpanel.people.set({
      $email: user.email,
      $name: user.user_metadata?.name || 'Usuario',
      $created: user.created_at,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, userId]);

  useEffect(() => {
    Mixpanel.track('page_view', {
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer,
      user_id: userId,
    });
  }, [location.pathname, userId]);

  return null;
}
