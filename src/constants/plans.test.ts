import { describe, expect, it } from 'vitest';
import {
  ALL_PAID_PLANS,
  PREMIUM_PLANS,
  getPlanBadgeInfo,
  isPaidPlan,
  isPremiumPlan,
} from './plans';

/**
 * Las reglas de acceso por plan vivían duplicadas: constants/plans.ts las
 * declaraba y useSubscription repetía las mismas listas inline. Ahora hay una
 * sola fuente, y estos tests son lo que la mantiene honesta cuando se agregue
 * un plan.
 */

describe('reglas de plan', () => {
  it('todo plan premium es también un plan pago', () => {
    for (const plan of PREMIUM_PLANS) {
      expect(isPremiumPlan(plan)).toBe(true);
      expect(isPaidPlan(plan), `${plan} es premium pero no figura como pago`).toBe(true);
    }
  });

  it('free no es premium ni pago', () => {
    expect(isPremiumPlan('free')).toBe(false);
    expect(isPaidPlan('free')).toBe(false);
  });

  it('sin plan no da acceso', () => {
    for (const value of [undefined, '']) {
      expect(isPremiumPlan(value)).toBe(false);
      expect(isPaidPlan(value)).toBe(false);
    }
  });

  it('un plan desconocido no da acceso', () => {
    expect(isPremiumPlan('plan_que_no_existe')).toBe(false);
    expect(isPaidPlan('plan_que_no_existe')).toBe(false);
  });

  it('los planes B2B y de review son pagos pero no premium', () => {
    for (const plan of ['productprepa_business', 'productastic_review'] as const) {
      expect(isPaidPlan(plan)).toBe(true);
      expect(isPremiumPlan(plan), `${plan} no debería habilitar mentoría`).toBe(false);
    }
  });

  it('no hay planes repetidos', () => {
    expect(new Set(ALL_PAID_PLANS).size).toBe(ALL_PAID_PLANS.length);
  });
});

describe('getPlanBadgeInfo', () => {
  it('cada plan pago tiene su propia etiqueta, distinta de la de free', () => {
    const free = getPlanBadgeInfo('free').label;
    const labels = ALL_PAID_PLANS.map((p) => getPlanBadgeInfo(p).label);
    for (const [i, label] of labels.entries()) {
      expect(label, `${ALL_PAID_PLANS[i]} cae en el badge por defecto`).not.toBe(free);
    }
    expect(new Set(labels).size, 'dos planes comparten etiqueta').toBe(labels.length);
  });

  it('un plan desconocido cae en Free', () => {
    expect(getPlanBadgeInfo(undefined).label).toBe('Free');
    expect(getPlanBadgeInfo('plan_que_no_existe').label).toBe('Free');
  });
});
