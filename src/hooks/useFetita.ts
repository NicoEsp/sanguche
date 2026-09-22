import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMixpanelTracking } from '@/hooks/useMixpanelTracking';
import { toast } from 'sonner';
import type {
  FetitaConversation,
  FetitaFeedbackReason,
  FetitaMemo,
  FetitaMessage,
  FetitaStatus,
} from '@/lib/fetita/types';

/**
 * Hooks de datos de Fetita para la persona que la usa.
 *
 * Las lecturas van directo a las tablas: RLS deja ver sólo lo propio. El admin
 * ve todo por RLS, por eso las listas filtran explícitamente por el perfil de
 * quien mira y no dependen sólo de la política.
 */

export const fetitaKeys = {
  status: (userId?: string) => ['fetita-status', userId] as const,
  conversations: (profileId?: string) => ['fetita-conversations', profileId] as const,
  messages: (conversationId: string | null) => ['fetita-messages', conversationId] as const,
  memo: (conversationId: string | null) => ['fetita-memo', conversationId] as const,
  feedback: (conversationId: string | null) => ['fetita-feedback', conversationId] as const,
};

interface UseFetitaStatusOptions {
  skip?: boolean;
}

/**
 * Acceso y cupo de la persona. Igual que useSubscription, los flags quedan en
 * undefined mientras carga o si falló, nunca en false: así la navegación no
 * esconde Fetita por un error de red.
 */
export function useFetitaStatus(options: UseFetitaStatusOptions = {}) {
  const { skip = false } = options;
  const { user, isLoading: authLoading } = useAuth();

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: fetitaKeys.status(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_fetita_status');
      if (error) throw error;
      return data as unknown as FetitaStatus;
    },
    enabled: !!user && !skip,
    staleTime: 60 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    // Cuando el admin habilita a alguien, alcanza con volver a la pestaña.
    refetchOnWindowFocus: true,
    retry: 1,
  });

  // Si falla una recarga en segundo plano se sigue usando el último dato: un
  // corte de red no esconde el chat ni el link de la navegación.
  const stillLoading = authLoading || isLoading || (!data && !skip && !!user);

  return {
    status: data ?? null,
    loading: stillLoading,
    hasAccess: stillLoading ? undefined : !!data?.user_enabled,
    canChat: stillLoading ? undefined : !!data?.can_chat,
    isError: isError && !data,
    refetch,
  };
}

export function useFetitaConversations() {
  const { profile } = useUserProfile();
  const profileId = profile?.id;

  return useQuery({
    queryKey: fetitaKeys.conversations(profileId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_conversations')
        .select('id, title, protocol_step, verdict, user_message_count, last_message_at, created_at')
        .eq('user_id', profileId!)
        .order('last_message_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as FetitaConversation[];
    },
    enabled: !!profileId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    // La app no recarga al montar por defecto; acá un turno pudo terminar
    // mientras la página no estaba montada.
    refetchOnMount: true,
  });
}

/** Cuánto se espera una respuesta que quedó en curso (por ejemplo, tras recargar). */
const PENDING_REPLY_WINDOW_MS = 4 * 60 * 1000;

/**
 * Si el último mensaje es de la persona y es reciente, Fetita todavía puede
 * estar respondiendo: pasa cuando la página se recargó a mitad de un turno (un
 * deploy recarga las pestañas abiertas). El servidor termina y guarda la
 * respuesta igual, así que se vuelve a leer hasta que aparezca.
 */
export function isAwaitingReply(messages: FetitaMessage[] | undefined): boolean {
  const last = messages?.at(-1);
  if (!last || last.role !== 'user') return false;
  return Date.now() - new Date(last.created_at).getTime() < PENDING_REPLY_WINDOW_MS;
}

export function useFetitaMessages(conversationId: string | null) {
  return useQuery({
    queryKey: fetitaKeys.messages(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_messages')
        .select('id, role, content, status, material_chars, material_summary, created_at')
        .eq('conversation_id', conversationId!)
        .order('seq', { ascending: true });
      if (error) throw error;
      return (data ?? []) as FetitaMessage[];
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
    refetchInterval: (query) => (isAwaitingReply(query.state.data) ? 4000 : false),
  });
}

/** La última versión del memo de una conversación, o null si todavía no hay. */
export function useFetitaMemo(conversationId: string | null) {
  return useQuery({
    queryKey: fetitaKeys.memo(conversationId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_memos')
        .select('id, conversation_id, version, verdict, content, created_at')
        .eq('conversation_id', conversationId!)
        .order('version', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as unknown as FetitaMemo | null;
    },
    enabled: !!conversationId,
    staleTime: 30 * 1000,
    gcTime: 10 * 60 * 1000,
    refetchOnMount: true,
  });
}

export interface FetitaFeedbackRow {
  message_id: string;
  rating: 1 | -1;
  reason: FetitaFeedbackReason | null;
  comment: string | null;
}

/** El feedback que la persona ya dejó sobre las respuestas de una conversación. */
export function useFetitaFeedback(conversationId: string | null, assistantMessageIds: string[]) {
  const { profile } = useUserProfile();
  const profileId = profile?.id;

  return useQuery({
    queryKey: [...fetitaKeys.feedback(conversationId), assistantMessageIds.length],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_feedback')
        .select('message_id, rating, reason, comment')
        .eq('user_id', profileId!)
        .in('message_id', assistantMessageIds);
      if (error) throw error;
      const byMessage: Record<string, FetitaFeedbackRow> = {};
      for (const row of (data ?? []) as FetitaFeedbackRow[]) byMessage[row.message_id] = row;
      return byMessage;
    },
    enabled: !!conversationId && !!profileId && assistantMessageIds.length > 0,
    staleTime: 60 * 1000,
  });
}

export function useSetFetitaFeedback(conversationId: string | null) {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();

  return useMutation({
    mutationFn: async (input: {
      messageId: string;
      rating: 1 | -1;
      reason?: FetitaFeedbackReason | null;
      comment?: string | null;
    }) => {
      if (!profile?.id) throw new Error('Perfil no disponible');
      const { error } = await supabase.from('fetita_feedback').upsert(
        {
          message_id: input.messageId,
          user_id: profile.id,
          rating: input.rating,
          reason: input.rating === -1 ? input.reason ?? null : null,
          comment: input.comment?.trim() ? input.comment.trim().slice(0, 1000) : null,
        },
        { onConflict: 'message_id,user_id' },
      );
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fetitaKeys.feedback(conversationId) });
    },
    onError: (error) => {
      if (import.meta.env.DEV) console.error('Error guardando feedback de Fetita:', error);
      toast.error('No pudimos guardar tu feedback. Probá de nuevo en un momento.');
    },
  });
}

class ConversationBusyError extends Error {}

export function useDeleteFetitaConversation() {
  const queryClient = useQueryClient();
  const { profile } = useUserProfile();
  const { trackEvent } = useMixpanelTracking();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      const { data, error } = await supabase
        .from('fetita_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', profile?.id ?? '')
        .select('id');
      if (error) throw error;
      // La base no deja borrar mientras Fetita está respondiendo en ella.
      if (!data?.length) throw new ConversationBusyError();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: fetitaKeys.conversations(profile?.id) });
      trackEvent('fetita_conversation_deleted', {});
      toast.success('Conversación borrada, con sus mensajes y su memo.');
    },
    onError: (error) => {
      if (error instanceof ConversationBusyError) {
        queryClient.invalidateQueries({ queryKey: fetitaKeys.conversations(profile?.id) });
        toast.info('Fetita todavía está terminando una respuesta en esta conversación. Probá borrarla en un minuto.');
        return;
      }
      if (import.meta.env.DEV) console.error('Error borrando conversación de Fetita:', error);
      toast.error('No pudimos borrar la conversación. Probá de nuevo en un momento.');
    },
  });
}
