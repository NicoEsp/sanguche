import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { isUpdateAvailable } from "@/lib/versionCheck";

/**
 * Si hay un deploy nuevo, la próxima navegación dentro del SPA se hace como
 * carga completa. Es el único momento en que recargar no le hace perder nada
 * a nadie: la persona ya se estaba yendo de esa pantalla.
 */
export function VersionReloader() {
  const { pathname } = useLocation();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isUpdateAvailable()) window.location.reload();
  }, [pathname]);

  return null;
}
