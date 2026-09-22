/**
 * fetita-chat: un turno de conversación con Fetita, respondido por streaming.
 *
 * POST { conversation_id?, message, material?, perfil? }
 *   - Sin conversation_id crea una conversación nueva; `perfil` (la
 *     autoevaluación en Markdown) sólo se usa al crearla, queda congelado y
 *     entra como dato en el primer mensaje de la persona.
 *   - `material` es texto pegado por la persona: se lee en una llamada aparte
 *     y a la conversación sólo entra esa lectura. El material no se guarda.
 *
 * Antes de abrir el stream responde con JSON y un código HTTP si algo impide
 * el turno (sin acceso, cupo, presupuesto, conversación ocupada). Después
 * responde con Server-Sent Events (ver _shared/fetita/sse.ts).
 *
 * El historial es append-only: cada fila de fetita_messages guarda los
 * mensajes exactos del turno para la API y el turno siguiente los reenvía tal
 * cual. Ver _shared/fetita/history.ts.
 */
import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import type Anthropic from "npm:@anthropic-ai/sdk@0.126.0";
import { z } from "npm:zod@3.25.76";
import { buildPerfilBlock, PROMPT_VERSION, SYSTEM_PROMPT } from "../_shared/fetita/prompt.ts";
import { DecisionInput, describeZodError, FETITA_TOOLS, MemoContent } from "../_shared/fetita/tools.ts";
import {
  contentForReplay,
  flattenHistory,
  hasReasoning,
  parseMessages,
  serializeMessages,
  stripReasoning,
  visibleText,
} from "../_shared/fetita/history.ts";
import { createEventStream, type FetitaEvent } from "../_shared/fetita/sse.ts";
import { classifyApiError, createAnthropic, readConfig, supportsServerFallback } from "../_shared/fetita/config.ts";
import { logRun } from "../_shared/fetita/runs.ts";
import { composeUserTurn, MAX_MATERIAL_CHARS, readMaterial } from "../_shared/fetita/material.ts";
import { runMemoCheck } from "../_shared/fetita/judge.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const MAX_MESSAGE_CHARS = 8000;
const MAX_PERFIL_INPUT_CHARS = 20000;
// Rondas de herramientas por turno. En la última se le pide al modelo que
// conteste sin herramientas, así el turno siempre termina con texto.
const MAX_TOOL_ROUNDS = 4;
// Tope del turno completo. Supabase corta las funciones a los 150 s en el plan
// gratuito y a los 400 s en el pago; se deja margen para guardar la respuesta.
const TURN_DEADLINE_MS = Number(Deno.env.get("FETITA_TURN_TIMEOUT_MS") ?? "140000");
// Tiempo total de la invocación según el plan. El juez corre en lo que sobra.
const WALL_CLOCK_MS = Number(Deno.env.get("FETITA_WALL_CLOCK_MS") ?? "150000");
// El lock de la conversación dura más que cualquier turno: vence solo si la
// función muere a mitad del turno.
const LOCK_SECONDS = Math.ceil(TURN_DEADLINE_MS / 1000) + 60;

const RequestBody = z.object({
  conversation_id: z.string().uuid().nullish(),
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  material: z.string().max(MAX_MATERIAL_CHARS).nullish(),
  perfil: z.string().max(MAX_PERFIL_INPUT_CHARS).nullish(),
});

// Qué hacer con cada motivo por el que fetita_begin_turn no deja chatear.
const BLOCKED: Record<string, { status: number; message: string }> = {
  sin_acceso: { status: 403, message: "Fetita está en beta cerrada y tu cuenta todavía no tiene acceso." },
  pausada: { status: 503, message: "Fetita está en pausa por un rato. Probá más tarde." },
  presupuesto: { status: 503, message: "Fetita llegó a su tope de uso de este mes. Vuelve el mes que viene." },
  limite_mensual: { status: 429, message: "Usaste todos tus mensajes de este mes con Fetita." },
};

type MessageParam = Anthropic.Beta.BetaMessageParam;

interface EdgeRuntimeLike {
  waitUntil(promise: Promise<unknown>): void;
}

function runInBackground(promise: Promise<unknown>) {
  const runtime = (globalThis as { EdgeRuntime?: EdgeRuntimeLike }).EdgeRuntime;
  if (runtime?.waitUntil) runtime.waitUntil(promise);
}

function jsonError(status: number, code: string, message: string) {
  return new Response(JSON.stringify({ error: code, message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return jsonError(405, "metodo_invalido", "Usá POST.");
  const requestStarted = performance.now();

  let body: z.infer<typeof RequestBody>;
  try {
    const parsed = RequestBody.safeParse(await req.json());
    if (!parsed.success) return jsonError(400, "entrada_invalida", describeZodError(parsed.error));
    body = parsed.data;
  } catch {
    return jsonError(400, "entrada_invalida", "El cuerpo tiene que ser JSON.");
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return jsonError(401, "no_autenticado", "Iniciá sesión para hablar con Fetita.");

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: userData, error: userError } = await supabase.auth.getUser(authHeader.slice("Bearer ".length));
  if (userError || !userData?.user) return jsonError(401, "no_autenticado", "Tu sesión venció. Volvé a iniciar sesión.");

  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", userData.user.id).maybeSingle();
  if (!profile) return jsonError(403, "sin_acceso", BLOCKED.sin_acceso.message);
  const profileId: string = profile.id;

  const config = readConfig();
  let anthropic: Anthropic;
  try {
    anthropic = createAnthropic();
  } catch (error) {
    console.error("[fetita]", error);
    return jsonError(500, "api_auth", "Fetita no está bien configurada. Avisale a Nico.");
  }

  // Acceso, cupo, presupuesto y lock en una sola transacción: la UI sólo los
  // muestra. Toma la conversación (o la crea) con el lock puesto y deja un
  // solo turno en curso por persona.
  const perfil = body.perfil?.trim() ? body.perfil.trim().slice(0, MAX_PERFIL_INPUT_CHARS) : null;
  const { data: begun, error: beginError } = await supabase.rpc("fetita_begin_turn", {
    p_profile_id: profileId,
    p_conversation_id: body.conversation_id ?? null,
    p_lock_seconds: LOCK_SECONDS,
    p_prompt_version: PROMPT_VERSION,
    p_model: config.model,
    p_perfil: body.conversation_id ? null : perfil,
  });
  if (beginError || !begun) {
    console.error("[fetita] fetita_begin_turn:", beginError?.message);
    return jsonError(500, "error_interno", "No pudimos abrir la conversación. Probá de nuevo.");
  }
  switch (begun.status) {
    case "ok":
      break;
    case "blocked": {
      const blocked = BLOCKED[begun.reason as string] ?? BLOCKED.sin_acceso;
      return jsonError(blocked.status, begun.reason ?? "sin_acceso", blocked.message);
    }
    case "busy":
      return jsonError(409, "conversacion_ocupada", "Fetita todavía está respondiendo en esta conversación.");
    case "busy_other":
      return jsonError(409, "turno_en_curso", "Fetita todavía está terminando tu mensaje anterior. Probá en unos segundos.");
    default:
      return jsonError(404, "conversacion_no_encontrada", "No encontramos esa conversación.");
  }
  const conversation = begun.conversation as ConversationRow;
  const isNewConversation = !body.conversation_id;

  const events = createEventStream();
  const work = runTurn({
    supabase,
    anthropic,
    config,
    profileId,
    conversation,
    isNewConversation,
    requestStarted,
    message: body.message,
    material: body.material?.trim() || null,
    send: events.send,
  }).finally(() => events.close());
  runInBackground(work);

  return new Response(events.stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
});

interface ConversationRow {
  id: string;
  title: string;
  perfil_snapshot: string | null;
  prompt_version: string;
  user_message_count: number;
}

interface TurnContext {
  supabase: SupabaseClient;
  anthropic: Anthropic;
  config: ReturnType<typeof readConfig>;
  profileId: string;
  conversation: ConversationRow;
  isNewConversation: boolean;
  /** performance.now() al recibir el pedido, para saber cuánto tiempo le queda a la invocación. */
  requestStarted: number;
  message: string;
  material: string | null;
  send: (event: FetitaEvent) => void;
}

async function runTurn(ctx: TurnContext): Promise<void> {
  const { supabase, anthropic, config, profileId, conversation, send } = ctx;
  const turnId = crypto.randomUUID();
  const deadline = new AbortController();
  const timer = setTimeout(() => deadline.abort(), TURN_DEADLINE_MS);
  const savedMemoIds: string[] = [];
  let userMessageSaved = false;
  // Mensajes de este turno posteriores al del usuario (respuestas y tool results).
  const turnMessages: MessageParam[] = [];
  const turnTexts: string[] = [];
  let status: "complete" | "truncated" | "refused" | "error" = "complete";

  const baseRun = {
    userId: profileId,
    conversationId: conversation.id,
    turnId,
    promptVersion: PROMPT_VERSION,
  };

  try {
    // 1. Historial guardado. Si la conversación arrancó con otra versión del
    // prompt, su razonamiento quedó atado al system anterior: se limpia una
    // sola vez y la conversación pasa a la versión actual.
    const { data: rows, error: rowsError } = await supabase
      .from("fetita_messages")
      .select("id, role, api_messages")
      .eq("conversation_id", conversation.id)
      .order("seq", { ascending: true });
    if (rowsError) throw new Error(`historial: ${rowsError.message}`);

    let history = flattenHistory(rows ?? []);
    if (conversation.prompt_version !== PROMPT_VERSION) {
      // La versión se actualiza sólo si se limpiaron todas las filas: si una
      // falla, el turno siguiente vuelve a intentarlo (limpiar es idempotente).
      let allStripped = true;
      if (hasReasoning(history)) {
        for (const row of rows ?? []) {
          if (row.role !== "assistant") continue;
          const stripped = stripReasoning(parseMessages(row.api_messages));
          const { error } = await supabase
            .from("fetita_messages")
            .update({ api_messages: serializeMessages(stripped) })
            .eq("id", row.id);
          if (error) {
            allStripped = false;
            console.error("[fetita] limpiar razonamiento:", error.message);
          }
        }
        history = stripReasoning(history);
      }
      if (allStripped) {
        await supabase.from("fetita_conversations").update({ prompt_version: PROMPT_VERSION }).eq("id", conversation.id);
      }
    }

    // 2. Material: se lee aparte y sólo entra la lectura.
    let reading: string | null = null;
    const materialChars = ctx.material?.length ?? 0;
    if (ctx.material) {
      send({ type: "status", text: "Leyendo el material que pegaste…" });
      const started = performance.now();
      try {
        const result = await readMaterial({
          anthropic,
          model: config.auxModel,
          decisionTitle: conversation.title,
          userMessage: ctx.message,
          material: ctx.material,
          signal: deadline.signal,
        });
        await logRun(supabase, {
          ...baseRun,
          kind: "material",
          modelRequested: config.auxModel,
          modelServed: result.message.model,
          usage: result.message.usage,
          latencyMs: result.latencyMs,
          stopReason: result.message.stop_reason,
        });
        if (result.message.stop_reason === "max_tokens") {
          // Una lectura cortada no entra: quedaría para siempre en el historial como si fuera completa.
          send({ type: "error", code: "material_ilegible", message: "El material es demasiado largo para leerlo completo. Probá con un fragmento más corto." });
          return;
        }
        reading = result.text || null;
        if (!reading) {
          send({ type: "error", code: "material_ilegible", message: "No pudimos leer ese material. Probá con un fragmento más corto o sin datos personales." });
          return;
        }
        send({ type: "material", summary: reading });
      } catch (error) {
        const { code, message } = classifyApiError(error);
        await logRun(supabase, {
          ...baseRun,
          kind: "material",
          modelRequested: config.auxModel,
          modelServed: null,
          usage: null,
          latencyMs: performance.now() - started,
          stopReason: null,
          errorCode: code,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        send({ type: "error", code, message });
        return;
      }
    }

    // 3. El mensaje de la persona queda guardado antes de llamar al modelo.
    // El perfil entra como dato en el primer mensaje de la conversación, no en
    // el system: lo manda el cliente y no puede tener rango de instrucción.
    const perfilBlock = history.length === 0 ? buildPerfilBlock(conversation.perfil_snapshot) : null;
    const userParam: MessageParam = {
      role: "user",
      content: [
        ...(perfilBlock ? [{ type: "text" as const, text: perfilBlock }] : []),
        { type: "text", text: composeUserTurn(ctx.message, reading, materialChars) },
      ],
    };
    const { data: userRow, error: userRowError } = await supabase
      .from("fetita_messages")
      .insert({
        conversation_id: conversation.id,
        user_id: profileId,
        role: "user",
        content: ctx.message,
        material_chars: ctx.material ? materialChars : null,
        material_summary: reading,
        api_messages: serializeMessages([userParam]),
      })
      .select("id")
      .single();
    if (userRowError || !userRow) throw new Error(`guardar mensaje: ${userRowError?.message}`);
    userMessageSaved = true;
    const userMessageId: string = userRow.id;
    await supabase
      .from("fetita_conversations")
      .update({ user_message_count: conversation.user_message_count + 1, last_message_at: new Date().toISOString() })
      .eq("id", conversation.id);
    send({ type: "start", conversation_id: conversation.id, user_message_id: userMessageId });

    // 4. El loop del agente.
    const system: Anthropic.Beta.BetaTextBlockParam[] = [
      // Breakpoint al final de tools + prompt fijo: se comparte entre todas las conversaciones.
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ];

    const useFallback = supportsServerFallback(config.model);

    for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
      const lastRound = round === MAX_TOOL_ROUNDS;
      const started = performance.now();
      let roundHasText = false;
      const params = {
        model: config.model,
        max_tokens: config.maxTokens,
        system,
        tools: FETITA_TOOLS,
        // En la última ronda se piden sólo palabras: el turno tiene que cerrar con texto.
        ...(lastRound ? { tool_choice: { type: "none" as const } } : {}),
        messages: [...history, userParam, ...turnMessages],
        thinking: { type: "adaptive" as const },
        output_config: { effort: config.effort },
        // Breakpoint automático al final de la conversación: el turno siguiente
        // lee de caché todo lo anterior.
        cache_control: { type: "ephemeral" as const },
        ...(useFallback ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      };

      let final: Anthropic.Beta.BetaMessage;
      let stream: ReturnType<typeof anthropic.beta.messages.stream> | null = null;
      try {
        stream = anthropic.beta.messages.stream(params, { signal: deadline.signal });
        stream.on("text", (delta: string) => {
          if (!roundHasText && turnTexts.some((t) => t.length > 0)) send({ type: "text", delta: "\n\n" });
          roundHasText = true;
          send({ type: "text", delta });
        });
        final = await stream.finalMessage();
      } catch (error) {
        const { code, message } = classifyApiError(error);
        // Lo que se alcanzó a generar se cobra igual: se registra el uso parcial.
        const partial = stream?.currentMessage;
        await logRun(supabase, {
          ...baseRun,
          kind: "chat",
          modelRequested: config.model,
          modelServed: partial?.model ?? null,
          usage: partial?.usage ?? null,
          latencyMs: performance.now() - started,
          stopReason: null,
          errorCode: code,
          errorMessage: error instanceof Error ? error.message : String(error),
        });
        status = "error";
        send({ type: "error", code, message });
        break;
      }

      const fallbackUsed = (final.usage.iterations ?? []).some((i) => i.type === "fallback_message");
      await logRun(supabase, {
        ...baseRun,
        kind: "chat",
        modelRequested: config.model,
        modelServed: final.model,
        usage: final.usage,
        latencyMs: performance.now() - started,
        stopReason: final.stop_reason,
        fallbackUsed,
      });

      if (final.stop_reason === "refusal") {
        // Lo que se alcanzó a mostrar de esta ronda no se guarda ni se reenvía.
        // Si el turno no dejó nada, el mensaje que se declinó sale del
        // historial: si no, cada turno siguiente lo reenviaría y se volvería a
        // declinar. Es la última fila, así que no cambia nada anterior.
        if (turnMessages.length === 0) {
          const { error: resetError } = await supabase
            .from("fetita_messages")
            .update({ api_messages: "[]" })
            .eq("id", userMessageId);
          if (resetError) console.error("[fetita] sacar mensaje declinado:", resetError.message);
        }
        status = "refused";
        send({
          type: "error",
          code: "refused",
          message: "Fetita no puede seguir con este pedido. Probá reformularlo o abrí una decisión nueva.",
        });
        break;
      }

      // Sólo se ejecutan las herramientas que quedan en lo que se reenvía: las
      // que pidió un modelo que después declinó (antes de un fallback) no.
      const replay = contentForReplay(final.content);
      const toolUses = replay.filter((b): b is Anthropic.Beta.BetaToolUseBlockParam => b.type === "tool_use");

      if (final.stop_reason === "max_tokens" && toolUses.length > 0) {
        // Una herramienta cortada a la mitad no se ejecuta.
        status = "error";
        send({ type: "error", code: "respuesta_cortada", message: "La respuesta quedó cortada. Pedile a Fetita que lo haga más corto." });
        break;
      }

      if (replay.length > 0) turnMessages.push({ role: "assistant", content: replay });
      turnTexts.push(visibleText(final.content));

      if (toolUses.length === 0 || lastRound) {
        if (final.stop_reason === "max_tokens") status = "truncated";
        break;
      }

      // Cada tool_use necesita su tool_result en el mensaje siguiente, aunque la
      // herramienta falle: si no, el historial queda inválido para la API.
      const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
      for (const toolUse of toolUses) {
        try {
          results.push(await executeTool(ctx, toolUse, savedMemoIds));
        } catch (error) {
          console.error(`[fetita] ${toolUse.name}:`, error);
          results.push({
            type: "tool_result",
            tool_use_id: toolUse.id,
            is_error: true,
            content: "La herramienta falló. Seguí con la conversación.",
          });
        }
      }
      turnMessages.push({ role: "user", content: results });
    }

    // 5. La respuesta queda guardada aunque la persona haya cerrado la pestaña.
    const content = turnTexts.filter((t) => t.trim().length > 0).join("\n\n");
    const { data: assistantRow, error: assistantError } = await supabase
      .from("fetita_messages")
      .insert({
        conversation_id: conversation.id,
        user_id: profileId,
        role: "assistant",
        content,
        status,
        api_messages: serializeMessages(withoutDanglingToolUse(turnMessages)),
      })
      .select("id")
      .single();
    if (assistantError) console.error("[fetita] guardar respuesta:", assistantError.message);
    send({ type: "done", assistant_message_id: assistantRow?.id ?? null, status });
  } catch (error) {
    console.error("[fetita] turno:", error);
    const { code, message } = classifyApiError(error);
    send({ type: "error", code, message });
    if (userMessageSaved) {
      const content = turnTexts.filter((t) => t.trim().length > 0).join("\n\n");
      await supabase.from("fetita_messages").insert({
        conversation_id: conversation.id,
        user_id: profileId,
        role: "assistant",
        content,
        status: "error",
        api_messages: serializeMessages(withoutDanglingToolUse(turnMessages)),
      });
    }
  } finally {
    clearTimeout(timer);
    if (ctx.isNewConversation && !userMessageSaved) {
      // Falló antes del primer mensaje: no queda una conversación vacía en la lista.
      await supabase.from("fetita_conversations").delete().eq("id", conversation.id);
    } else {
      await supabase
        .from("fetita_conversations")
        .update({ locked_until: null, last_message_at: new Date().toISOString() })
        .eq("id", conversation.id);
    }
    // El juez corre después de cerrar el turno, sobre la última versión del
    // memo, con el tiempo que le queda a la invocación.
    const lastMemoId = savedMemoIds.at(-1);
    if (lastMemoId) {
      const remainingMs = WALL_CLOCK_MS - (performance.now() - ctx.requestStarted) - 5_000;
      runInBackground(
        runMemoCheck({ supabase, anthropic, model: config.auxModel, memoId: lastMemoId, timeoutMs: Math.min(120_000, remainingMs) }),
      );
    }
  }
}

/**
 * Si el turno se cortó justo después de un tool_use, ese mensaje no puede
 * quedar en el historial sin su tool_result: se descarta.
 */
function withoutDanglingToolUse(messages: MessageParam[]): MessageParam[] {
  const last = messages.at(-1);
  if (last?.role === "assistant" && Array.isArray(last.content) && last.content.some((b) => b.type === "tool_use")) {
    return messages.slice(0, -1);
  }
  return messages;
}

async function executeTool(
  ctx: TurnContext,
  toolUse: Anthropic.Beta.BetaToolUseBlockParam,
  savedMemoIds: string[],
): Promise<Anthropic.Beta.BetaToolResultBlockParam> {
  const { supabase, conversation, profileId, send } = ctx;
  const error = (text: string): Anthropic.Beta.BetaToolResultBlockParam => ({
    type: "tool_result",
    tool_use_id: toolUse.id,
    is_error: true,
    content: text,
  });

  if (toolUse.name === "actualizar_decision") {
    const parsed = DecisionInput.safeParse(toolUse.input);
    if (!parsed.success) return error(`Input inválido: ${describeZodError(parsed.error)}`);
    const { titulo, paso_protocolo } = parsed.data;
    const { error: dbError } = await supabase
      .from("fetita_conversations")
      .update({ title: titulo, protocol_step: paso_protocolo })
      .eq("id", conversation.id);
    if (dbError) {
      console.error("[fetita] actualizar_decision:", dbError.message);
      return error("No se pudo guardar. Seguí con la conversación.");
    }
    conversation.title = titulo;
    send({ type: "decision", title: titulo, protocol_step: paso_protocolo });
    return { type: "tool_result", tool_use_id: toolUse.id, content: "Listo." };
  }

  if (toolUse.name === "guardar_memo") {
    const parsed = MemoContent.safeParse(toolUse.input);
    if (!parsed.success) return error(`Input inválido: ${describeZodError(parsed.error)}`);
    const memo = parsed.data;

    // El lock de la conversación garantiza que nadie más guarda en paralelo.
    const { data: last } = await supabase
      .from("fetita_memos")
      .select("version")
      .eq("conversation_id", conversation.id)
      .order("version", { ascending: false })
      .limit(1)
      .maybeSingle();
    const version = (last?.version ?? 0) + 1;

    const { data: saved, error: dbError } = await supabase
      .from("fetita_memos")
      .insert({
        conversation_id: conversation.id,
        user_id: profileId,
        version,
        verdict: memo.veredicto,
        content: memo,
        prompt_version: PROMPT_VERSION,
      })
      .select("id, version, verdict, content, created_at")
      .single();
    if (dbError || !saved) {
      console.error("[fetita] guardar_memo:", dbError?.message);
      return error("No se pudo guardar el memo. Intentá de nuevo en este mismo turno.");
    }
    await supabase.from("fetita_conversations").update({ verdict: memo.veredicto }).eq("id", conversation.id);
    savedMemoIds.push(saved.id);
    send({ type: "memo", memo: saved });
    return {
      type: "tool_result",
      tool_use_id: toolUse.id,
      content: `Memo guardado (versión ${version}). La persona ya lo ve en el panel del memo.`,
    };
  }

  return error(`Herramienta desconocida: ${toolUse.name}`);
}
