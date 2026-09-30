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

export type FetitaStep = 'context' | 'challenge' | 'closing';

/**
 * Mensajes de la persona hasta que Fetita cierra. Es el mismo tope que el
 * prompt (supabase/functions/fetita-chat/prompt.ts): si cambia uno, cambia el otro.
 */
export const FETITA_MAX_MESSAGES = 8;

/**
 * Conversaciones por persona: la primera y un "empezar de nuevo". Los admins no
 * tienen tope. Es el mismo número que MAX_CONVERSATIONS en la edge function,
 * que es la que lo hace cumplir.
 */
export const FETITA_MAX_CONVERSATIONS = 2;

/** Lo que manda el botón "Empezar". No cuenta como mensaje de la persona. */
export const FETITA_OPENER = 'Hola Fetita';

export const FETITA_STEPS: { key: FetitaStep; label: string; goal: string }[] = [
  { key: 'context', label: 'Contexto', goal: 'Contame tu rol y hacia dónde querés llevar tu carrera.' },
  { key: 'challenge', label: 'Challenge', goal: 'Desafiamos una decisión de producto o un discovery tuyo.' },
  { key: 'closing', label: 'Cierre', goal: 'Te doy un veredicto y un próximo paso para esta semana.' },
];

export interface FetitaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  /** El paso en el que quedó la conversación después de esta respuesta. */
  step: FetitaStep | null;
  /** Sólo en el cierre: avanzar, falta_evidencia o frenar. */
  verdict: string | null;
  feedback: 'up' | 'down' | null;
}

export type FetitaEvent = { type: 'text'; delta: string } | { type: 'done' } | { type: 'error'; message: string };

export const fetitaMessagesKey = (profileId?: string) => ['fetita-messages', profileId] as const;
export const fetitaConversationsKey = (profileId?: string) => ['fetita-conversations', profileId] as const;

/**
 * Si la persona puede usar Fetita: la habilitó el admin, o es admin. access
 * queda en undefined mientras carga. Si la consulta falla, isError lo avisa
 * para que la página ofrezca reintentar en vez de quedarse cargando.
 */
export function useFetitaAccess(): { access: boolean | undefined; isError: boolean; retry: () => void } {
  const { user, isAdmin } = useAuth();
  const { profile } = useUserProfile({ skip: !user || isAdmin });
  const { data, isError, refetch } = useQuery({
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
  if (isAdmin) return { access: true, isError: false, retry: () => {} };
  return { access: data, isError: isError && data === undefined, retry: () => void refetch() };
}

/** El hilo actual. El admin ve todo por RLS, por eso se filtra por el perfil propio. */
export function useFetitaMessages(profileId?: string) {
  return useQuery({
    queryKey: fetitaMessagesKey(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_messages')
        .select('id, role, content, step, verdict, feedback')
        .eq('user_id', profileId!)
        .eq('status', 'ok')
        .is('archived_at', null)
        .order('seq', { ascending: true });
      if (error) throw error;
      return (data ?? []) as FetitaMessage[];
    },
    enabled: !!profileId,
  });
}

/**
 * Cuántas conversaciones archivadas tiene la persona (las que ya usó antes de
 * la actual). Los turnos fallidos no cuentan. undefined mientras carga.
 */
export function useFetitaArchivedConversations(profileId?: string) {
  return useQuery({
    queryKey: fetitaConversationsKey(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_messages')
        .select('thread_id')
        .eq('user_id', profileId!)
        .eq('status', 'ok')
        .not('archived_at', 'is', null);
      if (error) throw error;
      return new Set((data ?? []).map((row) => row.thread_id)).size;
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
  body: { message: string; perfil?: string; entry_point?: string },
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

/** El pulgar sobre un cierre, con un comentario opcional. */
export async function sendFetitaFeedback(messageId: string, rating: 'up' | 'down', comment: string): Promise<void> {
  const { error } = await supabase.functions.invoke('fetita-chat', {
    body: { action: 'feedback', message_id: messageId, rating, comment },
  });
  if (error) throw error;
}

/** Archiva el hilo actual: Fetita arranca de cero con el perfil. */
export async function restartFetita(): Promise<void> {
  const { error } = await supabase.functions.invoke('fetita-chat', { body: { action: 'restart' } });
  if (error) throw error;
}
