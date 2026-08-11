/**
 * Detecta si la carga actual es el retorno de una compra.
 *
 * Los checkouts creados por la edge function vuelven con `?success=true` en la
 * URL, pero los de pago directo (Productastic Review y ProductPrepa for
 * Business) usan el checkout hosteado de LemonSqueezy, que no soporta
 * `checkout[success_url]`: el redirect se configura en el panel y aterriza en
 * la URL pelada. Para esos, la única señal disponible es el referrer.
 *
 * Confirmado en Mixpanel: los checkout_completed de /welcome traen la query
 * completa y los de /gracias-review y /gracias-b2b llegaron siempre sin query.
 */

const CHECKOUT_REFERRER_HOSTS = ['lemonsqueezy.com', 'lemonsqueezy.dev'];

export const isReturningFromCheckout = (search: string): boolean => {
  if (new URLSearchParams(search).get('success') === 'true') return true;

  if (typeof document === 'undefined' || !document.referrer) return false;
  try {
    const { hostname } = new URL(document.referrer);
    return CHECKOUT_REFERRER_HOSTS.some(
      (host) => hostname === host || hostname.endsWith(`.${host}`)
    );
  } catch {
    return false;
  }
};
