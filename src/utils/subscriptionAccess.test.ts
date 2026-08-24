import { describe, expect, it } from 'vitest';
import { hasEntitledAccess } from './subscriptionAccess';

/**
 * Al cancelar, la app promete por toast y por diálogo: "Seguirás teniendo
 * acceso hasta el fin del período actual". El cálculo miraba sólo
 * status === 'active', así que el acceso se cortaba en el momento de cancelar.
 */

const AHORA = new Date('2026-08-24T12:00:00Z');
const FUTURO = new Date('2026-09-12T12:00:00Z');
const PASADO = new Date('2026-08-01T12:00:00Z');

describe('hasEntitledAccess', () => {
  it('una suscripción activa tiene acceso', () => {
    expect(hasEntitledAccess({ status: 'active', now: AHORA })).toBe(true);
  });

  it('una baja con el período pagado todavía corriendo mantiene el acceso', () => {
    expect(
      hasEntitledAccess({ status: 'cancelled', currentPeriodEnd: FUTURO, now: AHORA }),
    ).toBe(true);
  });

  it('una baja con el período ya vencido pierde el acceso', () => {
    expect(
      hasEntitledAccess({ status: 'cancelled', currentPeriodEnd: PASADO, now: AHORA }),
    ).toBe(false);
  });

  it('una baja sin fecha de fin pierde el acceso', () => {
    expect(hasEntitledAccess({ status: 'cancelled', currentPeriodEnd: null, now: AHORA })).toBe(false);
  });

  it('acepta la fecha como string ISO', () => {
    expect(
      hasEntitledAccess({ status: 'cancelled', currentPeriodEnd: FUTURO.toISOString(), now: AHORA }),
    ).toBe(true);
  });

  it('la cortesía manda sobre cualquier status', () => {
    expect(hasEntitledAccess({ status: 'cancelled', isComped: true, now: AHORA })).toBe(true);
    expect(hasEntitledAccess({ status: 'expired', isComped: true, now: AHORA })).toBe(true);
  });

  it('sin suscripción no hay acceso', () => {
    expect(hasEntitledAccess({ now: AHORA })).toBe(false);
    expect(hasEntitledAccess({ status: null, currentPeriodEnd: null, now: AHORA })).toBe(false);
  });

  it('un status desconocido no da acceso aunque quede período', () => {
    expect(
      hasEntitledAccess({ status: 'expired', currentPeriodEnd: FUTURO, now: AHORA }),
    ).toBe(false);
  });

  it('justo en el instante del vencimiento ya no hay acceso', () => {
    expect(
      hasEntitledAccess({ status: 'cancelled', currentPeriodEnd: AHORA, now: AHORA }),
    ).toBe(false);
  });
});
