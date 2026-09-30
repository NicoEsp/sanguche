/**
 * fetita-chat: la conversación con Fetita, el agente de ProductPrepa.
 *
 * POST { message, perfil?, entry_point? } responde por Server-Sent Events:
 *   { type: "text", delta } mientras llega la respuesta,
 *   { type: "done" } cuando quedó guardada,
 *   { type: "error", message } si el turno falló.
 * POST { action: "restart" } archiva el hilo actual.
 * POST { action: "feedback", message_id, rating, comment? } guarda el pulgar sobre un cierre.
 *
 * Cada persona tiene un hilo. El mensaje y la respuesta se guardan juntos al
 * final del turno. Si el turno falla, se guarda como fallido: queda para
 * análisis pero no se le reenvía al modelo. El perfil (nombre e historial de
 * evaluaciones) entra una sola vez, en el primer mensaje del hilo.
 *
 * Los eventos de Mixpanel salen desde acá, ver metrics.ts.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Anthropic from "npm:@anthropic-ai/sdk@0.126.0";
import { SYSTEM } from "./prompt.ts";
import { readMarks, secondsSince, type Step, track, type TrackEvent, visibleLength } from "./metrics.ts";

const MODEL = Deno.env.get("FETITA_MODEL") || "claude-opus-5";
const EFFORT = (Deno.env.get("FETITA_EFFORT") || "medium") as "low" | "medium" | "high" | "xhigh" | "max";
// Si un clasificador de seguridad declina el pedido, la API lo reintenta con
// otro modelo dentro de la misma llamada. Sólo en los modelos que lo soportan.
const SERVER_FALLBACK = /^claude-(opus-5|opus-5-5|fable-5-1)\b/.test(MODEL);
const MAX_MESSAGE_CHARS = 8000;
// Cada persona puede tener hasta 2 conversaciones: la primera y un "empezar de
// nuevo" para probar con otro tema. Los admins no tienen tope. Es el mismo
// número que FETITA_MAX_CONVERSATIONS en src/lib/fetita.ts.
const MAX_CONVERSATIONS = 2;
const LIMIT_MESSAGE = "Ya usaste tus 2 conversaciones de la beta. Gracias por probar Fetita.";
const MAX_PERFIL_CHARS = 40000;
// Supabase corta la función a los 150 s en el plan gratuito.
const TURN_TIMEOUT_MS = 140_000;
// La versión del prompt es un hash del texto: cambia sola cuando se edita.
const PROMPT_VERSION = await promptVersion(SYSTEM);
const PREMIUM_PLANS = ["premium", "repremium"];

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type ContentBlock = Anthropic.Beta.BetaContentBlock;

function json(status: number, body: Record<string, unknown>) {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json(405, { error: "Usá POST." });

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const token = req.headers.get("Authorization")?.replace(/^Bearer /, "");
  const { data: auth } = token ? await supabase.auth.getUser(token) : { data: null };
  if (!auth?.user) return json(401, { error: "Iniciá sesión para hablar con Fetita." });
  // En Mixpanel la persona es su id de login, igual que en el frontend.
  const distinctId = auth.user.id;

  const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", auth.user.id).maybeSingle();
  if (!profile) return json(403, { error: "No encontramos tu perfil." });
  const userId: string = profile.id;

  const [{ data: access }, { data: adminRole }] = await Promise.all([
    supabase.from("fetita_access").select("user_id").eq("user_id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").limit(1).maybeSingle(),
  ]);
  if (!access && !adminRole) {
    return json(403, { error: "Fetita está en prueba cerrada y tu cuenta todavía no tiene acceso." });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "El cuerpo tiene que ser JSON." });
  }

  // Conversaciones que la persona ya usó: las archivadas y la actual, si tiene
  // algún mensaje que salió bien. Los turnos fallidos no consumen.
  async function conversationsUsed(): Promise<number | null> {
    const { data, error } = await supabase
      .from("fetita_messages")
      .select("thread_id")
      .eq("user_id", userId)
      .eq("status", "ok");
    if (error) return null;
    return new Set((data ?? []).map((row) => row.thread_id)).size;
  }

  if (body.action === "restart") {
    if (!adminRole) {
      const used = await conversationsUsed();
      if (used === null) return json(500, { error: "No pudimos empezar de nuevo. Probá otra vez." });
      if (used >= MAX_CONVERSATIONS) return json(403, { error: LIMIT_MESSAGE });
    }
    const { error } = await supabase
      .from("fetita_messages")
      .update({ archived_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("archived_at", null);
    return error ? json(500, { error: "No pudimos empezar de nuevo. Probá otra vez." }) : json(200, { ok: true });
  }

  if (body.action === "feedback") {
    const rating = body.rating === "up" || body.rating === "down" ? body.rating : null;
    const comment = typeof body.comment === "string" ? body.comment.trim().slice(0, 1000) : "";
    if (!rating || typeof body.message_id !== "string") return json(400, { error: "Feedback inválido." });
    const { data: closing } = await supabase
      .from("fetita_messages")
      .select("id, thread_id, verdict, prompt_version")
      .eq("id", body.message_id)
      .eq("user_id", userId)
      .eq("role", "assistant")
      .not("verdict", "is", null)
      .maybeSingle();
    if (!closing) return json(404, { error: "No encontramos ese cierre." });
    const { error } = await supabase
      .from("fetita_messages")
      .update({ feedback: rating, feedback_comment: comment || null })
      .eq("id", closing.id);
    if (error) return json(500, { error: "No pudimos guardar tu opinión. Probá otra vez." });
    await track(distinctId, [
      {
        event: "fetita_feedback",
        properties: {
          conversation_id: closing.thread_id,
          prompt_version: closing.prompt_version,
          rating,
          verdict: closing.verdict,
          has_comment: comment.length > 0,
        },
      },
    ]);
    return json(200, { ok: true });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_CHARS) {
    return json(400, { error: `El mensaje tiene que tener entre 1 y ${MAX_MESSAGE_CHARS} caracteres.` });
  }

  const { data: rows, error: rowsError } = await supabase
    .from("fetita_messages")
    .select("role, api_content, status, thread_id, step, created_at")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("seq", { ascending: true });
  if (rowsError) return json(500, { error: "No pudimos leer la conversación. Probá otra vez." });
  const threadRows = rows ?? [];
  if (threadRows.length === 0 && !adminRole) {
    const used = await conversationsUsed();
    if (used === null) return json(500, { error: "No pudimos leer la conversación. Probá otra vez." });
    if (used >= MAX_CONVERSATIONS) return json(403, { error: LIMIT_MESSAGE });
  }
  const threadId: string = threadRows[0]?.thread_id ?? crypto.randomUUID();
  // Los turnos fallidos quedan en la tabla pero no se le reenvían al modelo.
  const okRows = threadRows.filter((row) => row.status === "ok");
  const history: Anthropic.Beta.BetaMessageParam[] = okRows.map((row) => ({
    role: row.role as "user" | "assistant",
    content: JSON.parse(row.api_content),
  }));

  // Dónde está la conversación, para las métricas. El primer mensaje es el
  // saludo del botón "Empezar" y no cuenta: vale 0, el primero que escribe la
  // persona vale 1 y el tope es 8.
  const messageNumber = okRows.filter((row) => row.role === "user").length;
  const lastStep = (okRows.findLast((row) => row.role === "assistant" && row.step)?.step ?? null) as Step | null;
  const currentStep: Step = lastStep ?? "context";
  const lastMessageAt: string | undefined = okRows.at(-1)?.created_at;
  const threadStartedAt: string = threadRows[0]?.created_at ?? new Date().toISOString();
  const common = { conversation_id: threadId, prompt_version: PROMPT_VERSION };

  // El perfil es un dato de la persona: va en su primer mensaje y no en el
  // system, y no puede cerrar su propio bloque.
  const perfil = history.length === 0 && typeof body.perfil === "string" ? body.perfil.trim().slice(0, MAX_PERFIL_CHARS) : "";
  const userContent: Anthropic.Beta.BetaTextBlockParam[] = [
    ...(perfil
      ? [{ type: "text" as const, text: `<perfil>\n${perfil.replace(/<(\s*\/?\s*perfil\b)/gi, "‹$1")}\n</perfil>` }]
      : []),
    { type: "text", text: message },
  ];

  const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY") });
  const events = eventStream();
  const base = { user_id: userId, thread_id: threadId, prompt_version: PROMPT_VERSION };
  const userRow = { ...base, role: "user", content: message, api_content: JSON.stringify(userContent) };
  let partial = "";

  // El turno que falló queda para análisis, con lo que se alcanzó a mostrar.
  async function failTurn(code: string, reason: string, userMessage: string) {
    const failed = { status: "fallido", error: reason.slice(0, 1000) };
    const shown = readMarks(partial).clean;
    const { error } = await supabase.from("fetita_messages").insert([
      { ...userRow, ...failed },
      ...(shown ? [{ ...base, ...failed, role: "assistant", content: shown, api_content: "[]" }] : []),
    ]);
    if (error) console.error("[fetita-chat] guardar turno fallido:", error.message);
    events.send({ type: "error", message: userMessage });
    await track(distinctId, [
      { event: "fetita_error", properties: { ...common, error: code, step: currentStep, message_number: messageNumber } },
    ]);
  }

  const turn = (async () => {
    try {
      await Promise.all([
        supabase.from("fetita_prompts").upsert({ version: PROMPT_VERSION, content: SYSTEM }, {
          onConflict: "version",
          ignoreDuplicates: true,
        }),
        openingEvents().then((opening) => track(distinctId, opening)),
      ]);

      const stream = anthropic.beta.messages.stream(
        {
          model: MODEL,
          max_tokens: 32000,
          system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
          messages: [...history, { role: "user", content: userContent }],
          // Resumido: el razonamiento queda guardado para análisis. La persona no lo ve.
          thinking: { type: "adaptive", display: "summarized" },
          output_config: { effort: EFFORT },
          // El turno siguiente lee de caché toda la conversación anterior.
          cache_control: { type: "ephemeral" },
          ...(SERVER_FALLBACK ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
        },
        { signal: AbortSignal.timeout(TURN_TIMEOUT_MS) },
      );
      // Las marcas de paso y veredicto no se muestran mientras llega el texto.
      let shownChars = 0;
      stream.on("text", (delta: string) => {
        partial += delta;
        const end = visibleLength(partial);
        if (end > shownChars) {
          events.send({ type: "text", delta: partial.slice(shownChars, end) });
          shownChars = end;
        }
      });
      const final = await stream.finalMessage();

      const marks = readMarks(
        final.content
          .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
          .map((b) => b.text)
          .join(""),
      );
      if (final.stop_reason === "refusal" || !marks.clean.trim()) {
        const refused = final.stop_reason === "refusal";
        await failTurn(
          refused ? "refusal" : "sin_texto",
          refused ? "refusal" : `sin texto (${final.stop_reason})`,
          "Fetita no pudo responder ese mensaje. Probá decirlo de otra forma.",
        );
        return;
      }

      // Si el modelo no marcó el paso, se sostiene el anterior.
      const step: Step = marks.step ?? (marks.verdict ? "closing" : currentStep);
      const replay = forReplay(final.content);
      const reasoning = replay
        .map((b) => (b.type === "thinking" ? b.thinking : ""))
        .filter((t) => t.trim())
        .join("\n\n");
      const { error } = await supabase.from("fetita_messages").insert([
        userRow,
        {
          ...base,
          role: "assistant",
          // Lo que se ve, sin las marcas. api_content las conserva: se reenvía tal cual.
          content: marks.clean,
          api_content: JSON.stringify(replay),
          reasoning: reasoning || null,
          step,
          verdict: marks.verdict,
          close_reason: marks.close,
          model: final.model,
          input_tokens: final.usage.input_tokens,
          output_tokens: final.usage.output_tokens,
          cache_read_tokens: final.usage.cache_read_input_tokens ?? 0,
          cache_write_tokens: final.usage.cache_creation_input_tokens ?? 0,
        },
      ]);
      if (error) throw new Error(`guardar: ${error.message}`);
      events.send({ type: "done" });

      const closing: TrackEvent[] = [];
      if (step !== lastStep) {
        closing.push({ event: "fetita_step_reached", properties: { ...common, step, user_messages_count: messageNumber } });
      }
      if (marks.verdict) {
        closing.push({
          event: "fetita_verdict_given",
          properties: {
            ...common,
            verdict: marks.verdict,
            user_messages_count: messageNumber,
            duration_seconds: secondsSince(threadStartedAt),
            // Sin marca de motivo, se asume forzado si se llegó al tope de mensajes.
            forced_close: marks.close ? marks.close !== "completo" : messageNumber >= 8,
          },
        });
      }
      await track(distinctId, closing);
    } catch (error) {
      console.error("[fetita-chat]", error);
      const { code, message: userMessage } = describeError(error);
      await failTurn(code, error instanceof Error ? error.message : String(error), userMessage);
    } finally {
      events.close();
    }
  })();

  // Al empezar el turno: el primer mensaje de una conversación y cada mensaje.
  async function openingEvents(): Promise<TrackEvent[]> {
    const opening: TrackEvent[] = [];
    if (threadRows.length === 0) {
      const [{ count }, { data: subscriptions }] = await Promise.all([
        supabase.from("assessments").select("id", { count: "exact", head: true }).eq("user_id", userId),
        supabase.from("user_subscriptions").select("plan, status, is_comped").eq("user_id", userId),
      ]);
      const entryPoint = typeof body.entry_point === "string" && /^[a-z_]{1,40}$/.test(body.entry_point)
        ? body.entry_point
        : "desconocido";
      opening.push({
        event: "fetita_started",
        properties: {
          ...common,
          assessments_count: count ?? 0,
          has_premium: (subscriptions ?? []).some(
            (s) => PREMIUM_PLANS.includes(s.plan) && (s.status === "active" || s.is_comped),
          ),
          entry_point: entryPoint,
        },
      });
    }
    opening.push({
      event: "fetita_message_sent",
      properties: {
        ...common,
        message_number: messageNumber,
        step: currentStep,
        char_count: message.length,
        seconds_since_last_message: lastMessageAt ? secondsSince(lastMessageAt) : null,
      },
    });
    return opening;
  }

  // Si la persona cierra la pestaña, el turno termina y se guarda igual.
  (globalThis as { EdgeRuntime?: { waitUntil(p: Promise<unknown>): void } }).EdgeRuntime?.waitUntil(turn);

  return new Response(events.readable, {
    headers: { ...corsHeaders, "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache" },
  });
});

/**
 * La respuesta tal como se reenvía en el turno siguiente: los bloques de
 * razonamiento van sin tocar, como pide la API. Si hubo un fallback a mitad de
 * la respuesta, el razonamiento anterior al último bloque fallback lo produjo
 * el modelo que declinó y no se reenvía; el bloque fallback es sólo una marca.
 */
function forReplay(content: ContentBlock[]): ContentBlock[] {
  const lastFallback = content.map((b) => b.type).lastIndexOf("fallback");
  return content.filter(
    (block, i) =>
      block.type !== "fallback" &&
      !(i < lastFallback && (block.type === "thinking" || block.type === "redacted_thinking")),
  );
}

async function promptVersion(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(digest).slice(0, 6), (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Un código estable para las métricas y el mensaje para la persona. */
function describeError(error: unknown): { code: string; message: string } {
  if (error instanceof Anthropic.RateLimitError) {
    return { code: "rate_limit", message: "La API de Claude está saturada. Probá en un minuto." };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return {
      code: "api_bad_request",
      message: "La conversación quedó en un estado que la API no acepta. Tocá “Empezar de nuevo”.",
    };
  }
  if (error instanceof Anthropic.APIUserAbortError || error instanceof Anthropic.APIConnectionTimeoutError) {
    return { code: "timeout", message: "La respuesta tardó demasiado. Probá con un mensaje más acotado." };
  }
  if (error instanceof Anthropic.APIError) {
    return { code: "api_error", message: "La API de Claude no respondió bien. Probá de nuevo en un rato." };
  }
  return { code: "internal", message: "Algo falló de nuestro lado. Probá de nuevo." };
}

/** Server-Sent Events hacia el navegador. Si la persona se va, se deja de escribir sin cortar el turno. */
function eventStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array>;
  let open = true;
  const readable = new ReadableStream<Uint8Array>({
    start: (c) => {
      controller = c;
    },
    cancel: () => {
      open = false;
    },
  });
  const write = (chunk: string) => {
    if (!open) return;
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      open = false;
    }
  };
  // Mientras el modelo piensa no llega texto: el ping mantiene viva la conexión.
  const ping = setInterval(() => write(": ping\n\n"), 15_000);
  return {
    readable,
    send: (event: Record<string, unknown>) => write(`data: ${JSON.stringify(event)}\n\n`),
    close: () => {
      clearInterval(ping);
      if (!open) return;
      open = false;
      try {
        controller.close();
      } catch {
        // Ya estaba cerrado.
      }
    },
  };
}
