import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Cuánto se espera a que aparezca el ancla antes de rendirse. */
const HASH_TARGET_TIMEOUT_MS = 2000;

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Con ancla en la URL (ej. /planes#plan-review) el destino es la sección,
    // no el tope. react-router no resuelve el hash por su cuenta, así que si
    // acá se forzara scrollTo(0,0) el ancla no haría nada nunca.
    if (hash) {
      let frame = 0;
      const deadline = Date.now() + HASH_TARGET_TIMEOUT_MS;

      // El contenido de la ruta viene de un chunk lazy: en la carga directa de
      // /planes#plan-review el nodo tarda bastante más de un frame en existir,
      // por eso se reintenta hasta que aparece.
      const tryScroll = () => {
        let target: Element | null = null;
        try {
          target = document.querySelector(hash);
        } catch {
          // Un hash que no es un selector CSS válido no es un ancla.
          return;
        }
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }
        if (Date.now() < deadline) frame = requestAnimationFrame(tryScroll);
      };

      frame = requestAnimationFrame(tryScroll);
      return () => cancelAnimationFrame(frame);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};
