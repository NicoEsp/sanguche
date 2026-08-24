import { useCallback } from 'react';
import type { RequestOptions } from 'mixpanel-browser';
import { Mixpanel } from '@/lib/mixpanel';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Sólo emisores de eventos. identify y page_view viven en <AnalyticsTracker/>,
 * que se monta una vez: acá se duplicaban por cada componente que llamaba al
 * hook para poder usar trackEvent.
 */
export function useMixpanelTracking() {
  const { user, isAuthenticated } = useAuth();

  const userId = user?.id;

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>, options?: RequestOptions) => {
    Mixpanel.track(eventName, {
      ...properties,
      user_id: userId,
      timestamp: new Date().toISOString()
    }, options);
  }, [userId]);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    if (isAuthenticated) {
      Mixpanel.people.set(properties);
    }
  }, [isAuthenticated]);

  return { trackEvent, setUserProperties };
}
