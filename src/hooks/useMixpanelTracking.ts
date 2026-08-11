import { useCallback, useEffect, useRef } from 'react';
import { Mixpanel } from '@/lib/mixpanel';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Helper para emitir eventos de producto desde cualquier componente.
 *
 * Ya NO emite `page_view` (eso vive en PageViewTracker, montado una sola vez en
 * App.tsx) ni hace `identify` (eso vive en AuthContext, donde está la sesión).
 * Montar este hook solo tiene sentido si el componente necesita `trackEvent`.
 */
export function useMixpanelTracking() {
  const { user, isAuthenticated } = useAuth();

  // El objeto `user` de Supabase cambia de identidad en cada refresco de token.
  // Guardarlo en un ref permite dejar `trackEvent` estable de por vida y que no
  // re-dispare los efectos de quien lo tenga en su array de dependencias.
  const userRef = useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    Mixpanel.track(eventName, {
      ...properties,
      user_id: userRef.current?.id,
      timestamp: new Date().toISOString()
    });
  }, []);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    if (isAuthenticated) {
      Mixpanel.people.set(properties);
    }
  }, [isAuthenticated]);

  return { trackEvent, setUserProperties };
}
