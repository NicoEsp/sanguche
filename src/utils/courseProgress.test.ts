import { describe, expect, it } from 'vitest';
import type { CourseLesson, UserCourseProgress } from '@/types/courses';
import { attachProgress, summarizeCourseProgress } from './courseProgress';

/**
 * El bug que motiva estos tests: sin fila de progreso, `progress?.completed_at`
 * es undefined, y la comparación `!== null` daba true. O sea que toda lección
 * sin registro salía tildada, mientras el contador —que mira las filas reales—
 * decía 0. Se veía "0 de 6" con las seis lecciones marcadas.
 */

const lesson = (id: string, order: number): CourseLesson => ({
  id,
  course_id: 'curso-1',
  title: `Lección ${order}`,
  description: null,
  video_url: 'https://example.com/v.mp4',
  duration_minutes: 10,
  order_index: order,
  is_published: true,
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
});

const row = (lessonId: string, completedAt: string | null): UserCourseProgress =>
  ({ id: `p-${lessonId}`, lesson_id: lessonId, completed_at: completedAt } as UserCourseProgress);

const LESSONS = [lesson('a', 1), lesson('b', 2), lesson('c', 3)];

describe('attachProgress', () => {
  it('no marca como vista una lección sin fila', () => {
    const out = attachProgress(LESSONS, []);
    expect(out.map((l) => l.isCompleted)).toEqual([false, false, false]);
    expect(out.every((l) => l.progress === null)).toBe(true);
  });

  it('no marca como vista una fila empezada pero sin completar', () => {
    const out = attachProgress(LESSONS, [row('a', null)]);
    expect(out.find((l) => l.id === 'a')!.isCompleted).toBe(false);
  });

  it('marca sólo las que tienen fecha de completado', () => {
    const out = attachProgress(LESSONS, [row('a', '2026-02-01T00:00:00Z'), row('b', null)]);
    expect(out.map((l) => l.isCompleted)).toEqual([true, false, false]);
  });

  it('mantiene el orden y los datos de la lección', () => {
    const out = attachProgress(LESSONS, []);
    expect(out.map((l) => l.id)).toEqual(['a', 'b', 'c']);
    expect(out[0].title).toBe('Lección 1');
  });
});

describe('summarizeCourseProgress', () => {
  it('un curso sin progreso está en 0', () => {
    expect(summarizeCourseProgress(LESSONS, [])).toEqual({
      totalLessons: 3,
      completedLessons: 0,
      progressPercentage: 0,
      isCompleted: false,
    });
  });

  it('cuenta y redondea el porcentaje', () => {
    const s = summarizeCourseProgress(LESSONS, [row('a', '2026-02-01T00:00:00Z')]);
    expect(s.completedLessons).toBe(1);
    expect(s.progressPercentage).toBe(33);
    expect(s.isCompleted).toBe(false);
  });

  it('se completa con todas las lecciones vistas', () => {
    const rows = LESSONS.map((l) => row(l.id, '2026-02-01T00:00:00Z'));
    const s = summarizeCourseProgress(LESSONS, rows);
    expect(s).toEqual({
      totalLessons: 3,
      completedLessons: 3,
      progressPercentage: 100,
      isCompleted: true,
    });
  });

  it('una fila de una lección que ya no está no infla el porcentaje', () => {
    const rows = [...LESSONS.map((l) => row(l.id, '2026-02-01T00:00:00Z')), row('despublicada', '2026-02-01T00:00:00Z')];
    const s = summarizeCourseProgress(LESSONS, rows);
    expect(s.completedLessons).toBe(3);
    expect(s.progressPercentage).toBe(100);
  });

  it('un curso sin lecciones no está completo ni divide por cero', () => {
    const s = summarizeCourseProgress([], []);
    expect(s.progressPercentage).toBe(0);
    expect(s.isCompleted).toBe(false);
  });

  it('el contador y las tarjetas no se contradicen', () => {
    // El síntoma exacto del bug: stats en 0 y todas las lecciones tildadas.
    const rows: UserCourseProgress[] = [];
    const s = summarizeCourseProgress(LESSONS, rows);
    const tildadas = attachProgress(LESSONS, rows).filter((l) => l.isCompleted).length;
    expect(tildadas).toBe(s.completedLessons);
  });
});
