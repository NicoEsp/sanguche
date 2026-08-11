import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { captureAttribution, registerAttributionSuperProps } from '@/lib/attribution';

/**
 * Mantiene viva la atribución mientras el usuario navega.
 *
 * El primer toque ya se captura en main.tsx antes del render, para no perderlo
 * si la app redirige apenas monta. Acá se cubren dos casos más: que llegue una
 * campaña en una navegación posterior, y volver a registrar las super
 * properties después de un Mixpanel.reset() (logout).
 *
 * Va fuera de AuthProvider a propósito: no depende de la sesión y no lo tiene
 * que bloquear el estado de carga de auth.
 */
export function AttributionTracker() {
  const { search } = useLocation();
  const registered = useRef(false);

  useEffect(() => {
    captureAttribution(search);

    if (!registered.current) {
      registered.current = true;
      registerAttributionSuperProps();
    }
  }, [search]);

  return null;
}
