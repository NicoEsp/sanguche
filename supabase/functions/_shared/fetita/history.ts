/**
 * El historial que se le reenvía a la API en cada turno.
 *
 * La regla es append-only: cada turno guarda los mensajes exactos que se
 * mandaron y recibieron (incluidos los bloques de razonamiento con su firma) y
 * el turno siguiente los reenvía byte a byte. Editar un turno anterior
 * invalida los bloques de razonamiento que vienen después y rompe la caché.
 * Por eso el material pegado no se guarda en crudo: se analiza en una llamada
 * aparte y a la conversación sólo entra el análisis.
 */
import type Anthropic from "npm:@anthropic-ai/sdk@0.126.0";

type MessageParam = Anthropic.Beta.BetaMessageParam;
type ContentBlock = Anthropic.Beta.BetaContentBlock;
type ContentBlockParam = Anthropic.Beta.BetaContentBlockParam;

const REASONING_TYPES = new Set(["thinking", "redacted_thinking"]);

/**
 * Prepara el contenido de una respuesta para reenviarlo en el turno siguiente.
 *
 * Si hubo un fallback a mitad de la respuesta, la API pide omitir los bloques
 * de razonamiento y de tool_use que quedaron antes del último bloque
 * `fallback` (los produjo el modelo que declinó). El bloque `fallback` en sí
 * es una marca de auditoría y se descarta.
 */
export function contentForReplay(content: ContentBlock[]): ContentBlockParam[] {
  const lastFallback = content.map((b) => b.type).lastIndexOf("fallback");
  const kept = content.filter((block, index) => {
    if (block.type === "fallback") return false;
    if (index < lastFallback && (REASONING_TYPES.has(block.type) || block.type === "tool_use")) {
      return false;
    }
    return true;
  });
  return kept as unknown as ContentBlockParam[];
}

/** El texto visible de una respuesta: sólo los bloques de texto, en orden. */
export function visibleText(content: ContentBlock[]): string {
  return content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
}

/**
 * Saca todos los bloques de razonamiento de un historial.
 *
 * Es la recuperación de una sola vez que documenta la API para cuando el
 * prefijo cambió (acá: una versión nueva del system prompt). Los bloques de
 * texto y de herramientas quedan. Un mensaje del asistente que se queda sin
 * contenido se elimina.
 */
export function stripReasoning(messages: MessageParam[]): MessageParam[] {
  const out: MessageParam[] = [];
  for (const message of messages) {
    if (message.role !== "assistant" || typeof message.content === "string") {
      out.push(message);
      continue;
    }
    const content = message.content.filter((b) => !REASONING_TYPES.has(b.type));
    if (content.length > 0) out.push({ ...message, content });
  }
  return out;
}

export function hasReasoning(messages: MessageParam[]): boolean {
  return messages.some(
    (m) => m.role === "assistant" && typeof m.content !== "string" && m.content.some((b) => REASONING_TYPES.has(b.type)),
  );
}

/**
 * Los mensajes de un turno se guardan como JSON en texto (columna text, no
 * jsonb) para que vuelvan byte a byte: jsonb reordena las claves y el input
 * de una herramienta reenviado con otro orden rompe la caché y el
 * razonamiento guardado.
 */
export function serializeMessages(messages: MessageParam[]): string {
  return JSON.stringify(messages);
}

export function parseMessages(raw: unknown): MessageParam[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MessageParam[]) : [];
  } catch {
    return [];
  }
}

/** Une los mensajes guardados por fila, en el orden de la conversación. */
export function flattenHistory(rows: Array<{ api_messages: unknown }>): MessageParam[] {
  const messages: MessageParam[] = [];
  for (const row of rows) messages.push(...parseMessages(row.api_messages));
  return messages;
}
