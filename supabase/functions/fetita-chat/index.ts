/**
 * fetita-chat: la conversación con Fetita, el agente de ProductPrepa.
 *
 * POST { message, perfil? } responde por Server-Sent Events:
 *   { type: "text", delta } mientras llega la respuesta,
 *   { type: "done" } cuando quedó guardada,
 *   { type: "error", message } si el turno falló (no se guarda nada).
 * POST { action: "restart" } archiva el hilo actual y responde JSON.
 *
 * Cada persona tiene un hilo. El mensaje y la respuesta se guardan juntos al
 * final del turno, así un error no deja la conversación a medias. El perfil
 * (nombre e historial de evaluaciones) entra una sola vez, en el primer
 * mensaje del hilo.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";
import Anthropic from "npm:@anthropic-ai/sdk@0.126.0";
import { SYSTEM_PROMPT } from "./prompt.ts";

const MODEL = Deno.env.get("FETITA_MODEL") || "claude-opus-5";
const EFFORT = (Deno.env.get("FETITA_EFFORT") || "medium") as "low" | "medium" | "high" | "xhigh" | "max";
// Si un clasificador de seguridad declina el pedido, la API lo reintenta con
// otro modelo dentro de la misma llamada. Sólo en los modelos que lo soportan.
const SERVER_FALLBACK = /^claude-(opus-5|opus-5-5|fable-5-1)\b/.test(MODEL);
const MAX_MESSAGE_CHARS = 8000;
const MAX_PERFIL_CHARS = 40000;
// Supabase corta la función a los 150 s en el plan gratuito.
const TURN_TIMEOUT_MS = 140_000;

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

  let body: { action?: unknown; message?: unknown; perfil?: unknown };
  try {
    body = await req.json();
  } catch {
    return json(400, { error: "El cuerpo tiene que ser JSON." });
  }

  if (body.action === "restart") {
    const { error } = await supabase
      .from("fetita_messages")
      .update({ archived_at: new Date().toISOString() })
      .eq("user_id", userId)
      .is("archived_at", null);
    return error ? json(500, { error: "No pudimos empezar de nuevo. Probá otra vez." }) : json(200, { ok: true });
  }

  const message = typeof body.message === "string" ? body.message.trim() : "";
  if (!message || message.length > MAX_MESSAGE_CHARS) {
    return json(400, { error: `El mensaje tiene que tener entre 1 y ${MAX_MESSAGE_CHARS} caracteres.` });
  }

  const { data: rows, error: rowsError } = await supabase
    .from("fetita_messages")
    .select("role, api_content")
    .eq("user_id", userId)
    .is("archived_at", null)
    .order("seq", { ascending: true });
  if (rowsError) return json(500, { error: "No pudimos leer la conversación. Probá otra vez." });
  const history: Anthropic.Beta.BetaMessageParam[] = (rows ?? []).map((row) => ({
    role: row.role as "user" | "assistant",
    content: JSON.parse(row.api_content),
  }));

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

  const turn = (async () => {
    try {
      const stream = anthropic.beta.messages.stream(
        {
          model: MODEL,
          max_tokens: 32000,
          system: [{ type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } }],
          messages: [...history, { role: "user", content: userContent }],
          thinking: { type: "adaptive" },
          output_config: { effort: EFFORT },
          // El turno siguiente lee de caché toda la conversación anterior.
          cache_control: { type: "ephemeral" },
          ...(SERVER_FALLBACK ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
        },
        { signal: AbortSignal.timeout(TURN_TIMEOUT_MS) },
      );
      stream.on("text", (delta: string) => events.send({ type: "text", delta }));
      const final = await stream.finalMessage();

      const text = final.content
        .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
        .map((b) => b.text)
        .join("");
      if (final.stop_reason === "refusal" || !text.trim()) {
        events.send({ type: "error", message: "Fetita no pudo responder ese mensaje. Probá decirlo de otra forma." });
        return;
      }

      const { error } = await supabase.from("fetita_messages").insert([
        { user_id: userId, role: "user", content: message, api_content: JSON.stringify(userContent) },
        {
          user_id: userId,
          role: "assistant",
          content: text,
          api_content: JSON.stringify(forReplay(final.content)),
          model: final.model,
          input_tokens: final.usage.input_tokens,
          output_tokens: final.usage.output_tokens,
          cache_read_tokens: final.usage.cache_read_input_tokens ?? 0,
          cache_write_tokens: final.usage.cache_creation_input_tokens ?? 0,
        },
      ]);
      if (error) throw new Error(`guardar: ${error.message}`);
      events.send({ type: "done" });
    } catch (error) {
      console.error("[fetita-chat]", error);
      events.send({ type: "error", message: describeError(error) });
    } finally {
      events.close();
    }
  })();
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

function describeError(error: unknown): string {
  if (error instanceof Anthropic.RateLimitError) return "La API de Claude está saturada. Probá en un minuto.";
  if (error instanceof Anthropic.BadRequestError) {
    return "La conversación quedó en un estado que la API no acepta. Tocá “Empezar de nuevo”.";
  }
  if (error instanceof Anthropic.APIUserAbortError || error instanceof Anthropic.APIConnectionTimeoutError) {
    return "La respuesta tardó demasiado. Probá con un mensaje más acotado.";
  }
  return "Algo falló de nuestro lado. Probá de nuevo.";
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
