import mixpanel from 'mixpanel-browser';

const MIXPANEL_TOKEN = '35fe7a2706398ebc90ae3f1012d0a558';

// Inicializar Mixpanel
mixpanel.init(MIXPANEL_TOKEN, {
  debug: import.meta.env.DEV, // Debug en desarrollo
  track_pageview: false, // Desactivar auto-tracking, lo haremos manual
  persistence: 'localStorage'
});

export const Mixpanel = {
  identify: (userId: string) => {
    mixpanel.identify(userId);
  },
  
  alias: (userId: string) => {
    mixpanel.alias(userId);
  },
  
  track: (name: string, props?: Record<string, any>) => {
    mixpanel.track(name, props);
  },
  
  people: {
    set: (props: Record<string, any>) => {
      mixpanel.people.set(props);
    }
  },
  
  reset: () => {
    mixpanel.reset();
  }
};
