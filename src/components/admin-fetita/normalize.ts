import type { FetitaFeedbackReason, FetitaMemoContent, FetitaMessageStatus, FetitaVerdict } from '@/lib/fetita/types';
import {
  toNullableNumber,
  toNumber,
  type FetitaAccessRow,
  type FetitaAdminConversation,
  type FetitaAdminFeedback,
  type FetitaAdminMemoRow,
  type FetitaAdminMemoVersion,
  type FetitaAdminMessage,
  type FetitaJudgeClaim,
  type FetitaJudgeResult,
  type FetitaJudgeVerdict,
  type FetitaMemoCheck,
  type FetitaMemoCheckDetail,
  type FetitaMemoReview,
  type FetitaOverview,
  type FetitaProfileRef,
  type FetitaReviewStatus,
} from './shared';

/**
 * PostgREST devuelve los embeds como objeto o como array según la relación, y
 * los tipos generados dicen Json para los RPC. Acá se pasa todo a las formas de
 * shared.ts, sin confiar en que cada campo venga.
 */

type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value;
  return value === null || value === undefined ? [] : [value];
}

function firstRecord(value: unknown): UnknownRecord | null {
  const first = asArray(value)[0];
  return isRecord(first) ? first : null;
}

function str(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function nullableStr(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

const VERDICTS: readonly string[] = ['listo', 'falta', 'frenar'];
const REVIEW_STATUSES: readonly string[] = ['correcto', 'alucinacion', 'desafio_flojo'];
const JUDGE_VERDICTS: readonly string[] = ['soportada', 'parcial', 'no_soportada'];
const MESSAGE_STATUSES: readonly string[] = ['complete', 'truncated', 'refused', 'error'];
const FEEDBACK_REASON_KEYS: readonly string[] = ['invento_algo', 'no_me_desafio', 'confuso', 'otro'];

function verdictOrNull(value: unknown): FetitaVerdict | null {
  return typeof value === 'string' && VERDICTS.includes(value) ? (value as FetitaVerdict) : null;
}

function byCreatedAtDesc(a: { created_at: string }, b: { created_at: string }): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
}

// ---------------------------------------------------------------------------

export function normalizeProfile(value: unknown): FetitaProfileRef | null {
  const row = firstRecord(value);
  if (!row) return null;
  return { id: nullableStr(row.id) ?? undefined, name: nullableStr(row.name), email: nullableStr(row.email) };
}

export function normalizeOverview(data: unknown): FetitaOverview {
  const raw = isRecord(data) ? data : {};
  const totals = isRecord(raw.totals) ? raw.totals : {};
  const quality = isRecord(raw.quality) ? raw.quality : {};
  const checks = isRecord(quality.checks) ? quality.checks : {};
  const feedback = isRecord(quality.feedback) ? quality.feedback : {};
  const range = isRecord(raw.range) ? raw.range : {};
  const month = isRecord(raw.month) ? raw.month : null;

  const countMap = <K extends string>(value: unknown, keys: readonly string[]): Partial<Record<K, number>> => {
    const out: Partial<Record<K, number>> = {};
    if (!isRecord(value)) return out;
    for (const key of keys) {
      if (key in value) out[key as K] = toNumber(value[key]);
    }
    return out;
  };

  return {
    range: { from: str(range.from), to: str(range.to) },
    totals: {
      cost_usd: toNumber(totals.cost_usd),
      requests: toNumber(totals.requests),
      chat_turns: toNumber(totals.chat_turns),
      active_users: toNumber(totals.active_users),
      input_tokens: toNumber(totals.input_tokens),
      output_tokens: toNumber(totals.output_tokens),
      cache_read_tokens: toNumber(totals.cache_read_tokens),
      cache_write_tokens: toNumber(totals.cache_write_tokens),
      errors: toNumber(totals.errors),
      refusals: toNumber(totals.refusals),
      fallbacks: toNumber(totals.fallbacks),
      unpriced: toNumber(totals.unpriced),
      avg_latency_ms: toNullableNumber(totals.avg_latency_ms),
      p95_latency_ms: toNullableNumber(totals.p95_latency_ms),
    },
    by_day: asArray(raw.by_day)
      .filter(isRecord)
      .map((row) => ({
        day: str(row.day),
        cost_usd: toNumber(row.cost_usd),
        requests: toNumber(row.requests),
        chat_turns: toNumber(row.chat_turns),
      })),
    by_kind: asArray(raw.by_kind)
      .filter(isRecord)
      .map((row) => ({ kind: str(row.kind, 'otro'), cost_usd: toNumber(row.cost_usd), requests: toNumber(row.requests) })),
    by_model: asArray(raw.by_model)
      .filter(isRecord)
      .map((row) => ({ model: str(row.model, 'desconocido'), cost_usd: toNumber(row.cost_usd), requests: toNumber(row.requests) })),
    by_user: asArray(raw.by_user)
      .filter(isRecord)
      .map((row) => ({
        user_id: nullableStr(row.user_id),
        name: nullableStr(row.name),
        email: nullableStr(row.email),
        cost_usd: toNumber(row.cost_usd),
        chat_turns: toNumber(row.chat_turns),
        conversations: toNumber(row.conversations),
        last_active: str(row.last_active),
      })),
    quality: {
      memos_total: toNumber(quality.memos_total),
      verdicts: countMap<FetitaVerdict>(quality.verdicts, VERDICTS),
      checks: {
        memos_checked: toNumber(checks.memos_checked),
        claims_total: toNumber(checks.claims_total),
        claims_unsupported: toNumber(checks.claims_unsupported),
        claims_partial: toNumber(checks.claims_partial),
        memos_with_unsupported: toNumber(checks.memos_with_unsupported),
      },
      reviews: countMap<FetitaReviewStatus>(quality.reviews, REVIEW_STATUSES),
      feedback: {
        up: toNumber(feedback.up),
        down: toNumber(feedback.down),
        invento_algo: toNumber(feedback.invento_algo),
        no_me_desafio: toNumber(feedback.no_me_desafio),
        confuso: toNumber(feedback.confuso),
        otro: toNumber(feedback.otro),
      },
      assistant_messages: toNumber(quality.assistant_messages),
    },
    month: month
      ? {
          spent_usd: toNumber(month.spent_usd),
          monthly_budget_usd: toNumber(month.monthly_budget_usd),
          enabled: month.enabled === true,
          default_monthly_messages: toNumber(month.default_monthly_messages),
          month_start: str(month.month_start),
        }
      : null,
  };
}

export function normalizeAccessRow(value: unknown): FetitaAccessRow | null {
  if (!isRecord(value) || typeof value.user_id !== 'string') return null;
  return {
    user_id: value.user_id,
    enabled: value.enabled === true,
    monthly_message_limit: toNullableNumber(value.monthly_message_limit),
    note: nullableStr(value.note),
    created_at: str(value.created_at),
    updated_at: str(value.updated_at),
    profile: normalizeProfile(value.profiles),
  };
}

export function normalizeConversation(value: unknown): FetitaAdminConversation | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    user_id: str(value.user_id),
    title: str(value.title, 'Sin título'),
    protocol_step: toNumber(value.protocol_step) || 1,
    verdict: verdictOrNull(value.verdict),
    user_message_count: toNumber(value.user_message_count),
    model: str(value.model),
    prompt_version: str(value.prompt_version),
    created_at: str(value.created_at),
    last_message_at: str(value.last_message_at),
    profile: normalizeProfile(value.profiles),
  };
}

function normalizeCheck(value: unknown): FetitaMemoCheck | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    status: value.status === 'ok' ? 'ok' : 'error',
    model: str(value.model),
    claims_total: toNumber(value.claims_total),
    claims_supported: toNumber(value.claims_supported),
    claims_partial: toNumber(value.claims_partial),
    claims_unsupported: toNumber(value.claims_unsupported),
    error: nullableStr(value.error),
    created_at: str(value.created_at),
  };
}

function normalizeReview(value: unknown): FetitaMemoReview | null {
  const row = firstRecord(value);
  if (!row || typeof row.status !== 'string' || !REVIEW_STATUSES.includes(row.status)) return null;
  return {
    status: row.status as FetitaReviewStatus,
    note: nullableStr(row.note),
    reviewed_at: str(row.reviewed_at),
  };
}

export function parseJudgeResult(value: unknown): FetitaJudgeResult | null {
  if (!isRecord(value) || !Array.isArray(value.afirmaciones)) return null;
  const afirmaciones: FetitaJudgeClaim[] = value.afirmaciones.filter(isRecord).map((claim) => ({
    campo: str(claim.campo),
    afirmacion: str(claim.afirmacion),
    veredicto:
      typeof claim.veredicto === 'string' && JUDGE_VERDICTS.includes(claim.veredicto)
        ? (claim.veredicto as FetitaJudgeVerdict)
        : 'no_soportada',
    evidencia: str(claim.evidencia),
    comentario: str(claim.comentario),
  }));
  return { afirmaciones, resumen: str(value.resumen) };
}

/** El memo lo valida la edge function con zod; esto sólo evita romper el panel con un jsonb raro. */
export function parseMemoContent(value: unknown): FetitaMemoContent | null {
  if (!isRecord(value)) return null;
  const ok =
    typeof value.decision === 'string' &&
    Array.isArray(value.evidencia) &&
    Array.isArray(value.supuestos_abiertos) &&
    Array.isArray(value.sesgos) &&
    Array.isArray(value.huecos) &&
    isRecord(value.que_se_deja_de_hacer) &&
    isRecord(value.test_mas_chico);
  return ok ? (value as unknown as FetitaMemoContent) : null;
}

export function normalizeMemoRow(value: unknown): FetitaAdminMemoRow | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const verdict = verdictOrNull(value.verdict);
  if (!verdict) return null;
  const conversation = firstRecord(value.fetita_conversations);
  const checks = asArray(value.fetita_memo_checks)
    .map(normalizeCheck)
    .filter((check): check is FetitaMemoCheck => check !== null)
    .sort(byCreatedAtDesc);
  return {
    id: value.id,
    conversation_id: str(value.conversation_id),
    user_id: str(value.user_id),
    version: toNumber(value.version),
    verdict,
    created_at: str(value.created_at),
    prompt_version: nullableStr(value.prompt_version),
    profile: normalizeProfile(value.profiles),
    conversation: conversation
      ? { title: str(conversation.title, 'Sin título'), protocol_step: toNumber(conversation.protocol_step) || 1 }
      : null,
    latestCheck: checks[0] ?? null,
    review: normalizeReview(value.fetita_memo_reviews),
  };
}

function normalizeCheckDetail(value: unknown): FetitaMemoCheckDetail | null {
  const check = normalizeCheck(value);
  if (!check || !isRecord(value)) return null;
  return { ...check, cost_usd: toNumber(value.cost_usd), result: parseJudgeResult(value.result) };
}

export function normalizeMemoVersion(value: unknown): FetitaAdminMemoVersion | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  const verdict = verdictOrNull(value.verdict);
  if (!verdict) return null;
  const checks = asArray(value.fetita_memo_checks)
    .map(normalizeCheckDetail)
    .filter((check): check is FetitaMemoCheckDetail => check !== null)
    .sort(byCreatedAtDesc);
  return {
    id: value.id,
    version: toNumber(value.version),
    verdict,
    created_at: str(value.created_at),
    prompt_version: nullableStr(value.prompt_version),
    content: parseMemoContent(value.content),
    rawContent: value.content,
    latestCheck: checks[0] ?? null,
    latestOkCheck: checks.find((check) => check.status === 'ok') ?? null,
    checksCount: checks.length,
    review: normalizeReview(value.fetita_memo_reviews),
  };
}

function normalizeFeedback(value: unknown): FetitaAdminFeedback | null {
  if (!isRecord(value)) return null;
  return {
    rating: toNumber(value.rating),
    reason:
      typeof value.reason === 'string' && FEEDBACK_REASON_KEYS.includes(value.reason)
        ? (value.reason as FetitaFeedbackReason)
        : null,
    comment: nullableStr(value.comment),
  };
}

export function normalizeMessage(value: unknown): FetitaAdminMessage | null {
  if (!isRecord(value) || typeof value.id !== 'string') return null;
  return {
    id: value.id,
    seq: toNumber(value.seq),
    role: value.role === 'user' ? 'user' : 'assistant',
    content: str(value.content),
    status:
      typeof value.status === 'string' && MESSAGE_STATUSES.includes(value.status)
        ? (value.status as FetitaMessageStatus)
        : 'complete',
    material_chars: toNullableNumber(value.material_chars),
    material_summary: nullableStr(value.material_summary),
    created_at: str(value.created_at),
    feedback: asArray(value.fetita_feedback)
      .map(normalizeFeedback)
      .filter((feedback): feedback is FetitaAdminFeedback => feedback !== null),
  };
}

export function compact<T>(items: Array<T | null>): T[] {
  return items.filter((item): item is T => item !== null);
}
