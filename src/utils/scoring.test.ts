import { describe, expect, it } from 'vitest';
import {
  ASSESSMENT_TYPES,
  BUILDER_DOMAINS,
  DOMAINS,
  LIDER_DOMAINS,
  SIN_EXPERIENCIA_DOMAINS,
  computeSeniorityScore,
  getAllScorableDomains,
  getAssessmentSchema,
  getAssessmentTypeShortLabel,
  getDomainsForType,
  type AnyAssessmentValues,
  type AssessmentTypeKey,
} from './scoring';

/**
 * scoring.ts es el núcleo del producto y no tenía tests. Es también lo que más
 * va a moverse: cada perfil nuevo agrega un set de dominios y una lectura
 * propia. Estos tests fijan las reglas que no deberían cambiar sin querer —
 * umbrales de nivel, qué cuenta como brecha o fortaleza, y que cada perfil
 * puntúe exactamente sus dominios.
 */

const TYPES: AssessmentTypeKey[] = ['experimentado', 'sin_experiencia', 'builder', 'lider'];

/** Respuestas completas para un perfil, todas con el mismo valor. */
const answersFor = (type: AssessmentTypeKey, value: number): AnyAssessmentValues =>
  Object.fromEntries(getDomainsForType(type).map((d) => [d.key, value]));

describe('getDomainsForType', () => {
  it('da un set propio por perfil', () => {
    expect(getDomainsForType('experimentado')).toBe(DOMAINS);
    expect(getDomainsForType('sin_experiencia')).toBe(SIN_EXPERIENCIA_DOMAINS);
    expect(getDomainsForType('builder')).toBe(BUILDER_DOMAINS);
    expect(getDomainsForType('lider')).toBe(LIDER_DOMAINS);
  });

  it.each(TYPES)('%s no repite claves de dominio', (type) => {
    const keys = getDomainsForType(type).map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it.each(TYPES)('%s tiene label en todos sus dominios', (type) => {
    for (const d of getDomainsForType(type)) expect(d.label).toBeTruthy();
  });
});

describe('getAssessmentSchema', () => {
  it.each(TYPES)('%s exige exactamente los dominios de su perfil', (type) => {
    const schema = getAssessmentSchema(type);
    const complete = answersFor(type, 3);
    expect(schema.safeParse(complete).success).toBe(true);

    // Falta una respuesta -> no valida
    const keys = Object.keys(complete);
    const incomplete = { ...complete };
    delete incomplete[keys[0]];
    expect(schema.safeParse(incomplete).success).toBe(false);
  });

  it.each(TYPES)('%s rechaza valores fuera de 1..5', (type) => {
    const schema = getAssessmentSchema(type);
    const key = getDomainsForType(type)[0].key;
    for (const bad of [0, 6, 2.5]) {
      expect(schema.safeParse({ ...answersFor(type, 3), [key]: bad }).success).toBe(false);
    }
  });
});

describe('computeSeniorityScore — umbrales de nivel', () => {
  const nivelFor = (value: number) =>
    computeSeniorityScore(answersFor('experimentado', value), undefined, 'experimentado').nivel;

  it('mapea el promedio al nivel', () => {
    expect(nivelFor(1)).toBe('Junior'); // <= 2.0
    expect(nivelFor(2)).toBe('Junior');
    expect(nivelFor(3)).toBe('Mid'); // <= 3.2
    expect(nivelFor(4)).toBe('Senior'); // <= 4.2
    expect(nivelFor(5)).toBe('Head'); // > 4.6
  });

  it('promedio y desviación de respuestas uniformes', () => {
    const r = computeSeniorityScore(answersFor('experimentado', 4), undefined, 'experimentado');
    expect(r.promedioGlobal).toBe(4);
    expect(r.standardDeviation).toBe(0);
  });
});

describe('computeSeniorityScore — brechas y fortalezas', () => {
  const keys = DOMAINS.map((d) => d.key);
  // Un valor por dominio, cubriendo cada banda.
  const mixed = Object.fromEntries(
    keys.map((k, i) => [k, [2, 2, 3, 3, 4, 4, 5, 5, 1, 3, 4][i % 11]]),
  ) as AnyAssessmentValues;
  const result = computeSeniorityScore(mixed, undefined, 'experimentado');

  it('brecha es < 3, fortaleza es >= 4, y el resto queda neutral', () => {
    for (const g of result.gaps) expect(g.value).toBeLessThan(3);
    for (const s of result.strengths) expect(s.value).toBeGreaterThanOrEqual(4);
    for (const n of result.neutralAreas) {
      expect(n.value).toBeGreaterThanOrEqual(3);
      expect(n.value).toBeLessThan(4);
    }
  });

  it('cada dominio cae en exactamente una categoría', () => {
    const total = result.gaps.length + result.strengths.length + result.neutralAreas.length;
    expect(total).toBe(keys.length);
  });

  it('prioriza Alta por debajo de 2.5 y ordena de menor a mayor', () => {
    for (const g of result.gaps) {
      expect(g.prioridad).toBe(g.value < 2.5 ? 'Alta' : 'Media');
    }
    const values = result.gaps.map((g) => g.value);
    expect([...values].sort((a, b) => a - b)).toEqual(values);
  });

  it('gradúa la fortaleza en Destacada desde 4.5', () => {
    for (const s of result.strengths) {
      expect(s.nivel).toBe(s.value >= 4.5 ? 'Destacada' : 'Sólida');
    }
  });
});

describe('computeSeniorityScore — builder con etapa', () => {
  it('sube a Alta y pone primero el dominio crítico de la etapa', () => {
    // Todo flojo, así que todos los dominios son brecha; discovery es el peor
    // criterio de desempate salvo por la etapa.
    const values = answersFor('builder', 2);
    const result = computeSeniorityScore(values, undefined, 'builder', { etapa: 'ingresos' });

    const criticos = ['monetizacion', 'growth', 'analitica'];
    const presentes = criticos.filter((k) => result.gaps.some((g) => g.key === k));
    expect(presentes.length, 'la evaluación builder mide algún dominio crítico de ingresos').toBeGreaterThan(0);

    // Los críticos encabezan la lista...
    const firstKeys = result.gaps.slice(0, presentes.length).map((g) => g.key);
    expect([...firstKeys].sort()).toEqual([...presentes].sort());
    // ...y todos quedan en prioridad Alta.
    for (const key of presentes) {
      expect(result.gaps.find((g) => g.key === key)!.prioridad).toBe('Alta');
    }
  });
});

describe('metadata de los perfiles', () => {
  it('ASSESSMENT_TYPES cubre los cuatro perfiles sin repetir', () => {
    const keys = ASSESSMENT_TYPES.map((t) => t.key);
    expect([...keys].sort()).toEqual([...TYPES].sort());
  });

  it('una evaluación sin tipo se reporta como Legacy', () => {
    expect(getAssessmentTypeShortLabel(null)).toBe('Legacy');
    expect(getAssessmentTypeShortLabel('legacy')).toBe('Legacy');
    expect(getAssessmentTypeShortLabel('builder')).not.toBe('Legacy');
  });

  it('getAllScorableDomains junta todos los perfiles sin repetir', () => {
    const all = getAllScorableDomains();
    const keys = all.map((d) => d.key);
    expect(new Set(keys).size).toBe(keys.length);
    for (const type of TYPES) {
      for (const d of getDomainsForType(type)) {
        expect(keys, `${d.key} (${type}) falta en getAllScorableDomains`).toContain(d.key);
      }
    }
  });
});
