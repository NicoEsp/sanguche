/**
 * Cuándo una suscripción da acceso.
 *
 * Pura y fuera del hook para poder testearla, igual que courseAccess: importar
 * useSubscription arrastra el cliente de Supabase, que explota sin credenciales.
 */

export type EntitlementInput = {
  status?: string | null;
  /** Fin del período ya pagado. */
  currentPeriodEnd?: Date | string | null;
  /** Cortesía puesta a mano por un admin: manda sobre el status. */
  isComped?: boolean;
  /** Inyectable para testear. */
  now?: Date;
};

export function hasEntitledAccess({
  status,
  currentPeriodEnd,
  isComped,
  now = new Date(),
}: EntitlementInput): boolean {
  // Cortesía: da acceso pase lo que pase con el status, que es justamente para
  // lo que existe (por ejemplo con la suscripción dada de baja en LemonSqueezy).
  if (isComped === true) return true;

  if (status === 'active') return true;

  // Cancelar en LemonSqueezy marca la baja pero el período ya pagado sigue
  // corriendo, y la app lo promete explícitamente al cancelar: "Seguirás
  // teniendo acceso hasta el fin del período actual". Sin esta rama el acceso
  // se cortaba en el momento de cancelar.
  if (status === 'cancelled' && currentPeriodEnd) {
    return now < new Date(currentPeriodEnd);
  }

  return false;
}
