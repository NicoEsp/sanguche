import {
  AnyAssessmentValues,
  AnyDomainKey,
  AssessmentResult,
  AssessmentTypeKey,
  getAssessmentTypeDef,
  getContextValueLabel,
  getDomainsForType,
  getNivelDisplay
} from "@/utils/scoring";

/**
 * Serializa el resultado de la evaluación a Markdown, para que la persona se lo
 * lleve al LLM que ya usa.
 *
 * Es texto y no la imagen del radar a propósito: un PNG obliga al modelo a
 * hacer OCR de un gráfico y a adivinar los números. La tabla de puntajes, en
 * cambio, entra tal cual. La imagen sirve para compartir, esto para pensar.
 */

const TITLES: Record<AssessmentTypeKey, string> = {
  experimentado: "Mi evaluación de competencias en Producto",
  sin_experiencia: "Mi mapa de afinidad con Producto",
  builder: "Mi evaluación como Product Builder",
  lider: "Diagnóstico de mi equipo de Producto"
};

/** Cómo leer la escala 1–5 según qué evaluación se tomó. */
const SCALE_NOTES: Record<AssessmentTypeKey, string> = {
  experimentado:
    "Escala 1 a 5 por dominio, donde 1 es que todavía no lo trabajé y 5 que lo tengo consolidado y se lo puedo enseñar a otro.",
  sin_experiencia:
    "Escala 1 a 5 por dominio, donde 1 es que nunca me crucé con el tema y 5 que es de lo que más me atrae explorar. Mide afinidad y conocimiento teórico, no experiencia laboral.",
  builder:
    "Escala 1 a 5 por dominio, donde 1 es que voy a pura intuición y 5 que tengo un método explícito y repetible.",
  lider:
    "Escala 1 a 5 por dominio, referida a mi equipo, donde 1 es que no existe el proceso y 5 que está consolidado y es autónomo."
};

const SECTION_TITLES: Record<AssessmentTypeKey, { strengths: string; neutral: string; gaps: string }> = {
  experimentado: {
    strengths: "Fortalezas",
    neutral: "Competencias sólidas",
    gaps: "Áreas de mejora"
  },
  sin_experiencia: {
    strengths: "Donde ya tengo terreno ganado",
    neutral: "Áreas con base",
    gaps: "Terreno por explorar"
  },
  builder: {
    strengths: "Donde ya tengo método",
    neutral: "Procesos encaminados",
    gaps: "Donde me falta método"
  },
  lider: {
    strengths: "Fortalezas del equipo",
    neutral: "Procesos encaminados",
    gaps: "Dónde nivelar al equipo"
  }
};

/** Lo que le pedimos al modelo, ajustado a lo que cada perfil necesita. */
const ASKS: Record<AssessmentTypeKey, string[]> = {
  experimentado: [
    "Ayudame a entender qué me separa concretamente del siguiente nivel de seniority.",
    "Armá un plan de 30 días para la primera área de mejora de prioridad Alta, con entregables concretos y no sólo lecturas.",
    "Preguntame lo que te falte de mi contexto real (empresa, producto, equipo) antes de recomendarme nada."
  ],
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
  ]
};

type DomainStatus = "Fortaleza" | "Sólida" | "A mejorar";

interface AssessmentMarkdownInput {
  result: AssessmentResult;
  values: AnyAssessmentValues | null;
  assessmentType: AssessmentTypeKey | null;
  updatedAt: string | null;
}

export function buildAssessmentMarkdown({
  result,
  values,
  assessmentType,
  updatedAt
}: AssessmentMarkdownInput): string {
  const type = assessmentType ?? "experimentado";
  const typeDef = getAssessmentTypeDef(assessmentType);
  const nivelDisplay = getNivelDisplay(assessmentType, result.nivel);
  const sections = SECTION_TITLES[type];

  // Estado por dominio, para que la tabla diga en una columna lo que abajo se
  // repite en listas.
  const status = new Map<AnyDomainKey, DomainStatus>();
  for (const s of result.strengths) status.set(s.key, "Fortaleza");
  for (const n of result.neutralAreas) status.set(n.key, "Sólida");
  for (const g of result.gaps) status.set(g.key, "A mejorar");

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
  push(`- **Evaluación tomada:** ${typeDef.title} (${typeDef.shortLabel})`);
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
    if (context.detalle) push(`- **En mis palabras:** ${context.detalle}`);
    push("");
  }

  // --- Tabla completa de puntajes ---------------------------------------
  // En el orden de los dominios de la evaluación, el mismo del radar, para que
  // se pueda comparar contra una evaluación futura sin reordenar nada.
  const domains = getDomainsForType(type).filter((d) => typeof values?.[d.key] === "number");
  if (domains.length > 0) {
    push("## Puntajes por dominio", "");
    push("| Dominio | Puntaje | Estado |", "| --- | --- | --- |");
    for (const domain of domains) {
      push(`| ${domain.label} | ${values![domain.key]} / 5 | ${status.get(domain.key) ?? "—"} |`);
    }
    push("");
  }

  const scoreList = (items: Array<{ label: string; value: number }>, suffix?: (i: number) => string) =>
    items.map((item, i) => `- **${item.label}** — ${item.value} / 5${suffix ? suffix(i) : ""}`);

  if (result.gaps.length > 0) {
    push(`## ${sections.gaps}`, "");
    push(...scoreList(result.gaps, (i) => ` · prioridad ${result.gaps[i].prioridad}`));
    push("");
  }

  if (result.strengths.length > 0) {
    push(`## ${sections.strengths}`, "");
    push(...scoreList(result.strengths, (i) => ` · ${result.strengths[i].nivel}`));
    push("");
  }

  if (result.neutralAreas.length > 0) {
    push(`## ${sections.neutral}`, "");
    push(...scoreList(result.neutralAreas));
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

  push("---", "");
  push(
    "Evaluación generada en [ProductPrepa](https://productprepa.com) · " +
      "Podés hacer la tuya gratis en https://productprepa.com/evaluacion-product-manager"
  );

  return lines.join("\n");
}
