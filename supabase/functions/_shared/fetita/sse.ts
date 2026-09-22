/**
 * Streaming de eventos al navegador con Server-Sent Events.
 *
 * Cada evento es una línea `data:` con un JSON. Un comentario cada 15 s
 * mantiene viva la conexión mientras el modelo piensa en silencio. Si el
 * navegador se va (cerró la pestaña), los envíos fallan sin romper el turno:
 * la función termina igual y guarda la respuesta, así la persona la ve al
 * volver.
 */

export type FetitaEvent =
  | { type: "start"; conversation_id: string; user_message_id: string }
  | { type: "status"; text: string }
  | { type: "material"; summary: string }
  | { type: "text"; delta: string }
  | { type: "decision"; title: string; protocol_step: number }
  | { type: "memo"; memo: { id: string; version: number; verdict: string; content: unknown; created_at: string } }
  | { type: "done"; assistant_message_id: string | null; status: string }
  | { type: "error"; code: string; message: string };

const HEARTBEAT_MS = 15_000;

export function createEventStream() {
  const encoder = new TextEncoder();
  let controller: ReadableStreamDefaultController<Uint8Array> | null = null;
  let closed = false;
  let heartbeat: ReturnType<typeof setInterval> | undefined;

  const write = (chunk: string) => {
    if (closed || !controller) return;
    try {
      controller.enqueue(encoder.encode(chunk));
    } catch {
      // El cliente se desconectó: se sigue sin stream.
      closed = true;
    }
  };

  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
      heartbeat = setInterval(() => write(": ping\n\n"), HEARTBEAT_MS);
    },
    cancel() {
      closed = true;
      clearInterval(heartbeat);
    },
  });

  return {
    stream,
    send(event: FetitaEvent) {
      write(`data: ${JSON.stringify(event)}\n\n`);
    },
    close() {
      clearInterval(heartbeat);
      if (closed || !controller) return;
      closed = true;
      try {
        controller.close();
      } catch {
        // Ya estaba cerrado.
      }
    },
  };
}
