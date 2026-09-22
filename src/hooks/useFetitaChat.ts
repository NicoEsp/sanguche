import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import { fetitaKeys } from '@/hooks/useFetita';
import { FetitaRequestError, sendFetitaMessage } from '@/lib/fetita/stream';
import type { FetitaConversation, FetitaMessageStatus } from '@/lib/fetita/types';

/**
 * El turno en curso con Fetita: lo que se muestra mientras la respuesta llega
 * por streaming y todavía no está en la base.
 *
 * Al terminar se vuelven a leer los mensajes y recién ahí se descarta este
 * estado, así no hay parpadeo. Los ids que manda el servidor (start/done)
 * sirven para no mostrar dos veces un mensaje que ya llegó de la base.
 */
export interface PendingTurn {
  /** La conversación del turno. null mientras es una conversación nueva que todavía no se creó. */
  conversationId: string | null;
  userText: string;
  materialChars: number | null;
  materialSummary: string | null;
  userMessageId: string | null;
  assistantText: string;
  assistantMessageId: string | null;
  assistantStatus: FetitaMessageStatus | null;
  statusText: string | null;
}

/** Aviso del último turno, para mostrar junto al chat hasta el próximo mensaje. */
export interface FetitaNotice {
  tone: 'error' | 'info';
  text: string;
  code?: string;
  /** La conversación a la que corresponde (null = una nueva que no llegó a crearse). */
  conversationId: string | null;
}

interface UseFetitaChatOptions {
  conversationId: string | null;
  perfil: string | null;
  onConversationCreated: (conversationId: string) => void;
}

export function useFetitaChat({ conversationId, perfil, onConversationCreated }: UseFetitaChatOptions) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { trackEvent } = useMixpanelTracking();

  const [pending, setPending] = useState<PendingTurn | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [notice, setNotice] = useState<FetitaNotice | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const followUpTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const unmounted = useRef(false);
  const stoppedByUser = useRef(false);

  // Los deltas de texto llegan de a muchos por segundo: se juntan y se pintan
  // una vez por frame.
  const textBuffer = useRef('');
  const frame = useRef<number | null>(null);
  const flushText = useCallback(() => {
    frame.current = null;
    const chunk = textBuffer.current;
    textBuffer.current = '';
    if (chunk) setPending((p) => (p ? { ...p, assistantText: p.assistantText + chunk, statusText: null } : p));
  }, []);

  useEffect(() => {
    unmounted.current = false;
    const timers = followUpTimers.current;
    return () => {
      // Salir de la página corta el stream pero no el turno: el servidor lo
      // termina y lo guarda. No es un "Detener" de la persona.
      unmounted.current = true;
      abortRef.current?.abort();
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      timers.forEach(clearTimeout);
    };
  }, []);

  const refreshConversation = useCallback(
    async (id: string | null) => {
      const tasks: Promise<unknown>[] = [
        queryClient.invalidateQueries({ queryKey: fetitaKeys.conversations(profile?.id) }),
        queryClient.invalidateQueries({ queryKey: fetitaKeys.status(user?.id) }),
      ];
      if (id) {
        tasks.push(queryClient.invalidateQueries({ queryKey: fetitaKeys.messages(id) }));
        tasks.push(queryClient.invalidateQueries({ queryKey: fetitaKeys.memo(id) }));
      }
      await Promise.allSettled(tasks);
    },
    [queryClient, profile?.id, user?.id],
  );

  /**
   * Manda un mensaje. Devuelve false si el mensaje no llegó a guardarse (por
   * ejemplo, sin cupo o material ilegible), para que la página devuelva el
   * texto al campo y la persona no lo pierda.
   */
  const send = useCallback(
    async (message: string, material: string | null): Promise<boolean> => {
      if (streaming) return false;
      const controller = new AbortController();
      abortRef.current = controller;
      const startedIn = conversationId;
      let activeId = conversationId;
      let saved = false;
      stoppedByUser.current = false;
      const notify = (n: Omit<FetitaNotice, 'conversationId'>) => setNotice({ ...n, conversationId: activeId });
      const followUp = (delays: number[]) => {
        for (const delay of delays) {
          followUpTimers.current.push(setTimeout(() => void refreshConversation(activeId), delay));
        }
      };

      setStreaming(true);
      setNotice(null);
      setPending({
        conversationId,
        userText: message,
        materialChars: material ? material.length : null,
        materialSummary: null,
        userMessageId: null,
        assistantText: '',
        assistantMessageId: null,
        assistantStatus: null,
        statusText: null,
      });
      trackEvent('fetita_message_sent', { has_material: !!material, new_conversation: !startedIn });

      try {
        await sendFetitaMessage({
          conversationId,
          message,
          material,
          perfil,
          signal: controller.signal,
          onEvent: (event) => {
            switch (event.type) {
              case 'status':
                setPending((p) => (p ? { ...p, statusText: event.text } : p));
                break;
              case 'material':
                setPending((p) => (p ? { ...p, materialSummary: event.summary, statusText: null } : p));
                break;
              case 'start':
                saved = true;
                activeId = event.conversation_id;
                setPending((p) =>
                  p ? { ...p, conversationId: event.conversation_id, userMessageId: event.user_message_id } : p,
                );
                if (!startedIn) {
                  onConversationCreated(event.conversation_id);
                  queryClient.invalidateQueries({ queryKey: fetitaKeys.conversations(profile?.id) });
                }
                break;
              case 'text':
                textBuffer.current += event.delta;
                if (frame.current === null) frame.current = requestAnimationFrame(flushText);
                break;
              case 'decision':
                queryClient.setQueryData<FetitaConversation[]>(fetitaKeys.conversations(profile?.id), (list) =>
                  list?.map((c) => (c.id === activeId ? { ...c, title: event.title, protocol_step: event.protocol_step } : c)),
                );
                break;
              case 'memo':
                if (activeId) queryClient.setQueryData(fetitaKeys.memo(activeId), event.memo);
                trackEvent('fetita_memo_received', { verdict: event.memo.verdict, version: event.memo.version });
                break;
              case 'done':
                setPending((p) =>
                  p ? { ...p, assistantMessageId: event.assistant_message_id, assistantStatus: event.status } : p,
                );
                break;
              case 'error':
                trackEvent('fetita_error', { code: event.code });
                notify({ tone: 'error', text: event.message, code: event.code });
                break;
            }
          },
        });
      } catch (error) {
        if (unmounted.current) {
          // La página se desmontó: no hay a quién avisarle.
        } else if (controller.signal.aborted) {
          // Cortar el stream no corta el turno: el servidor termina y guarda la
          // respuesta. Se vuelve a leer un rato después para mostrarla.
          notify({ tone: 'info', text: 'Detuviste la respuesta. Fetita la termina igual y aparece acá en unos segundos.' });
          if (stoppedByUser.current) trackEvent('fetita_response_stopped', {});
          followUp([8000, 25000]);
        } else if (error instanceof FetitaRequestError && error.code === 'conversacion_ocupada') {
          // Hay un turno anterior todavía en curso (por ejemplo, después de
          // recargar la página). No es un error: se espera y se vuelve a leer.
          notify({
            tone: 'info',
            text: 'Fetita está terminando tu respuesta anterior. Cuando aparezca, mandá tu mensaje de nuevo.',
            code: error.code,
          });
          followUp([5000, 15000, 30000]);
        } else if (error instanceof FetitaRequestError && error.code === 'turno_en_curso') {
          // Otra conversación todavía tiene un turno en curso (por ejemplo,
          // después de apretar Detener): hay un turno a la vez por persona.
          notify({
            tone: 'info',
            text: 'Fetita todavía está terminando tu mensaje anterior. Probá de nuevo en unos segundos.',
            code: error.code,
          });
        } else if (error instanceof FetitaRequestError) {
          trackEvent('fetita_error', { code: error.code });
          notify({ tone: 'error', text: error.message, code: error.code });
        } else {
          if (import.meta.env.DEV) console.error('Error en el stream de Fetita:', error);
          trackEvent('fetita_error', { code: 'stream_error' });
          notify({
            tone: 'error',
            text: saved
              ? 'Se cortó la conexión. Fetita sigue con tu mensaje: la respuesta aparece acá en unos segundos.'
              : 'Se cortó la conexión. Si Fetita llegó a recibir tu mensaje, la conversación aparece en la lista en unos segundos; si no, el mensaje está de nuevo en el campo.',
            code: 'stream_error',
          });
          followUp([8000, 25000]);
        }
      } finally {
        if (frame.current !== null) {
          cancelAnimationFrame(frame.current);
          flushText();
        }
        abortRef.current = null;
        await refreshConversation(activeId);
        if (!unmounted.current) {
          setPending(null);
          setStreaming(false);
        }
      }
      return saved;
    },
    [streaming, conversationId, perfil, onConversationCreated, queryClient, profile?.id, trackEvent, flushText, refreshConversation],
  );

  const stop = useCallback(() => {
    stoppedByUser.current = true;
    abortRef.current?.abort();
  }, []);
  const clearNotice = useCallback(() => setNotice(null), []);
  /** Descarta el aviso si es de otra conversación. */
  const keepNoticeFor = useCallback(
    (id: string | null) => setNotice((n) => (n && n.conversationId === id ? n : null)),
    [],
  );

  return { send, stop, pending, streaming, notice, clearNotice, keepNoticeFor };
}
