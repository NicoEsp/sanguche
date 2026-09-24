import { supabase } from "@/integrations/supabase/client";

/** Tienda de LemonSqueezy: sirve los checkouts hosteados y los creados por API. */
export const LEMONSQUEEZY_STORE_ORIGIN = "https://nicoproducto.lemonsqueezy.com";

let preconnectLink: HTMLLinkElement | null = null;
let lastPreconnectAt = 0;

/**
 * Abre la conexión con LemonSqueezy (DNS + TCP + TLS) antes de navegar, así el
 * redirect no la paga. Se renueva si pasaron más de 8 s: el navegador cierra a
 * los ~10 s una conexión preabierta que no se usó, y entre el hover y el envío
 * del email puede pasar más que eso.
 */
export function preconnectCheckout(): void {
  const now = Date.now();
  if (now - lastPreconnectAt < 8_000) return;
  lastPreconnectAt = now;

  preconnectLink?.remove();
  preconnectLink = document.createElement("link");
  preconnectLink.rel = "preconnect";
  preconnectLink.href = LEMONSQUEEZY_STORE_ORIGIN;
  document.head.appendChild(preconnectLink);
}

let functionWarmedUp = false;

/**
 * Deja listo el checkout por API antes del clic: preconecta con LemonSqueezy y
 * levanta la edge function, así el clic no paga el cold start ni el preflight
 * CORS (la función lo cachea). La función responde 204 sin tocar la base.
 */
export function warmUpCheckout(): void {
  preconnectCheckout();
  if (functionWarmedUp) return;
  functionWarmedUp = true;
  void supabase.functions.invoke("lemon-squeezy-checkout", { body: { warmup: true } });
}
