/**
 * Costo en dólares de cada request a la API, para el tablero de consumo.
 *
 * Precios por millón de tokens de la API de Anthropic (septiembre 2026).
 * La escritura en caché de 5 minutos cuesta 1.25 veces la entrada; la lectura
 * tiene precio propio por modelo. Si cambian los precios, se actualiza esta
 * tabla: las filas ya guardadas conservan el costo con el que se calcularon y
 * los tokens crudos quedan en la tabla para recalcular si hace falta.
 */

interface ModelPrice {
  input: number;
  output: number;
  cacheWrite: number;
  cacheRead: number;
}

const PRICES: Record<string, ModelPrice> = {
  "claude-opus-5": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
  "claude-opus-5-5": { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  "claude-opus-4-8": { input: 5, output: 25, cacheWrite: 6.25, cacheRead: 0.5 },
  "claude-fable-5-1": { input: 10, output: 50, cacheWrite: 12.5, cacheRead: 0.25 },
  "claude-sonnet-5": { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  "claude-haiku-4-5": { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
};

// Un modelo que no está en la tabla se cobra como Opus 5 y queda marcado, así
// el tablero no muestra cero por un id nuevo.
const FALLBACK_PRICE = PRICES["claude-opus-5"];

export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
  /**
   * Con fallback del lado del servidor, el uso de primer nivel cubre sólo el
   * intento que produjo la respuesta. Cada intento viene en una entrada de
   * iterations con su propio modelo. Un intento que declinó antes de generar
   * algo no se cobra; uno que declinó a mitad sí.
   */
  iterations?: Array<IterationUsage> | null;
}

interface IterationUsage {
  type: string;
  model?: string | null;
  input_tokens: number;
  output_tokens: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

// Las entradas de iterations que son muestreos del modelo y se cobran.
const BILLED_ITERATIONS = new Set(["message", "fallback_message"]);

export interface UsageTotals {
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  costUsd: number;
  priced: boolean;
}

/**
 * Tokens y costo de una respuesta. Si trae iterations, suma cada intento al
 * precio de su modelo; si no, usa el uso de primer nivel al precio de `model`.
 */
export function usageTotals(model: string, usage: TokenUsage): UsageTotals {
  const iterations = usage.iterations ?? [];
  const servedByFallback = iterations.some((i) => i.type === "fallback_message");
  const billed = iterations.filter(
    (i) => BILLED_ITERATIONS.has(i.type) && !(servedByFallback && i.type === "message" && !i.output_tokens),
  );
  const parts = billed.length > 0 ? billed.map((i) => ({ model: i.model || model, usage: i })) : [{ model, usage }];
  const totals: UsageTotals = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    costUsd: 0,
    priced: true,
  };
  for (const part of parts) {
    const { costUsd, priced } = costOf(part.model, part.usage);
    totals.inputTokens += part.usage.input_tokens ?? 0;
    totals.outputTokens += part.usage.output_tokens ?? 0;
    totals.cacheReadTokens += part.usage.cache_read_input_tokens ?? 0;
    totals.cacheWriteTokens += part.usage.cache_creation_input_tokens ?? 0;
    totals.costUsd += costUsd;
    totals.priced &&= priced;
  }
  totals.costUsd = Math.round(totals.costUsd * 1_000_000) / 1_000_000;
  return totals;
}

export interface RunCost {
  costUsd: number;
  priced: boolean;
}

export function priceFor(model: string): { price: ModelPrice; known: boolean } {
  // La API puede devolver el id con sufijo de fecha o de contexto: se compara
  // por prefijo contra la tabla, del id más largo al más corto.
  const exact = PRICES[model];
  if (exact) return { price: exact, known: true };
  const match = Object.keys(PRICES)
    .sort((a, b) => b.length - a.length)
    .find((id) => model.startsWith(id));
  if (match) return { price: PRICES[match], known: true };
  return { price: FALLBACK_PRICE, known: false };
}

export function costOf(model: string, usage: Omit<TokenUsage, "iterations">): RunCost {
  const { price, known } = priceFor(model);
  const perToken = (perMillion: number) => perMillion / 1_000_000;
  const cost =
    (usage.input_tokens ?? 0) * perToken(price.input) +
    (usage.output_tokens ?? 0) * perToken(price.output) +
    (usage.cache_creation_input_tokens ?? 0) * perToken(price.cacheWrite) +
    (usage.cache_read_input_tokens ?? 0) * perToken(price.cacheRead);
  // Seis decimales: una request corta cuesta fracciones de centavo.
  return { costUsd: Math.round(cost * 1_000_000) / 1_000_000, priced: known };
}
