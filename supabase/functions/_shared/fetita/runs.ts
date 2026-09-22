/**
 * Registro de cada request a la API en fetita_runs: tokens, costo, latencia y
 * resultado. Es la fuente del tablero de consumo del admin y del presupuesto
 * mensual. Un error al registrar no rompe el turno: se loguea y se sigue.
 */
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import { type TokenUsage, usageTotals } from "./pricing.ts";

export type RunKind = "chat" | "material" | "judge";

export interface RunRecord {
  userId: string | null;
  conversationId: string | null;
  turnId: string | null;
  kind: RunKind;
  modelRequested: string;
  modelServed: string | null;
  usage: TokenUsage | null;
  latencyMs: number;
  stopReason: string | null;
  promptVersion: string | null;
  fallbackUsed?: boolean;
  errorCode?: string | null;
  errorMessage?: string | null;
}

export async function logRun(supabase: SupabaseClient, run: RunRecord): Promise<number> {
  const model = run.modelServed ?? run.modelRequested;
  const totals = run.usage ? usageTotals(model, run.usage) : null;
  const row = {
    user_id: run.userId,
    conversation_id: run.conversationId,
    turn_id: run.turnId,
    kind: run.kind,
    model_requested: run.modelRequested,
    model_served: run.modelServed,
    input_tokens: totals?.inputTokens ?? 0,
    output_tokens: totals?.outputTokens ?? 0,
    cache_read_tokens: totals?.cacheReadTokens ?? 0,
    cache_write_tokens: totals?.cacheWriteTokens ?? 0,
    cost_usd: totals?.costUsd ?? 0,
    price_known: totals?.priced ?? true,
    latency_ms: Math.round(run.latencyMs),
    stop_reason: run.stopReason,
    prompt_version: run.promptVersion,
    fallback_used: run.fallbackUsed ?? false,
    error_code: run.errorCode ?? null,
    error_message: run.errorMessage ? run.errorMessage.slice(0, 1000) : null,
  };
  let { error } = await supabase.from("fetita_runs").insert(row);
  if (error?.code === "23503") {
    // El perfil se borró a mitad del turno: el gasto se registra igual, sin dueño.
    ({ error } = await supabase.from("fetita_runs").insert({ ...row, user_id: null }));
  }
  if (error) console.error("[fetita] no se pudo registrar el run:", error.message);
  return totals?.costUsd ?? 0;
}
