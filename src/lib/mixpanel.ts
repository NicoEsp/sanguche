import type { RequestOptions } from 'mixpanel-browser';

const MIXPANEL_TOKEN = '35fe7a2706398ebc90ae3f1012d0a558';

type MixpanelBrowser = typeof import('mixpanel-browser').default;

let mixpanelInstance: MixpanelBrowser | null = null;
let mixpanelLoader: Promise<MixpanelBrowser | null> | null = null;

const loadMixpanel = async (): Promise<MixpanelBrowser | null> => {
  if (typeof window === 'undefined') {
    return null;
  }

  if (!MIXPANEL_TOKEN) {
    return null;
  }

  if (mixpanelInstance) {
    return mixpanelInstance;
  }

  if (!mixpanelLoader) {
    mixpanelLoader = import('mixpanel-browser')
      .then((mixpanelModule) => {
        const mixpanel = mixpanelModule.default;
        mixpanel.init(MIXPANEL_TOKEN, {
          debug: import.meta.env.DEV,
          track_pageview: false,
          persistence: 'localStorage'
        });
        mixpanelInstance = mixpanel;
        return mixpanelInstance;
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.error('Mixpanel failed to load', error);
        }
        mixpanelLoader = null;
        return null;
      });
  }

  return mixpanelLoader;
};

const withMixpanel = (callback: (mixpanel: MixpanelBrowser) => void) => {
  void loadMixpanel().then((instance) => {
    if (instance) {
      callback(instance);
    }
  });
};

export const Mixpanel = {
  identify: (userId: string) => {
    withMixpanel((mixpanel) => {
      mixpanel.identify(userId);
    });
  },

  alias: (userId: string) => {
    withMixpanel((mixpanel) => {
      mixpanel.alias(userId);
    });
  },

  track: (name: string, props?: Record<string, any>, options?: RequestOptions) => {
    // Camino síncrono: al ocultarse la pestaña no hay tiempo para resolver el
    // import dinámico, así que los eventos de salida solo llegan si la instancia ya existe.
    if (mixpanelInstance) {
      mixpanelInstance.track(name, props, options);
      return;
    }
    withMixpanel((mixpanel) => {
      mixpanel.track(name, props, options);
    });
  },

  people: {
    set: (props: Record<string, any>) => {
      withMixpanel((mixpanel) => {
        mixpanel.people.set(props);
      });
    }
  },

  reset: () => {
    withMixpanel((mixpanel) => {
      mixpanel.reset();
    });
  }
};
