import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import type { RequestOptions } from 'mixpanel-browser';
import { Mixpanel } from '@/lib/mixpanel';
import { useAuth } from '@/contexts/AuthContext';

// Estado compartido entre todas las instancias del hook. En una misma pantalla
// lo llaman la página y varios componentes (un botón de checkout, un modal,
// una card), y cada instancia corría sus propios efectos: /planes registraba
// seis page_view por visita y /descargables llegó a once. Se identifica una
// vez por usuario y se registra un page_view por navegación, sin importar
// cuántas instancias haya montadas.
let identifiedUserId: string | null = null;
let trackedLocationKey: string | null = null;

export function useMixpanelTracking() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated || !user) {
      // Mixpanel.reset() en el logout cambia el distinct_id, así que el próximo
      // login tiene que volver a identificar aunque sea el mismo usuario.
      identifiedUserId = null;
      return;
    }
    if (identifiedUserId === user.id) return;
    identifiedUserId = user.id;
    Mixpanel.identify(user.id);
    Mixpanel.people.set({
      $email: user.email,
      $name: user.user_metadata?.name || 'Usuario',
      $created: user.created_at
    });
  }, [isAuthenticated, user]);

  // location.key cambia con cada entrada del historial: volver a la misma ruta
  // cuenta como otra vista, montar otro componente en la misma pantalla no.
  useEffect(() => {
    if (trackedLocationKey === location.key) return;
    trackedLocationKey = location.key;
    Mixpanel.track('page_view', {
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer,
      user_id: user?.id
    });
  }, [location.key, location.pathname, user?.id]);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, unknown>, options?: RequestOptions) => {
    Mixpanel.track(eventName, {
      ...properties,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    }, options);
  }, [user]);

  const setUserProperties = useCallback((properties: Record<string, unknown>) => {
    if (isAuthenticated) {
      Mixpanel.people.set(properties);
    }
  }, [isAuthenticated]);

  return { trackEvent, setUserProperties };
}
