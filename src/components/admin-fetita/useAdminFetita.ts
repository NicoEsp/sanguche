import { keepPreviousData, useMutation, useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { FunctionsFetchError, FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  compact,
  isRecord,
  normalizeAccessRow,
  normalizeConversation,
  normalizeMemoRow,
  normalizeMemoVersion,
  normalizeMessage,
  normalizeOverview,
} from './normalize';
import {
  ADMIN_LIST_LIMIT,
  toNumber,
  type FetitaConversationDetail,
  type FetitaConversationFilters,
  type FetitaDateRange,
  type FetitaReviewStatus,
  type FetitaSettingsRow,
} from './shared';

/**
 * Hooks de datos del admin de Fetita. Todas las keys empiezan con
 * 'admin-fetita-' y se invalidan por prefijo después de cada escritura.
 * Las tablas de Fetita no están en realtime: el panel se refresca con los
 * botones "Actualizar" y con las invalidaciones.
 */

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  if (isRecord(error) && typeof error.message === 'string' && error.message) return error.message;
  return fallback;
}

function logDev(label: string, error: unknown) {
  if (import.meta.env.DEV) console.error(`[admin-fetita] ${label}:`, error);
}

// ---------------------------------------------------------------------------
// Lecturas
// ---------------------------------------------------------------------------

export function useFetitaOverview(range: FetitaDateRange) {
  return useQuery({
    queryKey: ['admin-fetita-overview', range.from, range.to],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_fetita_overview', { p_from: range.from, p_to: range.to });
      if (error) throw error;
      return normalizeOverview(data);
    },
    // Al cambiar de rango se siguen viendo las cifras anteriores mientras carga.
    placeholderData: keepPreviousData,
  });
}

export function useFetitaSettings() {
  return useQuery({
    queryKey: ['admin-fetita-settings'],
    queryFn: async (): Promise<FetitaSettingsRow | null> => {
      const { data, error } = await supabase
        .from('fetita_settings')
        .select('enabled, monthly_budget_usd, default_monthly_messages, updated_at')
        .eq('id', 1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        enabled: data.enabled === true,
        monthly_budget_usd: toNumber(data.monthly_budget_usd),
        default_monthly_messages: toNumber(data.default_monthly_messages),
        updated_at: data.updated_at,
      };
    },
  });
}

export function useFetitaAccessList() {
  return useQuery({
    queryKey: ['admin-fetita-access'],
    queryFn: async () => {
      // fetita_access tiene dos FK a profiles (user_id y granted_by): el embed
      // tiene que nombrar la de user_id o PostgREST lo rechaza por ambiguo.
      const { data, error } = await supabase
        .from('fetita_access')
        .select(
          'user_id, enabled, monthly_message_limit, note, created_at, updated_at, profiles!fetita_access_user_id_fkey(id, name, email)',
        )
        .order('created_at', { ascending: false });
      if (error) throw error;
      return compact(((data ?? []) as unknown[]).map(normalizeAccessRow));
    },
  });
}

export function useFetitaConversations(filters: FetitaConversationFilters = {}) {
  const verdict = filters.verdict ?? 'all';
  return useQuery({
    queryKey: ['admin-fetita-conversations', verdict],
    queryFn: async () => {
      let query = supabase
        .from('fetita_conversations')
        .select(
          'id, user_id, title, protocol_step, verdict, user_message_count, model, prompt_version, created_at, last_message_at, profiles!fetita_conversations_user_id_fkey(id, name, email)',
        )
        .order('last_message_at', { ascending: false })
        .limit(ADMIN_LIST_LIMIT);
      if (verdict === 'sin_memo') query = query.is('verdict', null);
      else if (verdict !== 'all') query = query.eq('verdict', verdict);
      const { data, error } = await query;
      if (error) throw error;
      return compact(((data ?? []) as unknown[]).map(normalizeConversation));
    },
    placeholderData: keepPreviousData,
  });
}

export function useFetitaMemos() {
  return useQuery({
    queryKey: ['admin-fetita-memos'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fetita_memos')
        .select(
          [
            'id, conversation_id, user_id, version, verdict, created_at, prompt_version',
            'profiles!fetita_memos_user_id_fkey(id, name, email)',
            'fetita_conversations!fetita_memos_conversation_id_fkey(title, protocol_step)',
            'fetita_memo_checks(id, status, model, claims_total, claims_supported, claims_partial, claims_unsupported, error, created_at)',
            'fetita_memo_reviews(status, note, reviewed_at)',
          ].join(', '),
        )
        .order('created_at', { ascending: false })
        .limit(ADMIN_LIST_LIMIT);
      if (error) throw error;
      return compact(((data ?? []) as unknown[]).map(normalizeMemoRow));
    },
  });
}

/**
 * Todo lo de una conversación para el diálogo de detalle. Nunca se pide
 * api_messages: es el payload crudo para la API y puede pesar mucho.
 */
export function useFetitaConversationDetail(conversationId: string | null) {
  return useQuery({
    queryKey: ['admin-fetita-conversation', conversationId],
    enabled: !!conversationId,
    queryFn: async (): Promise<FetitaConversationDetail> => {
      const id = conversationId as string;
      const [conversationRes, messagesRes, memosRes] = await Promise.all([
        supabase
          .from('fetita_conversations')
          .select(
            'id, user_id, title, protocol_step, verdict, user_message_count, model, prompt_version, created_at, last_message_at, profiles!fetita_conversations_user_id_fkey(id, name, email)',
          )
          .eq('id', id)
          .maybeSingle(),
        supabase
          .from('fetita_messages')
          .select(
            'id, seq, role, content, status, material_chars, material_summary, created_at, fetita_feedback(rating, reason, comment)',
          )
          .eq('conversation_id', id)
          .order('seq', { ascending: true }),
        supabase
          .from('fetita_memos')
          .select(
            [
              'id, version, verdict, content, created_at, prompt_version',
              'fetita_memo_checks(id, status, model, claims_total, claims_supported, claims_partial, claims_unsupported, result, error, cost_usd, created_at)',
              'fetita_memo_reviews(status, note, reviewed_at)',
            ].join(', '),
          )
          .eq('conversation_id', id)
          .order('version', { ascending: false }),
      ]);
      if (conversationRes.error) throw conversationRes.error;
      if (messagesRes.error) throw messagesRes.error;
      if (memosRes.error) throw memosRes.error;
      return {
        conversation: normalizeConversation(conversationRes.data),
        messages: compact(((messagesRes.data ?? []) as unknown[]).map(normalizeMessage)),
        memos: compact(((memosRes.data ?? []) as unknown[]).map(normalizeMemoVersion)),
      };
    },
  });
}

// ---------------------------------------------------------------------------
// Escrituras
// ---------------------------------------------------------------------------

export type FetitaAccessAction = 'create' | 'update' | 'enable' | 'disable';

export interface SetFetitaAccessInput {
  action: FetitaAccessAction;
  /** Para filas existentes. Al crear se usa el email. */
  targetProfileId?: string;
  email?: string;
  enabled: boolean;
  /** null = usa el default. */
  monthlyMessageLimit: number | null;
  note: string | null;
  /** Nombre o email, para el toast. */
  displayName: string;
}

const ACCESS_SUCCESS: Record<FetitaAccessAction, string> = {
  create: 'Acceso habilitado',
  update: 'Acceso actualizado',
  enable: 'Acceso habilitado',
  disable: 'Acceso deshabilitado',
};

/**
 * admin_set_fetita_access pisa todos los campos en cada llamada: quien la use
 * tiene que mandar el límite y la nota actuales aunque sólo cambie enabled.
 */
export function useSetFetitaAccess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: SetFetitaAccessInput) => {
      const { error } = await supabase.rpc('admin_set_fetita_access', {
        p_target_profile_id: input.targetProfileId ?? undefined,
        p_email: input.targetProfileId ? undefined : input.email?.trim() || undefined,
        p_enabled: input.enabled,
        p_monthly_message_limit: input.monthlyMessageLimit ?? undefined,
        p_note: input.note?.trim() || undefined,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      toast.success(`${ACCESS_SUCCESS[input.action]}: ${input.displayName}`);
      queryClient.invalidateQueries({ queryKey: ['admin-fetita-access'] });
      queryClient.invalidateQueries({ queryKey: ['admin-fetita-overview'] });
    },
    onError: (error) => {
      logDev('set access', error);
      // Los errores del RPC ya están en castellano y le hablan al admin.
      toast.error(errorMessage(error, 'No se pudo guardar el acceso. Probá de nuevo.'));
    },
  });
}

export interface UpdateFetitaSettingsInput {
  enabled: boolean;
  monthlyBudgetUsd: number;
  defaultMonthlyMessages: number;
  successMessage?: string;
}

/** El RPC exige los tres valores juntos. */
export function useUpdateFetitaSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateFetitaSettingsInput) => {
      const { error } = await supabase.rpc('admin_update_fetita_settings', {
        p_enabled: input.enabled,
        p_monthly_budget_usd: input.monthlyBudgetUsd,
        p_default_monthly_messages: input.defaultMonthlyMessages,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      toast.success(input.successMessage ?? 'Configuración guardada');
      queryClient.invalidateQueries({ queryKey: ['admin-fetita-settings'] });
      queryClient.invalidateQueries({ queryKey: ['admin-fetita-overview'] });
    },
    onError: (error) => {
      logDev('update settings', error);
      toast.error(errorMessage(error, 'No se pudo guardar la configuración. Probá de nuevo.'));
    },
  });
}

function invalidateQuality(queryClient: QueryClient) {
  queryClient.invalidateQueries({ queryKey: ['admin-fetita-memos'] });
  queryClient.invalidateQueries({ queryKey: ['admin-fetita-conversation'] });
  queryClient.invalidateQueries({ queryKey: ['admin-fetita-overview'] });
}

export interface ReviewFetitaMemoInput {
  memoId: string;
  /** null borra la revisión. */
  status: FetitaReviewStatus | null;
  note: string | null;
}

export function useReviewFetitaMemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ReviewFetitaMemoInput) => {
      const { error } = await supabase.rpc('admin_review_fetita_memo', {
        p_memo_id: input.memoId,
        // El RPC borra la revisión con p_status NULL, pero los tipos generados
        // lo declaran string obligatorio: hay que mandar el null explícito.
        p_status: input.status ?? (null as unknown as string),
        p_note: input.status ? input.note?.trim() || undefined : undefined,
      });
      if (error) throw error;
    },
    onSuccess: (_data, input) => {
      toast.success(input.status ? 'Revisión guardada' : 'Revisión borrada');
      invalidateQuality(queryClient);
    },
    onError: (error) => {
      logDev('review memo', error);
      toast.error(errorMessage(error, 'No se pudo guardar la revisión. Probá de nuevo.'));
    },
  });
}

const EVALUATE_ERROR_COPY: Record<string, string> = {
  solo_admin: 'Sólo un admin puede reevaluar memos.',
  no_autenticado: 'Tu sesión venció. Volvé a entrar y probá de nuevo.',
  entrada_invalida: 'El pedido de reevaluación no es válido.',
  metodo_invalido: 'El pedido de reevaluación no es válido.',
  error_interno: 'Falló la función de evaluación. Probá de nuevo en un rato.',
};

/**
 * functions.invoke convierte cualquier respuesta no-2xx en error con data null;
 * el cuerpo JSON queda en error.context (igual que en LemonSqueezyCheckout).
 * fetita-evaluate responde 502 con el outcome cuando el juez falla y 403
 * { error: 'solo_admin' } si quien llama no es admin.
 */
async function describeEvaluateError(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError) {
    let body: unknown = null;
    const context: unknown = error.context;
    if (context instanceof Response) {
      try {
        body = await context.json();
      } catch {
        body = null;
      }
    }
    if (isRecord(body)) {
      if (body.status === 'error') {
        const detail = typeof body.error === 'string' && body.error ? `: ${body.error}` : '.';
        return `El juez no pudo evaluar el memo${detail}`;
      }
      if (typeof body.error === 'string') return EVALUATE_ERROR_COPY[body.error] ?? body.error;
    }
    return 'La función de evaluación respondió con un error. Probá de nuevo.';
  }
  if (error instanceof FunctionsFetchError || error instanceof FunctionsRelayError) {
    return 'No pudimos conectar con la función de evaluación. Probá de nuevo.';
  }
  return errorMessage(error, 'No se pudo reevaluar el memo. Probá de nuevo.');
}

interface EvaluateOutcome {
  claimsTotal: number;
  claimsUnsupported: number;
  claimsPartial: number;
}

export function useReevaluateFetitaMemo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memoId: string): Promise<EvaluateOutcome> => {
      const { data, error } = await supabase.functions.invoke('fetita-evaluate', { body: { memo_id: memoId } });
      if (error) throw new Error(await describeEvaluateError(error));
      const outcome = isRecord(data) ? data : {};
      return {
        claimsTotal: toNumber(outcome.claimsTotal),
        claimsUnsupported: toNumber(outcome.claimsUnsupported),
        claimsPartial: toNumber(outcome.claimsPartial),
      };
    },
    onSuccess: (outcome) => {
      toast.success(
        outcome.claimsTotal === 0
          ? 'Memo reevaluado: el juez no encontró afirmaciones de hecho.'
          : `Memo reevaluado: ${outcome.claimsUnsupported} de ${outcome.claimsTotal} afirmaciones sin soporte.`,
      );
    },
    onError: (error) => {
      logDev('reevaluate memo', error);
      toast.error(errorMessage(error, 'No se pudo reevaluar el memo. Probá de nuevo.'));
    },
    // Si el juez falla igual queda un check con status error: se refresca siempre.
    onSettled: () => invalidateQuality(queryClient),
  });
}
