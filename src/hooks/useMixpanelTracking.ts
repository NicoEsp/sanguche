import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Mixpanel } from '@/lib/mixpanel';
import { useAuth } from '@/contexts/AuthContext';

export function useMixpanelTracking() {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Identificar usuario cuando hace login
  useEffect(() => {
    if (isAuthenticated && user) {
      Mixpanel.identify(user.id);
      Mixpanel.people.set({
        $email: user.email,
        $name: user.user_metadata?.name || 'Usuario',
        $created: user.created_at
      });
    }
  }, [isAuthenticated, user]);

  // Track page views automáticamente
  useEffect(() => {
    Mixpanel.track('page_view', {
      page_path: location.pathname,
      page_title: document.title,
      referrer: document.referrer,
      user_id: user?.id
    });
  }, [location, user]);

  const trackEvent = useCallback((eventName: string, properties?: Record<string, any>) => {
    Mixpanel.track(eventName, {
      ...properties,
      user_id: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [user]);

  const setUserProperties = useCallback((properties: Record<string, any>) => {
    if (isAuthenticated) {
      Mixpanel.people.set(properties);
    }
  }, [isAuthenticated]);

  return { trackEvent, setUserProperties };
}
