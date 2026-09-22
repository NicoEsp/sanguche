import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  PROTOCOL_STEPS,
  type FetitaFeedbackReason,
  type FetitaMemoContent,
  type FetitaMessageStatus,
  type FetitaVerdict,
} from '@/lib/fetita/types';

/**
 * Tipos, constantes y helpers puros del admin de Fetita. Los componentes y los
 * hooks viven aparte; acá no hay nada de React.
 */

// ---------------------------------------------------------------------------
// admin_fetita_overview (ver supabase/migrations/20260922120000_create_fetita.sql)
// ---------------------------------------------------------------------------

export type FetitaRunKind = 'chat' | 'material' | 'judge';
export type FetitaReviewStatus = 'correcto' | 'alucinacion' | 'desafio_flojo';
export type FetitaJudgeVerdict = 'soportada' | 'parcial' | 'no_soportada';

export interface FetitaOverviewTotals {
  cost_usd: number;
  requests: number;
  chat_turns: number;
  active_users: number;
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  errors: number;
  refusals: number;
  fallbacks: number;
  unpriced: number;
  avg_latency_ms: number | null;
  p95_latency_ms: number | null;
}

export interface FetitaOverviewDay {
  /** Fecha en hora de Argentina, YYYY-MM-DD. */
  day: string;
  cost_usd: number;
  requests: number;
  chat_turns: number;
}

export interface FetitaOverviewKind {
  kind: string;
  cost_usd: number;
  requests: number;
}

export interface FetitaOverviewModel {
  model: string;
  cost_usd: number;
  requests: number;
}

/** user_id, name y email vienen en null si se borró la cuenta (el costo queda). */
export interface FetitaOverviewUser {
  user_id: string | null;
  name: string | null;
  email: string | null;
  cost_usd: number;
  chat_turns: number;
  conversations: number;
  last_active: string;
}

export interface FetitaOverviewChecks {
  memos_checked: number;
  claims_total: number;
  claims_unsupported: number;
  claims_partial: number;
  memos_with_unsupported: number;
}

export interface FetitaOverviewFeedback {
  up: number;
  down: number;
  invento_algo: number;
  no_me_desafio: number;
  confuso: number;
  otro: number;
}

export interface FetitaOverviewQuality {
  memos_total: number;
  verdicts: Partial<Record<FetitaVerdict, number>>;
  checks: FetitaOverviewChecks;
  reviews: Partial<Record<FetitaReviewStatus, number>>;
  feedback: FetitaOverviewFeedback;
  assistant_messages: number;
}

/** Siempre el mes calendario en curso en hora de Argentina, sin importar el rango. */
export interface FetitaOverviewMonth {
  spent_usd: number;
  monthly_budget_usd: number;
  enabled: boolean;
  default_monthly_messages: number;
  month_start: string;
}

export interface FetitaOverview {
  range: { from: string; to: string };
  totals: FetitaOverviewTotals;
  by_day: FetitaOverviewDay[];
  by_kind: FetitaOverviewKind[];
  by_model: FetitaOverviewModel[];
  by_user: FetitaOverviewUser[];
  quality: FetitaOverviewQuality;
  month: FetitaOverviewMonth | null;
}

// ---------------------------------------------------------------------------
// Filas de tablas
// ---------------------------------------------------------------------------

export interface FetitaProfileRef {
  id?: string;
  name: string | null;
  email: string | null;
}

export interface FetitaSettingsRow {
  enabled: boolean;
  monthly_budget_usd: number;
  default_monthly_messages: number;
  updated_at: string;
}

export interface FetitaAccessRow {
  user_id: string;
  enabled: boolean;
  /** null = usa default_monthly_messages de fetita_settings. */
  monthly_message_limit: number | null;
  note: string | null;
  created_at: string;
  updated_at: string;
  profile: FetitaProfileRef | null;
}

export interface FetitaAdminConversation {
  id: string;
  user_id: string;
  title: string;
  protocol_step: number;
  /** Veredicto del último memo; null si todavía no hay memo. */
  verdict: FetitaVerdict | null;
  user_message_count: number;
  model: string;
  prompt_version: string;
  created_at: string;
  last_message_at: string;
  profile: FetitaProfileRef | null;
}

export type FetitaConversationVerdictFilter = 'all' | FetitaVerdict | 'sin_memo';

export interface FetitaConversationFilters {
  verdict?: FetitaConversationVerdictFilter;
}

export interface FetitaMemoCheck {
  id: string;
  status: 'ok' | 'error';
  model: string;
  claims_total: number;
  claims_supported: number;
  claims_partial: number;
  claims_unsupported: number;
  error: string | null;
  created_at: string;
}

export interface FetitaJudgeClaim {
  campo: string;
  afirmacion: string;
  veredicto: FetitaJudgeVerdict;
  evidencia: string;
  comentario: string;
}

/** Lo que guarda el juez en fetita_memo_checks.result (ver _shared/fetita/judge.ts). */
export interface FetitaJudgeResult {
  afirmaciones: FetitaJudgeClaim[];
  resumen: string;
}

export interface FetitaMemoCheckDetail extends FetitaMemoCheck {
  cost_usd: number;
  result: FetitaJudgeResult | null;
}

export interface FetitaMemoReview {
  status: FetitaReviewStatus;
  note: string | null;
  reviewed_at: string;
}

export interface FetitaAdminMemoRow {
  id: string;
  conversation_id: string;
  user_id: string;
  version: number;
  verdict: FetitaVerdict;
  created_at: string;
  prompt_version: string | null;
  profile: FetitaProfileRef | null;
  conversation: { title: string; protocol_step: number } | null;
  /** El check más reciente, sea ok o error. */
  latestCheck: FetitaMemoCheck | null;
  review: FetitaMemoReview | null;
}

export interface FetitaAdminMemoVersion {
  id: string;
  version: number;
  verdict: FetitaVerdict;
  created_at: string;
  prompt_version: string | null;
  /** null si el jsonb guardado no tiene la forma esperada. */
  content: FetitaMemoContent | null;
  rawContent: unknown;
  latestCheck: FetitaMemoCheckDetail | null;
  /** El último check con status ok (el que usa el resumen), aunque haya uno más nuevo con error. */
  latestOkCheck: FetitaMemoCheckDetail | null;
  checksCount: number;
  review: FetitaMemoReview | null;
}

export interface FetitaAdminFeedback {
  rating: number;
  reason: FetitaFeedbackReason | null;
  comment: string | null;
}

export interface FetitaAdminMessage {
  id: string;
  seq: number;
  role: 'user' | 'assistant';
  content: string;
  status: FetitaMessageStatus;
  material_chars: number | null;
  material_summary: string | null;
  created_at: string;
  feedback: FetitaAdminFeedback[];
}

export interface FetitaConversationDetail {
  conversation: FetitaAdminConversation | null;
  messages: FetitaAdminMessage[];
  /** De la versión más nueva a la más vieja. */
  memos: FetitaAdminMemoVersion[];
}

export type FetitaReviewFilter = 'all' | 'sin_revisar' | FetitaReviewStatus;

/** Tope de filas de las listas de conversaciones y memos (se pagina en el cliente). */
export const ADMIN_LIST_LIMIT = 300;

// ---------------------------------------------------------------------------
// Etiquetas
// ---------------------------------------------------------------------------

export const VERDICT_ORDER: readonly FetitaVerdict[] = ['listo', 'falta', 'frenar'];

export const REVIEW_STATUS_ORDER: readonly FetitaReviewStatus[] = ['correcto', 'alucinacion', 'desafio_flojo'];

export const REVIEW_STATUS_META: Record<FetitaReviewStatus, { label: string; description: string; className: string }> = {
  correcto: {
    label: 'Correcto',
    description: 'Lo que afirma el memo sale de la conversación y el desafío estuvo bien.',
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
  },
  alucinacion: {
    label: 'Alucinación',
    description: 'El memo afirma algo que la persona no dijo.',
    className: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
  },
  desafio_flojo: {
    label: 'Desafío flojo',
    description: 'No inventó nada, pero Fetita no desafió lo suficiente.',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
  },
};

export const JUDGE_VERDICT_ORDER: readonly FetitaJudgeVerdict[] = ['no_soportada', 'parcial', 'soportada'];

export const JUDGE_VERDICT_META: Record<FetitaJudgeVerdict, { label: string; className: string; accentClass: string }> = {
  soportada: {
    label: 'Soportada',
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30',
    accentClass: 'border-l-emerald-500',
  },
  parcial: {
    label: 'Parcial',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30',
    accentClass: 'border-l-amber-500',
  },
  no_soportada: {
    label: 'No soportada',
    className: 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30',
    accentClass: 'border-l-red-500',
  },
};

export const RUN_KIND_LABELS: Record<FetitaRunKind, string> = {
  chat: 'Conversación',
  material: 'Lectura de material',
  judge: 'Juez de alucinaciones',
};

export function runKindLabel(kind: string): string {
  return RUN_KIND_LABELS[kind as FetitaRunKind] ?? kind;
}

/** Notas para el admin (las del usuario le hablan a la persona, no sirven acá). */
export const ADMIN_MESSAGE_STATUS_NOTE: Partial<Record<FetitaMessageStatus, string>> = {
  truncated: 'La respuesta quedó cortada por longitud.',
  refused: 'El modelo se negó a responder este turno.',
  error: 'La respuesta se cortó por un error.',
};

// ---------------------------------------------------------------------------
// Rangos de fechas (en hora de Argentina, como agrupa el RPC)
// ---------------------------------------------------------------------------

export type FetitaRangePreset = 'this_month' | '7d' | '30d' | 'last_month';

export const RANGE_PRESETS: ReadonlyArray<{ value: FetitaRangePreset; label: string }> = [
  { value: 'this_month', label: 'Este mes' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'last_month', label: 'Mes anterior' },
];

export interface FetitaDateRange {
  /** ISO, inclusivo. */
  from: string;
  /** ISO, exclusivo (el RPC filtra created_at < p_to). */
  to: string;
}

export const AR_TIME_ZONE = 'America/Argentina/Buenos_Aires';
// Argentina está en UTC-3 todo el año (no tiene horario de verano).
const AR_UTC_OFFSET_HOURS = 3;

const arDayFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: AR_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

function arCalendarDay(date: Date): { year: number; month: number; day: number } {
  const parts = arDayFormatter.formatToParts(date);
  const read = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value);
  return { year: read('year'), month: read('month'), day: read('day') };
}

/** Medianoche de Argentina. monthIndex empieza en 0 y admite desbordes (día 0, mes 12). */
function arMidnight(year: number, monthIndex: number, day: number): Date {
  return new Date(Date.UTC(year, monthIndex, day, AR_UTC_OFFSET_HOURS));
}

/** YYYY-MM-DD del día en Argentina, igual que by_day.day. */
export function arDayKey(date: Date): string {
  const { year, month, day } = arCalendarDay(date);
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Rango de un preset con límites en medianoche de Argentina: el resultado es
 * estable durante todo el día, así que no cambia la queryKey entre renders.
 * "Este mes" coincide con month_start del RPC.
 */
export function presetToRange(preset: FetitaRangePreset, now: Date): FetitaDateRange {
  const { year, month, day } = arCalendarDay(now);
  const monthIndex = month - 1;
  let from: Date;
  let to: Date;
  switch (preset) {
    case '7d':
      from = arMidnight(year, monthIndex, day - 6);
      to = arMidnight(year, monthIndex, day + 1);
      break;
    case '30d':
      from = arMidnight(year, monthIndex, day - 29);
      to = arMidnight(year, monthIndex, day + 1);
      break;
    case 'last_month':
      from = arMidnight(year, monthIndex - 1, 1);
      to = arMidnight(year, monthIndex, 1);
      break;
    case 'this_month':
    default:
      from = arMidnight(year, monthIndex, 1);
      to = arMidnight(year, monthIndex + 1, 1);
      break;
  }
  return { from: from.toISOString(), to: to.toISOString() };
}

export interface FetitaDayPoint {
  day: string;
  cost_usd: number;
  chat_turns: number;
  requests: number;
}

/**
 * Serie diaria completa (con ceros) desde el inicio del rango hasta su fin o
 * hasta hoy, lo que llegue antes. by_day sólo trae los días con consumo.
 */
export function buildDailySeries(byDay: FetitaOverviewDay[], range: FetitaDateRange, now: Date): FetitaDayPoint[] {
  const byKey = new Map(byDay.map((row) => [row.day, row]));
  const start = arCalendarDay(new Date(range.from));
  const lastInstant = Math.min(new Date(range.to).getTime() - 1, now.getTime());
  const endKey = arDayKey(new Date(lastInstant));
  const points: FetitaDayPoint[] = [];
  // Tope de seguridad: ningún preset pasa de 31 días.
  for (let offset = 0; offset < 400; offset++) {
    const key = arDayKey(arMidnight(start.year, start.month - 1, start.day + offset));
    if (key > endKey) break;
    const row = byKey.get(key);
    points.push({
      day: key,
      cost_usd: toNumber(row?.cost_usd),
      chat_turns: toNumber(row?.chat_turns),
      requests: toNumber(row?.requests),
    });
  }
  return points;
}

// ---------------------------------------------------------------------------
// Números y fechas
// ---------------------------------------------------------------------------

/** jsonb numeric llega como number, pero se defiende de null, string o NaN. */
export function toNumber(value: unknown): number {
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : 0;
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  const n = typeof value === 'number' ? value : typeof value === 'string' ? Number(value) : NaN;
  return Number.isFinite(n) ? n : null;
}

const usdFormatter = new Intl.NumberFormat('es-AR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});
const integerFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 0 });
const compactFormatter = new Intl.NumberFormat('es-AR', { notation: 'compact', maximumFractionDigits: 1 });
const percentFormatter = new Intl.NumberFormat('es-AR', { style: 'percent', maximumFractionDigits: 1 });
const oneDecimalFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 });

/** Los costos son fracciones chicas: hasta 4 decimales. */
export function formatUsd(value: unknown): string {
  return usdFormatter.format(toNumber(value));
}

export function formatDecimal(value: unknown): string {
  return oneDecimalFormatter.format(toNumber(value));
}

export function formatInteger(value: unknown): string {
  return integerFormatter.format(toNumber(value));
}

/** "1 llamada", "3 llamadas". */
export function formatCount(value: unknown, singular: string, plural: string): string {
  const n = toNumber(value);
  return `${integerFormatter.format(n)} ${n === 1 ? singular : plural}`;
}

/** 1.234.567 tokens como "1,2 M". */
export function formatTokens(value: unknown): string {
  const n = toNumber(value);
  return n < 10000 ? integerFormatter.format(n) : compactFormatter.format(n);
}

/** null cuando el denominador es 0 o no hay dato. */
export function safeRatio(numerator: unknown, denominator: unknown): number | null {
  const den = toNumber(denominator);
  if (den <= 0) return null;
  return toNumber(numerator) / den;
}

export function formatPercent(numerator: unknown, denominator: unknown): string {
  const ratio = safeRatio(numerator, denominator);
  return ratio === null ? 'Sin datos' : percentFormatter.format(ratio);
}

export function formatLatency(ms: number | null): string {
  if (ms === null || !Number.isFinite(ms)) return 'Sin datos';
  if (ms < 1000) return `${integerFormatter.format(ms)} ms`;
  return `${oneDecimalFormatter.format(ms / 1000)} s`;
}

function formatWith(iso: string | null | undefined, pattern: string): string {
  if (!iso) return '-';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '-';
  return format(date, pattern, { locale: es });
}

export function formatDate(iso: string | null | undefined): string {
  return formatWith(iso, 'dd/MM/yyyy');
}

export function formatDateTime(iso: string | null | undefined): string {
  return formatWith(iso, 'dd/MM/yyyy HH:mm');
}

/** Para las etiquetas de la serie diaria (YYYY-MM-DD, sin zona horaria). */
export function formatDayKey(dayKey: string, withWeekday = false): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  if (!year || !month || !day) return dayKey;
  const date = new Date(year, month - 1, day);
  return format(date, withWeekday ? "EEE d 'de' MMM" : 'dd/MM', { locale: es });
}

// ---------------------------------------------------------------------------
// Otros helpers
// ---------------------------------------------------------------------------

export function profileName(profile: FetitaProfileRef | null | undefined): string {
  return profile?.name?.trim() || 'Sin nombre';
}

export function profileEmail(profile: FetitaProfileRef | null | undefined): string {
  return profile?.email?.trim() || 'Sin email';
}

/**
 * Celda de texto libre para exportToCSV: el util une con comas sin escapar,
 * así que la celda llega ya entre comillas. También neutraliza fórmulas.
 */
export function csvCell(value: unknown): string {
  const text = value === null || value === undefined ? '' : String(value);
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""').replace(/\r?\n/g, ' ')}"`;
}

export function matchesSearch(term: string, ...fields: Array<string | null | undefined>): boolean {
  const needle = term.trim().toLowerCase();
  if (!needle) return true;
  return fields.some((field) => field?.toLowerCase().includes(needle));
}

export type JudgeTone = 'none' | 'error' | 'clean' | 'unsupported';

/** Lo que muestra la columna "Juez" a partir del último check. */
export function describeJudge(check: Pick<FetitaMemoCheck, 'status' | 'claims_total' | 'claims_unsupported'> | null): {
  label: string;
  tone: JudgeTone;
} {
  if (!check) return { label: 'Sin evaluar', tone: 'none' };
  if (check.status === 'error') return { label: 'Error', tone: 'error' };
  const unsupported = toNumber(check.claims_unsupported);
  const total = toNumber(check.claims_total);
  return {
    label: `${unsupported} no soportadas / ${total}`,
    tone: unsupported > 0 ? 'unsupported' : 'clean',
  };
}

export function protocolStepLabel(step: number): string {
  return `Paso ${step}/${PROTOCOL_STEPS.length}`;
}

/** Nombre del paso del protocolo, para tooltips. */
export function protocolStepName(step: number): string {
  return PROTOCOL_STEPS.find((item) => item.step === step)?.label ?? '';
}
