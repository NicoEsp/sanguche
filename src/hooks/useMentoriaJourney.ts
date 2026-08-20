import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Duración estándar de una sesión 1:1. Los minutos del recorrido se derivan de acá
 * en lugar de guardarse por sesión: no necesitamos una tabla nueva para esto.
 */
export const MENTORIA_SESSION_MINUTES = 45;

export interface MentoriaJourney {
  /** Sesiones 1:1 registradas por un admin */
  sessionsCount: number;
  /** sessionsCount × MENTORIA_SESSION_MINUTES */
  totalMinutes: number;
  /** Ejercicios que ya recibieron devolución del mentor */
  exercisesWithFeedback: number;
  /** Alta de la suscripción: el "desde cuándo" del recorrido */
  startedAt: string | null;
}

/**
 * Datos del recorrido de mentoría de la persona logueada.
 *
 * Complementa a useUserProfile (que ya trae mentoria_sessions_count y
 * last_mentoria_date) con las dos piezas que faltan para la card: desde cuándo
 * está suscripta y cuántos ejercicios recibieron feedback.
 */
export function useMentoriaJourney(
  profileId: string | undefined,
  sessionsCount: number
) {
  return useQuery({
    queryKey: ['mentoria-journey', profileId, sessionsCount],
    queryFn: async (): Promise<MentoriaJourney> => {
      const [subscriptionResult, exercisesResult] = await Promise.all([
        supabase
          .from('user_subscriptions')
          .select('created_at')
          .eq('user_id', profileId!)
          .maybeSingle(),
        supabase
          .from('user_exercises')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', profileId!)
          .not('admin_feedback', 'is', null),
      ]);

      if (subscriptionResult.error) throw subscriptionResult.error;
      if (exercisesResult.error) throw exercisesResult.error;

      return {
        sessionsCount,
        totalMinutes: sessionsCount * MENTORIA_SESSION_MINUTES,
        exercisesWithFeedback: exercisesResult.count ?? 0,
        startedAt: subscriptionResult.data?.created_at ?? null,
      };
    },
    enabled: !!profileId && sessionsCount > 0,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });
}
