// El token de producción queda como fallback para no dejar el tracking mudo si
// la env no está configurada en el entorno de deploy. En local se puede apuntar
// a un proyecto de prueba con VITE_MIXPANEL_TOKEN sin tocar el código.
const MIXPANEL_TOKEN =
  (import.meta.env.VITE_MIXPANEL_TOKEN as string | undefined) || '35fe7a2706398ebc90ae3f1012d0a558';

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
          persistence: 'localStorage',
          // El checkout hace window.location.href a LemonSqueezy: con la ventana
          // de batch por defecto los últimos eventos se pierden en el unload.
          batch_flush_interval_ms: 2000
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

  track: (name: string, props?: Record<string, any>) => {
    withMixpanel((mixpanel) => {
      mixpanel.track(name, props);
    });
  },

  /** Super properties: se adjuntan a todos los eventos siguientes. */
  register: (props: Record<string, any>) => {
    withMixpanel((mixpanel) => {
      mixpanel.register(props);
    });
  },

  /** Super properties de primer toque: no pisan un valor ya registrado. */
  register_once: (props: Record<string, any>) => {
    withMixpanel((mixpanel) => {
      mixpanel.register_once(props);
    });
  },

  people: {
    set: (props: Record<string, any>) => {
      withMixpanel((mixpanel) => {
        mixpanel.people.set(props);
      });
    },

    /** Escribe la propiedad de perfil solo si todavía no existe. */
    set_once: (props: Record<string, any>) => {
      withMixpanel((mixpanel) => {
        mixpanel.people.set_once(props);
      });
    }
  },

  reset: () => {
    withMixpanel((mixpanel) => {
      mixpanel.reset();
    });
  },

  /** Resuelve cuando el chunk de Mixpanel está cargado (o null si no pudo cargar). */
  ready: () => loadMixpanel()
};
