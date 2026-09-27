import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { buildAssessmentMarkdown } from '@/utils/assessmentMarkdown';
import type { AnyAssessmentValues, AssessmentResult, AssessmentTypeKey } from '@/utils/scoring';

/**
 * Fetita, el agente de ProductPrepa, en prueba con un grupo chico: el acceso,
 * el hilo de mensajes, el perfil que recibe y la llamada a la edge function.
 */

export interface FetitaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export type FetitaEvent = { type: 'text'; delta: string } | { type: 'done' } | { type: 'error'; message: string };

export const fetitaMessagesKey = (profileId?: string) => ['fetita-messages', profileId] as const;

/**
 * Si la persona puede usar Fetita: la habilitó el admin, o es admin. Queda en
 * undefined mientras carga o si falló, así la navegación no la esconde por un
 * error de red.
 */
export function useFetitaAccess(): boolean | undefined {
  const { user, isAdmin } = useAuth();
  const { profile } = useUserProfile({ skip: !user || isAdmin });
  const { data } = useQuery({
    queryKey: ['fetita-access', profile?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_access')
        .select('user_id')
        .eq('user_id', profile!.id)
        .maybeSingle();
      if (error) throw error;
      return !!data;
    },
    enabled: !!profile?.id && !isAdmin,
    staleTime: 5 * 60 * 1000,
  });
  return isAdmin ? true : data;
}

/** El hilo actual. El admin ve todo por RLS, por eso se filtra por el perfil propio. */
export function useFetitaMessages(profileId?: string) {
  return useQuery({
    queryKey: fetitaMessagesKey(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_messages')
        .select('id, role, content')
        .eq('user_id', profileId!)
        .is('archived_at', null)
        .order('seq', { ascending: true });
      if (error) throw error;
      return (data ?? []) as FetitaMessage[];
    },
    enabled: !!profileId,
  });
}

/**
 * Lo que Fetita sabe de la persona al empezar: el nombre y todas sus
 * evaluaciones, de la más reciente a la más vieja, para que vea cómo
 * evolucionó. Es el mismo Markdown que se exporta para otros LLM.
 */
export function useFetitaPerfil(userId: string | undefined, name: string | null | undefined) {
  return useQuery({
    queryKey: ['fetita-perfil', userId, name],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assessments')
        .select('assessment_result, assessment_values, assessment_type, created_at, profiles!assessments_user_id_fkey!inner(user_id)')
        .eq('profiles.user_id', userId!)
        .order('created_at', { ascending: false });
      if (error) throw error;

      const evaluaciones = (data ?? [])
        .filter((row) => row.assessment_result)
        .map((row, index) => {
          const result = row.assessment_result as unknown as AssessmentResult;
          const markdown = buildAssessmentMarkdown({
            result,
            values: row.assessment_values as AnyAssessmentValues,
            assessmentType: (row.assessment_type ?? result.assessmentType ?? null) as AssessmentTypeKey | null,
            updatedAt: row.created_at,
            forAgent: true,
          });
          return index === 0 ? `(La más reciente)\n\n${markdown}` : markdown;
        });

      return [
        `Nombre: ${name?.trim() || 'sin nombre cargado'}`,
        evaluaciones.length > 0
          ? `Evaluaciones en ProductPrepa: ${evaluaciones.length}`
          : 'Todavía no hizo la autoevaluación de ProductPrepa.',
        ...evaluaciones,
      ].join('\n\n---\n\n');
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Manda un mensaje a Fetita y va pasando los eventos de la respuesta. */
export async function sendToFetita(
  body: { message: string; perfil?: string },
  onEvent: (event: FetitaEvent) => void,
): Promise<void> {
  const { data } = await supabase.auth.getSession();
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetita-chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${data.session?.access_token ?? ''}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify(body),
  });
  if (!response.ok || !response.body) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error ?? 'No pudimos hablar con Fetita. Probá de nuevo.');
  }

  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = '';
  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer = (buffer + value).replace(/\r\n?/g, '\n');
    let boundary = buffer.indexOf('\n\n');
    while (boundary !== -1) {
      const data = buffer
        .slice(0, boundary)
        .split('\n')
        .filter((line) => line.startsWith('data:'))
        .map((line) => line.slice(5).trim())
        .join('');
      buffer = buffer.slice(boundary + 2);
      if (data) onEvent(JSON.parse(data) as FetitaEvent);
      boundary = buffer.indexOf('\n\n');
    }
  }
}

/** Archiva el hilo actual: Fetita arranca de cero con el perfil. */
export async function restartFetita(): Promise<void> {
  const { error } = await supabase.functions.invoke('fetita-chat', { body: { action: 'restart' } });
  if (error) throw error;
}
