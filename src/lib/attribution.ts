import { Mixpanel } from './mixpanel';

/**
 * Atribución de origen del usuario.
 *
 * Guarda dos toques en localStorage:
 * - primer toque (`pp_attr_first_v1`): se escribe una sola vez y no vence nunca.
 *   Es lo que responde "¿de dónde salió este usuario?" meses después.
 * - último toque (`pp_attr_last_v1`): se pisa cada vez que llega una campaña
 *   nueva y vence a los 90 días.
 *
 * Privacidad: solo se guarda el pathname del aterrizaje y hostname + pathname
 * del referrer. Nunca la query cruda, porque la propia app pone `?email=` en la
 * URL de retorno del checkout.
 */

const FIRST_TOUCH_KEY = 'pp_attr_first_v1';
const LAST_TOUCH_KEY = 'pp_attr_last_v1';
const LAST_TOUCH_TTL_MS = 90 * 24 * 60 * 60 * 1000;

const MAX_FIELD = 255;
const MAX_URL_FIELD = 500;

export interface Attribution {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  gclid: string | null;
  fbclid: string | null;
  landing_page: string | null;
  referrer: string | null;
  referring_domain: string | null;
  touched_at: string;
}

const CAMPAIGN_KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_content',
  'utm_term',
  'gclid',
  'fbclid'
] as const;

const trim = (value: string | null, max = MAX_FIELD): string | null => {
  if (!value) return null;
  const clean = value.trim();
  if (!clean) return null;
  return clean.slice(0, max);
};

const readStorage = (key: string): Attribution | null => {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Attribution;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeStorage = (key: string, value: Attribution) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Modo incógnito o storage lleno: la atribución es best-effort.
  }
};

/** Descarta el referrer propio y se queda con hostname + pathname del externo. */
const normalizeReferrer = (referrer: string): { referrer: string | null; domain: string | null } => {
  if (!referrer) return { referrer: null, domain: null };
  try {
    const url = new URL(referrer);
    if (url.hostname === window.location.hostname) {
      return { referrer: null, domain: null };
    }
    return {
      referrer: trim(`${url.hostname}${url.pathname}`, MAX_URL_FIELD),
      domain: trim(url.hostname)
    };
  } catch {
    return { referrer: null, domain: null };
  }
};

export const hasAnyCampaignParam = (attribution: Attribution | null): boolean => {
  if (!attribution) return false;
  return CAMPAIGN_KEYS.some((key) => Boolean(attribution[key]));
};

const buildAttribution = (search: string, referrer: string): Attribution => {
  const params = new URLSearchParams(search);
  const { referrer: cleanReferrer, domain } = normalizeReferrer(referrer);

  return {
    utm_source: trim(params.get('utm_source')),
    utm_medium: trim(params.get('utm_medium')),
    utm_campaign: trim(params.get('utm_campaign')),
    utm_content: trim(params.get('utm_content')),
    utm_term: trim(params.get('utm_term')),
    gclid: trim(params.get('gclid')),
    fbclid: trim(params.get('fbclid')),
    landing_page: trim(window.location.pathname, MAX_URL_FIELD),
    referrer: cleanReferrer,
    referring_domain: domain,
    touched_at: new Date().toISOString()
  };
};

/**
 * Captura el origen actual. Se llama al arranque de la app y cada vez que
 * cambia la query string.
 */
export const captureAttribution = (
  search: string = typeof window === 'undefined' ? '' : window.location.search,
  referrer: string = typeof document === 'undefined' ? '' : document.referrer
): void => {
  if (typeof window === 'undefined') return;

  const current = buildAttribution(search, referrer);
  const hasCampaign = hasAnyCampaignParam(current);

  // Primer toque: solo si no hay nada guardado. Se guarda incluso sin UTMs,
  // porque el referrer y la landing ya dicen bastante.
  if (!readStorage(FIRST_TOUCH_KEY)) {
    writeStorage(FIRST_TOUCH_KEY, current);
  }

  // Último toque: solo se pisa cuando llega una campaña real, para que una
  // navegación interna no borre el origen de la sesión.
  if (hasCampaign) {
    writeStorage(LAST_TOUCH_KEY, current);
  }
};

export const getFirstTouch = (): Attribution | null => {
  if (typeof window === 'undefined') return null;
  return readStorage(FIRST_TOUCH_KEY);
};

export const getLastTouch = (): Attribution | null => {
  if (typeof window === 'undefined') return null;
  const stored = readStorage(LAST_TOUCH_KEY);
  if (!stored) return null;
  const age = Date.now() - new Date(stored.touched_at).getTime();
  if (Number.isNaN(age) || age > LAST_TOUCH_TTL_MS) return null;
  return stored;
};

/** Props planas de primer toque para adjuntar a un evento puntual. */
export const getAttributionEventProps = (): Record<string, string | null> => {
  const first = getFirstTouch();
  if (!first) return {};
  return {
    first_utm_source: first.utm_source,
    first_utm_medium: first.utm_medium,
    first_utm_campaign: first.utm_campaign,
    first_utm_content: first.utm_content,
    first_utm_term: first.utm_term,
    first_landing_page: first.landing_page,
    first_referrer: first.referrer,
    first_referring_domain: first.referring_domain,
    first_touch_at: first.touched_at
  };
};

/** Propiedades de perfil de Mixpanel. Se escriben con set_once. */
export const getAttributionUserProps = (): Record<string, string | null> => {
  const first = getFirstTouch();
  if (!first) return {};
  return {
    initial_utm_source: first.utm_source,
    initial_utm_medium: first.utm_medium,
    initial_utm_campaign: first.utm_campaign,
    initial_utm_content: first.utm_content,
    initial_utm_term: first.utm_term,
    initial_landing_page: first.landing_page,
    initial_referrer: first.referrer,
    initial_referring_domain: first.referring_domain,
    initial_touch_at: first.touched_at
  };
};

/**
 * Metadata que viaja en el signUp de Supabase para que el trigger de creación
 * de perfil pueda persistir el origen sin un round trip extra.
 */
export const getFirstTouchForUserMetadata = (): Record<string, string> => {
  const first = getFirstTouch();
  if (!first) return {};
  const entries: Array<[string, string | null]> = [
    ['utm_source', first.utm_source],
    ['utm_medium', first.utm_medium],
    ['utm_campaign', first.utm_campaign],
    ['utm_content', first.utm_content],
    ['utm_term', first.utm_term],
    ['landing_page', first.landing_page],
    ['referrer', first.referrer]
  ];
  return Object.fromEntries(entries.filter(([, value]) => Boolean(value)) as Array<[string, string]>);
};

/** Argumentos del RPC set_signup_attribution. */
export const getSignupAttributionArgs = () => {
  const first = getFirstTouch();
  return {
    p_utm_source: first?.utm_source ?? null,
    p_utm_medium: first?.utm_medium ?? null,
    p_utm_campaign: first?.utm_campaign ?? null,
    p_utm_content: first?.utm_content ?? null,
    p_utm_term: first?.utm_term ?? null,
    p_landing_page: first?.landing_page ?? null,
    p_referrer: first?.referrer ?? null
  };
};

/**
 * Registra el origen como super properties para que TODOS los eventos viajen
 * atribuidos sin tener que pasarlo a mano en cada call site.
 */
export const registerAttributionSuperProps = (): void => {
  const first = getFirstTouch();
  if (first) {
    Mixpanel.register_once({
      first_utm_source: first.utm_source,
      first_utm_medium: first.utm_medium,
      first_utm_campaign: first.utm_campaign,
      first_utm_content: first.utm_content,
      first_utm_term: first.utm_term,
      first_landing_page: first.landing_page,
      first_referrer: first.referrer,
      first_referring_domain: first.referring_domain,
      first_touch_at: first.touched_at
    });
  }

  const last = getLastTouch();
  if (last) {
    Mixpanel.register({
      last_utm_source: last.utm_source,
      last_utm_medium: last.utm_medium,
      last_utm_campaign: last.utm_campaign,
      last_utm_content: last.utm_content,
      last_utm_term: last.utm_term,
      last_landing_page: last.landing_page,
      last_touch_at: last.touched_at
    });
  }
};
