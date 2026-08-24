/**
 * Marca que la salida de la página es una redirección al checkout.
 *
 * El sensor de abandono de /planes escucha `pagehide`, y mandar a alguien a
 * Lemon Squeezy dispara ese mismo evento: sin esta marca, cada persona que
 * compraba quedaba contada como planes_page_abandoned — justo al revés de lo
 * que el sensor viene a medir.
 *
 * Es una variable de módulo y no sessionStorage a propósito: tiene que valer
 * sólo para esta carga de la página. Al volver del checkout la página se carga
 * de nuevo, el flag arranca en false y un abandono posterior sí se registra.
 */
let redirectingToCheckout = false;

export const markCheckoutRedirect = () => {
  redirectingToCheckout = true;
};

export const isCheckoutRedirect = () => redirectingToCheckout;
