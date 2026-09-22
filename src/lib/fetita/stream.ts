import { supabase } from "@/integrations/supabase/client";
import type { FetitaStreamEvent } from "./types";

/**
 * Manda un mensaje a Fetita y recorre la respuesta a medida que llega.
 *
 * Es un fetch directo y no supabase.functions.invoke porque la respuesta es un
 * stream de Server-Sent Events y hay que poder cortarlo (botón Detener, o la
 * persona que cambia de conversación). Cortar el stream no corta el turno del
 * lado del servidor: la respuesta se guarda igual y aparece al recargar.
 */

export class FetitaRequestError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "FetitaRequestError";
  }
}

export interface SendFetitaMessageInput {
  conversationId: string | null;
  message: string;
  material?: string | null;
  perfil?: string | null;
  signal?: AbortSignal;
  onEvent: (event: FetitaStreamEvent) => void;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetita-chat`;

export async function sendFetitaMessage({
  conversationId,
  message,
  material,
  perfil,
  signal,
  onEvent,
}: SendFetitaMessageInput): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new FetitaRequestError("no_autenticado", "Tu sesión venció. Volvé a iniciar sesión.", 401);

  const response = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({
      conversation_id: conversationId,
      message,
      material: material || null,
      perfil: conversationId ? null : perfil || null,
    }),
    signal,
  });

  const contentType = response.headers.get("content-type") ?? "";
  if (!response.ok || !contentType.includes("text/event-stream") || !response.body) {
    let code = "error_interno";
    let text = "Fetita no pudo responder. Probá de nuevo.";
    try {
      const payload = await response.json();
      if (payload?.error) code = payload.error;
      if (payload?.message) text = payload.message;
    } catch {
      // La respuesta no era JSON: queda el mensaje genérico.
    }
    throw new FetitaRequestError(code, text, response.status);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flush = (chunk: string) => {
    // Un evento SSE termina en una línea vacía. Sólo interesan las líneas
    // `data:`; los comentarios (`: ping`) mantienen viva la conexión.
    const data = chunk
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trimStart())
      .join("\n");
    if (!data) return;
    try {
      onEvent(JSON.parse(data) as FetitaStreamEvent);
    } catch {
      // Un evento mal formado no corta la conversación.
    }
  };

  for (;;) {
    const { value, done } = await reader.read();
    if (done) break;
    // El estándar SSE admite CRLF y CR además de LF.
    buffer = (buffer + decoder.decode(value, { stream: true })).replace(/\r\n?/g, "\n");
    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      flush(buffer.slice(0, boundary));
      buffer = buffer.slice(boundary + 2);
      boundary = buffer.indexOf("\n\n");
    }
  }
  buffer = (buffer + decoder.decode()).replace(/\r\n?/g, "\n");
  for (const chunk of buffer.split("\n\n")) {
    if (chunk.trim()) flush(chunk);
  }
}
