/**
 * Configuración de Fetita que vive en variables de entorno de las funciones.
 *
 * El modelo principal y el auxiliar se pueden cambiar sin deploy de código
 * (`supabase secrets set FETITA_MODEL=...`). Presupuesto, límites y el
 * interruptor general viven en la tabla fetita_settings y se editan desde el
 * admin.
 */
import Anthropic from "npm:@anthropic-ai/sdk@0.126.0";

export const DEFAULT_MODEL = "claude-opus-5";
export const DEFAULT_AUX_MODEL = "claude-sonnet-5";

const EFFORTS = ["low", "medium", "high", "xhigh", "max"] as const;
export type Effort = (typeof EFFORTS)[number];

export interface FetitaConfig {
  /** Modelo que conversa. */
  model: string;
  /** Esfuerzo de razonamiento del chat. Fijo por conversación: cambiarlo a mitad invalida la caché. */
  effort: Effort;
  /** Modelo para leer material pegado y para el juez de alucinaciones. */
  auxModel: string;
  /** Tope de tokens por ronda. Razonamiento y respuesta comparten este tope, así que crece con el esfuerzo. */
  maxTokens: number;
}

const MAX_TOKENS_BY_EFFORT: Record<Effort, number> = {
  low: 16_000,
  medium: 16_000,
  high: 32_000,
  xhigh: 64_000,
  max: 64_000,
};

export function readConfig(): FetitaConfig {
  const requested = (Deno.env.get("FETITA_EFFORT") ?? "medium") as Effort;
  const effort = EFFORTS.includes(requested) ? requested : "medium";
  return {
    model: Deno.env.get("FETITA_MODEL") || DEFAULT_MODEL,
    effort,
    auxModel: Deno.env.get("FETITA_AUX_MODEL") || DEFAULT_AUX_MODEL,
    maxTokens: MAX_TOKENS_BY_EFFORT[effort],
  };
}

export function createAnthropic(): Anthropic {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no está configurada");
  // Dos reintentos (el default) para 429/5xx de la API. El timeout lo pone
  // cada llamada según cuánto puede esperar.
  return new Anthropic({ apiKey });
}

/**
 * Los modelos a los que se les puede pedir fallback del lado del servidor
 * cuando un clasificador de seguridad declina el pedido. Con otros modelos el
 * parámetro no aplica y se omite.
 */
export function supportsServerFallback(model: string): boolean {
  return /^claude-(opus-5|opus-5-5|fable-5-1)(\b|-|$)/.test(model);
}

/** Traduce un error de la API a un código estable para la UI y el log. */
export function classifyApiError(error: unknown): { code: string; message: string } {
  if (error instanceof Anthropic.RateLimitError) {
    return { code: "api_rate_limit", message: "La API de Claude está saturada. Probá de nuevo en un minuto." };
  }
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return { code: "api_auth", message: "Fetita no está bien configurada. Avisale a Nico." };
  }
  if (error instanceof Anthropic.BadRequestError) {
    return { code: "api_bad_request", message: "La conversación quedó en un estado que la API no acepta. Probá abrir una decisión nueva." };
  }
  if (error instanceof Anthropic.APIConnectionTimeoutError) {
    return { code: "api_timeout", message: "La respuesta tardó demasiado. Probá de nuevo." };
  }
  if (error instanceof Anthropic.APIUserAbortError) {
    return { code: "turn_timeout", message: "El turno se cortó por tiempo. Probá con un mensaje más acotado." };
  }
  if (error instanceof Anthropic.APIError) {
    return { code: "api_error", message: "La API de Claude no respondió bien. Probá de nuevo en un rato." };
  }
  return { code: "internal_error", message: "Algo falló de nuestro lado. Probá de nuevo." };
}
