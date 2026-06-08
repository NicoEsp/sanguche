// Checkouts directos de LemonSqueezy (hosted URLs).
// A diferencia de los planes premium/repremium/cursos, estos productos no pasan
// por la edge function `lemon-squeezy-checkout`: el front redirige directo al
// checkout hosteado.
//
// IMPORTANTE — Redirect post-pago:
// El parámetro `checkout[success_url]` que se agrega abajo NO está documentado
// para los hosted `/checkout/buy/...` URLs (sólo se usa cuando se crea el
// checkout vía API con `product_options.redirect_url`). LemonSqueezy puede
// ignorarlo y dejar al usuario en la pantalla por defecto de "My Orders".
// El redirect REAL al `successPath` tiene que estar configurado en el panel
// de LemonSqueezy → Products → cada producto → "Confirmation" / "Redirect URL".
// Dejamos el query param igual como capa extra por si LS lo respeta.

export type DirectCheckoutKey = 'productastic_review' | 'productprepa_business';

interface DirectCheckoutConfig {
  /** UUID público del checkout en LemonSqueezy (parte de la URL /checkout/buy/UUID) */
  checkoutUuid: string;
  /** Path interno al que LemonSqueezy debe redirigir al completar el pago */
  successPath: string;
}

const DIRECT_CHECKOUTS: Record<DirectCheckoutKey, DirectCheckoutConfig> = {
  productastic_review: {
    checkoutUuid: '3c3c70c8-4630-44aa-9260-91e228512e9e',
    successPath: '/gracias-review',
  },
  productprepa_business: {
    checkoutUuid: '2ea94e55-8e80-4cd8-ab22-f415626597ed',
    successPath: '/gracias-b2b',
  },
};

const LEMONSQUEEZY_STORE_BASE = 'https://nicoproducto.lemonsqueezy.com/checkout/buy';

interface BuildOptions {
  /** Email para pre-cargar el checkout (opcional). */
  email?: string;
  /** Origin para armar el success_url (typically window.location.origin) */
  origin: string;
}

export function buildDirectCheckoutUrl(key: DirectCheckoutKey, options: BuildOptions): string {
  const config = DIRECT_CHECKOUTS[key];
  const successUrl = `${options.origin}${config.successPath}?success=true&plan=${key}`;

  const params = new URLSearchParams();
  params.set('checkout[success_url]', successUrl);
  if (options.email) {
    params.set('checkout[email]', options.email);
  }
  params.set('checkout[custom][plan]', key);

  return `${LEMONSQUEEZY_STORE_BASE}/${config.checkoutUuid}?${params.toString()}`;
}
