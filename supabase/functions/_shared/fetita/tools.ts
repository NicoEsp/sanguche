/**
 * Las dos herramientas que Fetita usa para escribir estado: el título y el
 * paso de la decisión, y el memo.
 *
 * Los esquemas van con `strict: true` para que el modelo respete la forma, y
 * con `eager_input_streaming: true` porque el request es streaming: el memo es
 * largo y así no hay un silencio de varios segundos mientras se genera. Con
 * eager streaming la API ya no valida el input, así que se valida acá con zod
 * antes de ejecutar nada, y un input inválido vuelve al modelo como error.
 */
import type Anthropic from "npm:@anthropic-ai/sdk@0.126.0";
import { z } from "npm:zod@3.25.76";

export const PROTOCOL_STEPS = 7;

export const VERDICTS = ["listo", "falta", "frenar"] as const;
export type Verdict = (typeof VERDICTS)[number];

const EVIDENCE_TYPES = ["directa", "indirecta", "supuesto"] as const;
const WEIGHTS = ["alto", "medio", "bajo"] as const;

// Topes generosos: sirven para cortar un input roto, no para editar al modelo.
const short = z.string().trim().min(1).max(300);
const text = z.string().trim().min(1).max(3000);

export const DecisionInput = z.object({
  titulo: short.max(120),
  paso_protocolo: z.number().int().min(1).max(PROTOCOL_STEPS),
});
export type DecisionInput = z.infer<typeof DecisionInput>;

export const MemoContent = z.object({
  decision: text,
  problema_y_segmento: text,
  evidencia: z
    .array(
      z.object({
        afirmacion: text,
        tipo: z.enum(EVIDENCE_TYPES),
        procedencia: text,
        peso: z.enum(WEIGHTS),
      }),
    )
    .max(30),
  supuestos_abiertos: z.array(text).max(30),
  sesgos: z
    .array(
      z.object({
        sesgo: text,
        por_que_importa: text,
      }),
    )
    .max(20),
  que_se_deja_de_hacer: z.object({
    que: text,
    quien_lo_acepto: text,
  }),
  que_la_refutaria: text,
  test_mas_chico: z.object({
    que: text,
    plazo: text,
    resultado_esperado: text,
  }),
  criterio_de_fin: text,
  veredicto: z.enum(VERDICTS),
  motivo_veredicto: text,
  huecos: z
    .array(
      z.object({
        hueco: text,
        como_cerrarlo: text,
      }),
    )
    .max(20),
  cambios_vs_anterior: z.string().trim().max(3000),
});
export type MemoContent = z.infer<typeof MemoContent>;

const stringSchema = { type: "string" };

export const FETITA_TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "actualizar_decision",
    description:
      "Registra el título corto de la decisión y el paso del protocolo (1 a 7) en el que está la conversación. " +
      "Usala cuando la decisión quede formulada en una frase y cada vez que la conversación cambie de paso. " +
      "Devuelve una confirmación. La persona no ve esta herramienta.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        titulo: {
          type: "string",
          description: "La decisión en una frase corta, por ejemplo: Agregar login con Google al onboarding.",
        },
        paso_protocolo: {
          type: "integer",
          enum: [1, 2, 3, 4, 5, 6, 7],
          description:
            "1 decisión, 2 problema y segmento, 3 evidencia, 4 qué la refutaría, 5 qué se deja de hacer, 6 test más chico, 7 criterio de fin.",
        },
      },
      required: ["titulo", "paso_protocolo"],
      additionalProperties: false,
    },
  },
  {
    name: "guardar_memo",
    description:
      "Guarda el memo completo de la decisión. Usala al terminar el protocolo o cuando la persona pida el memo, " +
      "y de nuevo con la versión completa si algo cambia. Todo sale de lo que dijo la persona o del material analizado; " +
      "lo que no tenga respuesta va como 'Sin definir' y se suma a huecos. Devuelve el número de versión guardado.",
    strict: true,
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        decision: { ...stringSchema, description: "La decisión en una frase." },
        problema_y_segmento: { ...stringSchema, description: "Qué problema, para qué segmento concreto y cómo se manifiesta hoy." },
        evidencia: {
          type: "array",
          description: "Cada afirmación que sostiene o contradice la decisión.",
          items: {
            type: "object",
            properties: {
              afirmacion: stringSchema,
              tipo: { type: "string", enum: [...EVIDENCE_TYPES] },
              procedencia: { ...stringSchema, description: "De dónde salió: quién, cuántos, cómo, cuándo. Citando a la persona o al material." },
              peso: { type: "string", enum: [...WEIGHTS] },
            },
            required: ["afirmacion", "tipo", "procedencia", "peso"],
            additionalProperties: false,
          },
        },
        supuestos_abiertos: { type: "array", items: stringSchema },
        sesgos: {
          type: "array",
          items: {
            type: "object",
            properties: { sesgo: stringSchema, por_que_importa: stringSchema },
            required: ["sesgo", "por_que_importa"],
            additionalProperties: false,
          },
        },
        que_se_deja_de_hacer: {
          type: "object",
          properties: { que: stringSchema, quien_lo_acepto: stringSchema },
          required: ["que", "quien_lo_acepto"],
          additionalProperties: false,
        },
        que_la_refutaria: stringSchema,
        test_mas_chico: {
          type: "object",
          properties: { que: stringSchema, plazo: stringSchema, resultado_esperado: stringSchema },
          required: ["que", "plazo", "resultado_esperado"],
          additionalProperties: false,
        },
        criterio_de_fin: stringSchema,
        veredicto: { type: "string", enum: [...VERDICTS] },
        motivo_veredicto: { ...stringSchema, description: "El motivo del veredicto en dos líneas." },
        huecos: {
          type: "array",
          description: "En orden de importancia. Vacío solo si el veredicto es listo.",
          items: {
            type: "object",
            properties: { hueco: stringSchema, como_cerrarlo: stringSchema },
            required: ["hueco", "como_cerrarlo"],
            additionalProperties: false,
          },
        },
        cambios_vs_anterior: {
          ...stringSchema,
          description: "Qué cambió respecto del memo anterior. Vacío si es el primero.",
        },
      },
      required: [
        "decision",
        "problema_y_segmento",
        "evidencia",
        "supuestos_abiertos",
        "sesgos",
        "que_se_deja_de_hacer",
        "que_la_refutaria",
        "test_mas_chico",
        "criterio_de_fin",
        "veredicto",
        "motivo_veredicto",
        "huecos",
        "cambios_vs_anterior",
      ],
      additionalProperties: false,
    },
  },
];

export type ToolName = "actualizar_decision" | "guardar_memo";

/** Resume los errores de zod en una línea que el modelo pueda usar para corregir. */
export function describeZodError(error: z.ZodError): string {
  return error.issues
    .slice(0, 6)
    .map((issue) => `${issue.path.join(".") || "(raíz)"}: ${issue.message}`)
    .join("; ");
}
