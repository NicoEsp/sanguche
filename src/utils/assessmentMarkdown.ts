import {
  AnyAssessmentValues,
  AnyDomainKey,
  AssessmentResult,
  AssessmentTypeKey,
  getAssessmentTypeDef,
  getContextValueLabel,
  getDomainStatusLabel,
  getDomainsForType,
  getNivelDisplay
} from "@/utils/scoring";
import { evalUrl, homeUrl } from "@/constants/shareLinks";

/**
 * Serializa el resultado de la evaluación a Markdown, para que la persona se lo
 * lleve al LLM que ya usa.
 *
 * Es texto y no la imagen del radar a propósito: un PNG obliga al modelo a
 * hacer OCR de un gráfico y a adivinar los números. La tabla de puntajes, en
 * cambio, entra tal cual. La imagen sirve para compartir, esto para pensar.
 */

/**
 * Las evaluaciones guardadas antes de que existieran los perfiles no tienen
 * tipo. No alcanza con caer en "experimentado" y seguir: el documento diría que
 * la persona tomó "Ya trabajo en producto", que es una evaluación que nunca
 * existió cuando ella respondió. Legacy es una entrada más de cada tabla.
 */
type MarkdownTypeKey = AssessmentTypeKey | "legacy";

const TITLES: Record<MarkdownTypeKey, string> = {
  experimentado: "Mi evaluación de competencias en Producto",
  sin_experiencia: "Mi mapa de afinidad con Producto",
  builder: "Mi evaluación como Product Builder",
  lider: "Diagnóstico de mi equipo de Producto",
  legacy: "Mi evaluación de competencias en Producto"
};

/** Qué evaluación se tomó, para la línea del resumen. */
const TAKEN_LABELS: Partial<Record<MarkdownTypeKey, string>> = {
  legacy: "Evaluación de competencias en Producto (formato anterior, sin perfil)"
};

/** Cómo leer la escala 1–5 según qué evaluación se tomó. */
const SCALE_NOTES: Record<MarkdownTypeKey, string> = {
  experimentado:
    "Escala 1 a 5 por dominio, donde 1 es que todavía no lo trabajé y 5 que lo tengo consolidado y se lo puedo enseñar a otro.",
  sin_experiencia:
    "Escala 1 a 5 por dominio, donde 1 es que nunca me crucé con el tema y 5 que es de lo que más me atrae explorar. Mide afinidad y conocimiento teórico, no experiencia laboral.",
  builder:
    "Escala 1 a 5 por dominio, donde 1 es que voy a pura intuición y 5 que tengo un método explícito y repetible.",
  lider:
    "Escala 1 a 5 por dominio, referida a mi equipo, donde 1 es que no existe el proceso y 5 que está consolidado y es autónomo.",
  legacy:
    "Escala 1 a 5 por dominio, donde 1 es que todavía no lo trabajé y 5 que lo tengo consolidado. Es una evaluación general de competencias de Producto, sin perfil declarado."
};

/**
 * El único listado que sobrevive a la tabla.
 *
 * Las fortalezas y las áreas intermedias también se listaban abajo, pero
 * repetían dominio y puntaje sin agregar nada que la tabla no dijera ya. Las
 * brechas sí agregan algo —la prioridad— y son lo que se le pide resolver al
 * modelo, así que quedan.
 */
const GAP_TITLES: Record<MarkdownTypeKey, string> = {
  experimentado: "Mis brechas",
  sin_experiencia: "Mis brechas",
  builder: "Mis brechas",
  // La evaluación de líder mide al equipo, no a quien la responde.
  lider: "Las brechas del equipo",
  legacy: "Mis brechas"
};

/** Lo que le pedimos al modelo, ajustado a lo que cada perfil necesita. */
const SENIORITY_ASKS = [
  "Ayudame a entender qué me separa concretamente del siguiente nivel de seniority.",
  "Armá un plan de 30 días para la primera brecha de prioridad Alta, con entregables concretos y no sólo lecturas.",
  "Preguntame lo que te falte de mi contexto real (empresa, producto, equipo) antes de recomendarme nada."
];

const ASKS: Record<MarkdownTypeKey, string[]> = {
  experimentado: SENIORITY_ASKS,
  sin_experiencia: [
    "Ayudame a elegir por dónde empezar considerando mis áreas de más afinidad, no sólo las más débiles.",
    "Armá un plan de estudio de 30 días para el rol sugerido, con un proyecto propio que pueda mostrar como portfolio.",
    "Decime qué de lo que ya hice en otros trabajos es transferible a Producto y cómo contarlo."
  ],
  builder: [
    "Ayudame a convertir en método explícito las áreas donde hoy voy a intuición.",
    "Dado el estado de mi producto, decime cuál de estas brechas me está frenando más ahora mismo y por qué.",
    "Proponeme el experimento o la práctica más chica que pueda correr esta semana para cada brecha de prioridad Alta."
  ],
  lider: [
    "Ayudame a priorizar en qué dominio nivelar primero al equipo y con qué argumento se lo presento a mi jefatura.",
    "Proponeme rituales o cambios de proceso concretos, no capacitaciones genéricas.",
    "Decime qué métricas usaría para saber en 3 meses si el equipo mejoró en esos dominios."
  ],
  legacy: SENIORITY_ASKS
};

/** Cuánto del campo libre entra en el documento. */
const MAX_FREE_TEXT = 200;

/**
 * Deja el texto que escribió la persona en condiciones de entrar al documento.
 *
 * Es el único contenido del Markdown que no controlamos: sale de un input y
 * termina pegado en un LLM. Un backtick abierto, un `#` al principio de una
 * línea o un salto de línea suelto convierten lo que sigue en código, en título
 * o en un ítem de lista, y el resto del documento se lee mal o directamente
 * deja de leerse. Se aplana a una línea, se corta y se escapa lo que Markdown
 * interpreta.
 */
function sanitizeFreeText(input: string): string {
  const flat = input.replace(/\s+/g, " ").trim();
  const clipped =
    flat.length > MAX_FREE_TEXT ? `${flat.slice(0, MAX_FREE_TEXT).trimEnd()}…` : flat;
  return clipped.replace(/[\\`*_[\]#>|~]/g, "\\$&");
}

/** Un `|` sin escapar parte la fila en dos columnas y desarma la tabla entera. */
function tableCell(text: string): string {
  return text.replace(/\s+/g, " ").trim().replace(/\|/g, "\\|");
}

interface AssessmentMarkdownInput {
  result: AssessmentResult;
  values: AnyAssessmentValues | null;
  assessmentType: AssessmentTypeKey | null;
  updatedAt: string | null;
}

/**
 * Arma el documento completo: encabezado para el modelo, resumen, contexto
 * declarado, tabla de puntajes por dominio, brechas priorizadas, dominios
 * opcionales y el pedido final. Los títulos y ese pedido cambian según el tipo
 * de evaluación, porque no es lo mismo un diagnóstico de seniority que un mapa
 * de afinidad o la madurez de un equipo.
 */
export function buildAssessmentMarkdown({
  result,
  values,
  assessmentType,
  updatedAt
}: AssessmentMarkdownInput): string {
  const type: MarkdownTypeKey = assessmentType ?? "legacy";
  // Las evaluaciones sin tipo se respondieron sobre los once dominios base, que
  // son los mismos que hoy usa la de "experimentado".
  const domainType: AssessmentTypeKey = assessmentType ?? "experimentado";
  const typeDef = getAssessmentTypeDef(assessmentType);
  const nivelDisplay = getNivelDisplay(assessmentType, result.nivel);

  const lines: string[] = [];
  const push = (...text: string[]) => lines.push(...text);

  push(`# ${TITLES[type]}`, "");
  push(
    "> Contexto para la IA: esto es el resultado de una autoevaluación que hice en ProductPrepa.",
    "> Son mis propias respuestas, no una medición externa. Usalo como punto de partida y",
    "> preguntame lo que necesites de mi contexto real antes de darme recomendaciones.",
    ""
  );

  push("## Resumen", "");
  push(
    `- **Evaluación tomada:** ${TAKEN_LABELS[type] ?? `${typeDef.title} (${typeDef.shortLabel})`}`
  );
  push(`- **${nivelDisplay.title}:** ${nivelDisplay.label}`);
  push(`- **Promedio global:** ${result.promedioGlobal} / 5`);
  if (result.specialization) push(`- **Especialización:** ${result.specialization}`);
  if (result.suggestedRole) push(`- **Rol sugerido:** ${result.suggestedRole.label}`);
  if (updatedAt) {
    const fecha = new Intl.DateTimeFormat("es-AR", { dateStyle: "long" }).format(new Date(updatedAt));
    push(`- **Fecha de la evaluación:** ${fecha}`);
  }
  push("", SCALE_NOTES[type], "");

  if (result.profileEstimate) {
    push("### Lectura del perfil", "", result.profileEstimate, "");
  }

  // --- Contexto declarado (no puntuado) ---------------------------------
  const context = result.context;
  if (context?.etapa || context?.rolInteres || context?.detalle) {
    push("## Mi contexto", "");
    if (context.etapa) {
      push(`- **Etapa del producto:** ${getContextValueLabel("etapa", context.etapa)}`);
    }
    if (context.rolInteres) {
      push(`- **Rol que me interesa:** ${getContextValueLabel("rolInteres", context.rolInteres)}`);
    }
    if (context.detalle) {
      const detalle = sanitizeFreeText(context.detalle);
      if (detalle) push(`- **En mis palabras:** ${detalle}`);
    }
    push("");
  }

  // --- Tabla completa de puntajes ---------------------------------------
  // En el orden de los dominios de la evaluación, el mismo del radar, para que
  // se pueda comparar contra una evaluación futura sin reordenar nada.
  //
  // La pregunta va en la misma fila que el puntaje: "Analítica y métricas: 3/5"
  // no le dice al modelo qué se estaba midiendo, y ahí es donde se le va la mano
  // adivinando. Con el enunciado al lado, el 3 significa algo.
  const domains = getDomainsForType(domainType).filter((d) => typeof values?.[d.key] === "number");
  if (domains.length > 0) {
    push("## Puntajes por dominio", "");
    push("| Dominio | Puntaje | Estado | Qué se preguntó |", "| --- | --- | --- | --- |");
    for (const domain of domains) {
      const value = values![domain.key]!;
      push(
        `| ${tableCell(domain.label)} | ${value} / 5 | ${getDomainStatusLabel(value)} | ${tableCell(domain.question)} |`
      );
    }
    push("");
  }

  if (result.gaps.length > 0) {
    push(`## ${GAP_TITLES[type]}`, "");
    push(...result.gaps.map((gap) => `- **${gap.label}** — ${gap.value} / 5 · prioridad ${gap.prioridad}`));
    push("");
  }

  // --- Dominios opcionales ----------------------------------------------
  // En las evaluaciones de builder y líder, growth e ia_aplicada son dominios
  // puntuados como cualquier otro y ya salieron en la tabla: sólo se listan acá
  // los que se respondieron como extra.
  const inTable = new Set(domains.map((d) => d.key));
  const optionalImprovements = (result.optionalImprovements ?? []).filter((i) => !inTable.has(i.key));
  const optionalScores = Object.entries(result.optionalDomains ?? {}).filter(
    ([key]) => !inTable.has(key as AnyDomainKey)
  );

  if (optionalImprovements.length > 0) {
    push("## Dominios opcionales", "");
    for (const improvement of optionalImprovements) {
      push(`### ${improvement.label} — ${improvement.value} / 5`, "");
      push(`**${improvement.title}**`, "", improvement.description, "");
    }
  } else if (optionalScores.length > 0) {
    push("## Dominios opcionales", "");
    for (const [key, value] of optionalScores) {
      push(`- **${key === "growth" ? "Growth" : "IA aplicada a Producto"}** — ${value} / 5`);
    }
    push("");
  }

  // --- El pedido concreto ------------------------------------------------
  push("## Qué me gustaría que hagas", "");
  push(...ASKS[type].map((ask, i) => `${i + 1}. ${ask}`));
  push("");

  // Los dos links van etiquetados: el Markdown es una de las dos mitades del
  // feature que sí se puede atribuir, y sin UTM no hay forma de saber cuál de
  // las dos trae gente.
  push("---", "");
  push(
    `Evaluación generada en [ProductPrepa](${homeUrl("export_md")}) · ` +
      `Podés hacer la tuya gratis en ${evalUrl("export_md")}`
  );

  return lines.join("\n");
}
