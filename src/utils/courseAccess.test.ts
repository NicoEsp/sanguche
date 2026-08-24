import { describe, expect, it } from 'vitest';
import { resolveCourseAccess } from './courseAccess';

/**
 * El catálogo pedía el acceso global (sin slug) y lo aplicaba a cada tarjeta,
 * así que un suscriptor de curso_estrategia veía todos los cursos sin candado
 * y recién chocaba con el paywall al entrar. Estos tests fijan la regla por
 * curso.
 */

const ESTRATEGIA = 'estrategia-producto-principiantes';
const OTRO = 'descubrimiento-de-usuarios';

const subscriber = (plan: string) => ({
  isAuthenticated: true,
  hasSubscription: true,
  plan,
});

describe('resolveCourseAccess', () => {
  it('un anónimo no entra ni a los cursos gratis', () => {
    const r = resolveCourseAccess({
      isAuthenticated: false,
      hasSubscription: false,
      plan: null,
      courseSlug: OTRO,
      isFreeCourse: true,
    });
    expect(r.hasAccess).toBe(false);
    expect(r.reason).toBe('authenticated');
  });

  it('un curso gratis lo abre cualquier autenticado, aun sin suscripción', () => {
    const r = resolveCourseAccess({
      isAuthenticated: true,
      hasSubscription: false,
      plan: null,
      courseSlug: OTRO,
      isFreeCourse: true,
    });
    expect(r.hasAccess).toBe(true);
    expect(r.reason).toBe('free_course');
  });

  it.each(['cursos_all', 'repremium'])('%s abre todo el catálogo', (plan) => {
    for (const slug of [ESTRATEGIA, OTRO]) {
      expect(resolveCourseAccess({ ...subscriber(plan), courseSlug: slug }).hasAccess).toBe(true);
    }
  });

  describe('curso_estrategia', () => {
    it('abre su curso', () => {
      const r = resolveCourseAccess({ ...subscriber('curso_estrategia'), courseSlug: ESTRATEGIA });
      expect(r.hasAccess).toBe(true);
    });

    it('NO abre los demás — el bug del catálogo', () => {
      const r = resolveCourseAccess({ ...subscriber('curso_estrategia'), courseSlug: OTRO });
      expect(r.hasAccess).toBe(false);
      expect(r.reason).toBe('wrong_plan');
    });

    it('sin slug responde la pregunta global: tiene acceso a algún curso', () => {
      expect(resolveCourseAccess({ ...subscriber('curso_estrategia') }).hasAccess).toBe(true);
    });
  });

  it.each(['free', 'premium'])('%s no incluye cursos', (plan) => {
    const r = resolveCourseAccess({ ...subscriber(plan), courseSlug: ESTRATEGIA });
    expect(r.hasAccess).toBe(false);
    expect(r.reason).toBe('wrong_plan');
  });

  it('autenticado sin suscripción no entra a un curso pago', () => {
    const r = resolveCourseAccess({
      isAuthenticated: true,
      hasSubscription: false,
      plan: null,
      courseSlug: ESTRATEGIA,
    });
    expect(r.hasAccess).toBe(false);
    expect(r.reason).toBe('no_subscription');
  });
});
