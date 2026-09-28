/**
 * Métricas de Fetita en Mixpanel, enviadas desde el servidor: no se pierden por
 * un bloqueador ni porque la persona cierre la pestaña. Nunca llevan el
 * contenido de los mensajes ni el email: sólo ids, conteos, paso y veredicto.
 * El texto completo queda en fetita_messages con el mismo conversation_id.
 *
 * El abandono (30 minutos sin actividad y sin veredicto) no sale de acá: lo
 * reporta un cron de la base, ver fetita_collect_abandoned().
 */

// El token público del proyecto, el mismo que usa el frontend en src/lib/mixpanel.ts.
const TOKEN = Deno.env.get("MIXPANEL_TOKEN") ?? "35fe7a2706398ebc90ae3f1012d0a558";
const API_URL = Deno.env.get("MIXPANEL_API_URL") ?? "https://api.mixpanel.com";

export type Step = "context" | "challenge" | "closing";

export interface TrackEvent {
  event: string;
  properties: Record<string, unknown>;
}

/**
 * Manda eventos a Mixpanel a nombre de la persona. distinctId es su id de
 * login, el mismo con el que el frontend la identifica. Si Mixpanel falla, se
 * loguea y sigue: una métrica perdida no puede cortar la conversación.
 */
export async function track(distinctId: string, events: TrackEvent[]): Promise<void> {
  if (events.length === 0) return;
  const payload = events.map(({ event, properties }) => ({
    event,
    properties: {
      token: TOKEN,
      distinct_id: distinctId,
      $user_id: distinctId,
      user_id: distinctId,
      $insert_id: crypto.randomUUID(),
      ...properties,
    },
  }));
  try {
    // ip=0: la ubicación saldría del servidor de Supabase, no de la persona.
    const response = await fetch(`${API_URL}/track?ip=0`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/plain" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) console.error("[fetita-chat] mixpanel:", response.status, await response.text());
  } catch (error) {
    console.error("[fetita-chat] mixpanel:", error);
  }
}

// [[step:challenge]], [[verdict:avanzar]], [[close:tope]]: ver MARKS en prompt.ts.
const MARK = /\[\[\s*(step|verdict|close)\s*:\s*([a-z_]+)\s*\]\]/gi;
const STEPS = ["context", "challenge", "closing"];
const VERDICTS = ["avanzar", "falta_evidencia", "frenar"];
const CLOSES = ["completo", "tope", "pedido"];

/** Lee las marcas de una respuesta y devuelve el texto sin ellas. */
export function readMarks(text: string) {
  const found: Record<string, string> = {};
  for (const [, key, value] of text.matchAll(MARK)) found[key.toLowerCase()] = value.toLowerCase();
  const pick = (value: string | undefined, allowed: string[]) => (value && allowed.includes(value) ? value : null);
  return {
    clean: text.replace(MARK, "").trimEnd(),
    step: pick(found.step, STEPS) as Step | null,
    verdict: pick(found.verdict, VERDICTS),
    close: pick(found.close, CLOSES),
  };
}

/**
 * Cuánto del texto que va llegando se puede mostrar: las marcas van al final,
 * así que se retiene desde el primer "[[" (o un "[" suelto al final, que puede
 * ser el comienzo de una).
 */
export function visibleLength(text: string): number {
  const mark = text.indexOf("[[");
  if (mark !== -1) return mark;
  return text.endsWith("[") ? text.length - 1 : text.length;
}

export function secondsSince(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
}
