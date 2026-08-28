import type { RequestOptions } from 'mixpanel-browser';

const MIXPANEL_TOKEN = '35fe7a2706398ebc90ae3f1012d0a558';

type MixpanelBrowser = typeof import('mixpanel-browser').default;

let mixpanelInstance: MixpanelBrowser | null = null;
let mixpanelLoader: Promise<MixpanelBrowser | null> | null = null;

type DisplayMode = 'browser' | 'standalone' | 'minimal-ui' | 'fullscreen';

/**
 * Detecta cómo se está viendo el sitio: pestaña normal o ventana de app instalada.
 * Sin esto no hay forma de saber cuánta gente usa la PWA — el dato no se capturaba.
 *
 * @returns El display mode activo, o 'browser' si no se puede determinar (SSR,
 *   o un navegador sin matchMedia).
 */
const getDisplayMode = (): DisplayMode => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return 'browser';
  }

  // iOS Safari no implementa la media query display-mode; expone navigator.standalone.
  if ((window.navigator as Navigator & { standalone?: boolean }).standalone === true) {
    return 'standalone';
  }

  const modes: DisplayMode[] = ['fullscreen', 'standalone', 'minimal-ui'];
  return modes.find((mode) => window.matchMedia(`(display-mode: ${mode})`).matches) ?? 'browser';
};

/**
 * Registra las super properties de display mode, que viajan en todos los eventos
 * sin tocar ningún call site.
 *
 * Hay que llamarla en el init y de nuevo después de cada reset(): Mixpanel borra
 * las super properties junto con el distinct_id, así que sin esto todos los
 * eventos posteriores a un logout quedarían sin display_mode.
 */
const registerDisplayModeProperties = (mixpanel: MixpanelBrowser): void => {
  const displayMode = getDisplayMode();
  mixpanel.register({
    display_mode: displayMode,
    is_pwa: displayMode !== 'browser'
  });
};

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
        // Se registran acá, no en main.tsx, para que ya estén puestas cuando resuelva
        // el primer track() encolado sobre este mismo import dinámico.
        registerDisplayModeProperties(mixpanel);
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
      // reset() limpia las super properties junto con el distinct_id. Sin volver a
      // registrarlas acá, todos los eventos que siguen al logout pierden display_mode
      // hasta la próxima carga completa de página (el init ya no vuelve a correr).
      registerDisplayModeProperties(mixpanel);
    });
  }
};
