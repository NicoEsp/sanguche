/**
 * Tipos y constantes de Fetita compartidos entre la página del usuario, el
 * admin y el cliente de streaming. Espejan lo que guarda la edge function
 * fetita-chat (ver supabase/functions/_shared/fetita/tools.ts).
 */

export type FetitaVerdict = "listo" | "falta" | "frenar";

export type FetitaMessageStatus = "complete" | "truncated" | "refused" | "error";

export type FetitaFeedbackReason = "invento_algo" | "no_me_desafio" | "confuso" | "otro";

export type FetitaBlockedReason = "sin_acceso" | "pausada" | "presupuesto" | "limite_mensual";

export interface FetitaStatus {
  user_enabled: boolean;
  global_enabled?: boolean;
  is_admin?: boolean;
  /** null para el admin: no tiene tope. */
  monthly_limit?: number | null;
  used_this_month?: number;
  remaining?: number | null;
  can_chat: boolean;
  reason: FetitaBlockedReason | null;
  month_start?: string;
}

export interface FetitaMemoContent {
  decision: string;
  problema_y_segmento: string;
  evidencia: Array<{
    afirmacion: string;
    tipo: "directa" | "indirecta" | "supuesto";
    procedencia: string;
    peso: "alto" | "medio" | "bajo";
  }>;
  supuestos_abiertos: string[];
  sesgos: Array<{ sesgo: string; por_que_importa: string }>;
  que_se_deja_de_hacer: { que: string; quien_lo_acepto: string };
  que_la_refutaria: string;
  test_mas_chico: { que: string; plazo: string; resultado_esperado: string };
  criterio_de_fin: string;
  veredicto: FetitaVerdict;
  motivo_veredicto: string;
  huecos: Array<{ hueco: string; como_cerrarlo: string }>;
  cambios_vs_anterior: string;
}

export interface FetitaMemo {
  id: string;
  conversation_id?: string;
  version: number;
  verdict: FetitaVerdict;
  content: FetitaMemoContent;
  created_at: string;
}

export interface FetitaConversation {
  id: string;
  title: string;
  protocol_step: number;
  verdict: FetitaVerdict | null;
  user_message_count: number;
  last_message_at: string;
  created_at: string;
}

export interface FetitaMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: FetitaMessageStatus;
  material_chars: number | null;
  material_summary: string | null;
  created_at: string;
}

/** Eventos del stream de fetita-chat. */
export type FetitaStreamEvent =
  | { type: "start"; conversation_id: string; user_message_id: string }
  | { type: "status"; text: string }
  | { type: "material"; summary: string }
  | { type: "text"; delta: string }
  | { type: "decision"; title: string; protocol_step: number }
  | { type: "memo"; memo: FetitaMemo }
  | { type: "done"; assistant_message_id: string | null; status: FetitaMessageStatus }
  | { type: "error"; code: string; message: string };

export const PROTOCOL_STEPS = [
  { step: 1, label: "Decisión", hint: "Qué se quiere construir, en una frase" },
  { step: 2, label: "Problema", hint: "Qué problema y para quién" },
  { step: 3, label: "Evidencia", hint: "Qué se sabe y de dónde salió" },
  { step: 4, label: "Refutación", hint: "Qué tendría que ser cierto para que esté mal" },
  { step: 5, label: "Exclusión", hint: "Qué se deja de hacer" },
  { step: 6, label: "Test", hint: "La versión más chica que enseña algo" },
  { step: 7, label: "Fin", hint: "Cuándo termina el discovery" },
] as const;

export const VERDICT_META: Record<FetitaVerdict, { label: string; description: string; className: string }> = {
  listo: {
    label: "Listo para comprometer",
    description: "Hay evidencia directa, un test definido, la exclusión explícita y un criterio de fin.",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30",
  },
  falta: {
    label: "Falta",
    description: "La decisión puede estar bien, pero quedan huecos nombrados.",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30",
  },
  frenar: {
    label: "Frenar",
    description: "La evidencia la contradice, o todo son supuestos sin forma de testearlos.",
    className: "bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30",
  },
};

export const FEEDBACK_REASONS: Record<FetitaFeedbackReason, string> = {
  invento_algo: "Inventó algo que no dije",
  no_me_desafio: "No me desafió",
  confuso: "Confuso o muy largo",
  otro: "Otro",
};

export const BLOCKED_COPY: Record<FetitaBlockedReason, string> = {
  sin_acceso: "Fetita está en beta cerrada y tu cuenta todavía no tiene acceso.",
  pausada: "Fetita está en pausa por un rato. Tus conversaciones siguen acá.",
  presupuesto: "Fetita llegó a su tope de uso de este mes. Vuelve el mes que viene.",
  limite_mensual: "Usaste todos tus mensajes de este mes. Tus conversaciones siguen acá para releer.",
};

export const MAX_MESSAGE_CHARS = 8000;
export const MAX_MATERIAL_CHARS = 60000;
