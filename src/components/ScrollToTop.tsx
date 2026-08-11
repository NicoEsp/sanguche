import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    // Con ancla en la URL (ej. /planes#plan-business) el destino es la sección,
    // no el tope. react-router no resuelve el hash por su cuenta, así que si acá
    // se forzara scrollTo(0,0) el ancla no haría nada nunca.
    if (hash) {
      // El contenido de la ruta puede venir de un chunk lazy: se reintenta en el
      // frame siguiente si el nodo todavía no existe.
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      const raf = requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return () => cancelAnimationFrame(raf);
    }

    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
};
