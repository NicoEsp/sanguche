import {
  AnyAssessmentValues,
  AnyDomainKey,
  AssessmentDomainDef,
  AssessmentResult,
  AssessmentTypeKey,
  getAssessmentTypeDef,
  getContextValueLabel,
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
 * brechas sí agregan algo —el orden de severidad— y son lo que se le pide
 * resolver al modelo, así que quedan.
 */
const GAP_TITLES: Record<MarkdownTypeKey, string> = {
  experimentado: "Mis brechas",
  sin_experiencia: "Mis brechas",
  builder: "Mis brechas",
  // La evaluación de líder mide al equipo, no a quien la responde.
  lider: "Las brechas del equipo",
  legacy: "Mis brechas"
};

/**
 * Etiqueta de cada puntaje dentro del export.
 *
 * La app agrupa en tres bandas y todo lo que sea 4 o 5 cae en "Fortaleza". En
 * un perfil parejo eso dejaba ocho de diez dominios marcados igual, y el
 * documento le pedía al modelo que encontrara qué está frenando a la persona:
 * con esa tabla la respuesta honesta es "no mucho". Separar el 5 del 4 le
 * devuelve relieve al perfil, porque ahí está la diferencia entre "lo tengo
 * consolidado y lo puedo enseñar" y "lo aplico".
 *
 * Vive acá y no en scoring.ts a propósito: es una escala de lectura del
 * documento, no una recategorización del producto. La UI, el radar y los cortes
 * que usa computeSeniorityScore quedan exactamente como estaban.
 */
function scoreLabel(value: number): string {
  if (value >= 5) return "Fortaleza";
  if (value >= 4) return "Sólida";
  if (value >= 3) return "En desarrollo";
  return "Brecha";
}

/**
 * Prioridad de cada dominio.
 *
 * El pedido final le habla al modelo de "prioridad Alta" y el documento nunca
 * asignaba ninguna: la referencia apuntaba a algo que no existía en el texto.
 * Un 4 o un 5 no llevan prioridad porque no hay nada que atender ahí, y la
 * columna vacía es justamente lo que hace que se vean las que sí.
 */
function scorePriority(value: number): string {
  if (value >= 4) return "";
  if (value >= 3) return "Media";
  return "Alta";
}

/**
 * El texto de la opción que la persona eligió, sin el "(N)" del final.
 *
 * Es lo que convierte la tabla en contexto: con la pregunta y el número solos,
 * el modelo lee "¿Qué tan bien sabés si tu producto funciona?" y "3/5" y sigue
 * sin saber qué significó ese 3. La frase elegida lo dice con las palabras de
 * la propia evaluación, y le ahorra al modelo la primera repregunta. El número
 * ya está en su columna, así que el sufijo sobra.
 */
function chosenStatement(domain: AssessmentDomainDef, value: number): string {
  return domain.statements.find((s) => s.value === value)?.label.replace(/\s*\(\d+\)\s*$/, "") ?? "";
}

/**
 * En qué situación está el perfil, para que el pedido final hable de lo que
 * realmente muestran los datos.
 *
 * Los tres pedidos eran fijos y no leían nada: a alguien cuyo dominio más bajo
 * es un 3 se le pedía trabajar "las áreas donde voy a pura intuición", que en
 * su tabla no existen. Se mira el mínimo porque es lo que decide si hay algo
 * roto, algo a medio hacer, o nada evidente y entonces conviene que el modelo
 * dude en vez de inventar un problema.
 */
type AskBand = "brecha" | "desarrollo" | "parejo";

function askBand(scores: number[]): AskBand {
  if (scores.length === 0) return "desarrollo";
  const min = Math.min(...scores);
  if (min <= 2) return "brecha";
  if (min < 4) return "desarrollo";
  return "parejo";
}

/** Lo que le pedimos al modelo, según el perfil y según lo que muestran los datos. */
const SENIORITY_ASKS: Record<AskBand, string[]> = {
  brecha: [
    "Ayudame a entender qué me separa concretamente del siguiente nivel de seniority.",
    "Armá un plan de 30 días para la primera brecha de prioridad Alta, con entregables concretos y no sólo lecturas.",
    "Preguntame lo que te falte de mi contexto real (empresa, producto, equipo) antes de recomendarme nada."
  ],
  desarrollo: [
    "No tengo una brecha evidente sino varios dominios a medio consolidar: decime qué me separa del siguiente nivel de seniority en ese escenario.",
    "Armá un plan de 30 días para llevar a nivel sólido los dominios que hoy tengo en desarrollo, con entregables concretos y no sólo lecturas.",
    "Preguntame lo que te falte de mi contexto real (empresa, producto, equipo) antes de recomendarme nada."
  ],
  parejo: [
    "Con este nivel parejo, decime dónde puedo estar sobreestimándome y qué preguntas me harías para chequearlo.",
    "Decime qué me falta demostrar —no aprender— para que el siguiente nivel de seniority sea evidente para otros.",
    "Preguntame lo que te falte de mi contexto real (empresa, producto, equipo) antes de recomendarme nada."
  ]
};

const ASKS: Record<MarkdownTypeKey, Record<AskBand, string[]>> = {
  experimentado: SENIORITY_ASKS,
  legacy: SENIORITY_ASKS,
  sin_experiencia: {
    brecha: [
      "Ayudame a elegir por dónde empezar considerando mis áreas de más afinidad, no sólo las más débiles.",
      "Armá un plan de estudio de 30 días para el rol sugerido, con un proyecto propio que pueda mostrar como portfolio.",
      "Decime qué de lo que ya hice en otros trabajos es transferible a Producto y cómo contarlo."
    ],
    desarrollo: [
      "Entiendo los conceptos pero casi no los apliqué: decime cómo convierto eso en algo demostrable.",
      "Armá un plan de 30 días para el rol sugerido donde cada semana termine en algo que pueda mostrar, no en lecturas.",
      "Decime qué de lo que ya hice en otros trabajos es transferible a Producto y cómo contarlo."
    ],
    parejo: [
      "Con este nivel parejo, decime dónde puedo estar confundiendo interés con experiencia y qué preguntas me harías para chequearlo.",
      "Decime qué me conviene profundizar para el rol sugerido y qué puedo dejar quieto por ahora.",
      "Proponeme un proyecto propio, del tamaño de un mes, que me sirva como prueba concreta en una entrevista."
    ]
  },
  builder: {
    brecha: [
      "Ayudame a convertir en método explícito las áreas donde hoy voy a pura intuición.",
      "Dado el estado de mi producto, decime cuál de estas brechas me está frenando más ahora mismo y por qué.",
      "Proponeme el experimento o la práctica más chica que pueda correr esta semana para cada brecha de prioridad Alta."
    ],
    desarrollo: [
      "Ayudame a llevar a método explícito y repetible los dominios que hoy tengo en desarrollo.",
      "Dado el estado de mi producto, decime cuál de estos dominios me está frenando más ahora mismo y por qué.",
      "Proponeme el experimento o la práctica más chica que pueda correr esta semana para cada uno."
    ],
    parejo: [
      "Con este nivel parejo, decime dónde estoy sobreestimando mi propio método y qué preguntas me harías para chequearlo.",
      "Dado el estado de mi producto, decime qué dominio conviene profundizar ahora y cuál puedo dejar quieto.",
      "Proponeme una práctica concreta para esta semana en el dominio que elijas."
    ]
  },
  lider: {
    brecha: [
      "Ayudame a priorizar en qué dominio nivelar primero al equipo y con qué argumento se lo presento a mi jefatura.",
      "Proponeme rituales o cambios de proceso concretos, no capacitaciones genéricas.",
      "Decime qué métricas usaría para saber en 3 meses si el equipo mejoró en esos dominios."
    ],
    desarrollo: [
      "El equipo tiene proceso en casi todo pero sin profundidad: decime dónde conviene consolidar primero y con qué argumento lo presento.",
      "Proponeme rituales o cambios de proceso concretos para que esos procesos pasen a ser autónomos, no capacitaciones genéricas.",
      "Decime qué métricas usaría para saber en 3 meses si el equipo mejoró en esos dominios."
    ],
    parejo: [
      "Con este nivel parejo, decime dónde puedo estar sobreestimando la madurez de mi equipo y qué evidencia pediría para chequearlo.",
      "Decime qué dominio conviene profundizar ahora y cuál puedo dejar quieto.",
      "Proponeme una práctica concreta para este mes en el dominio que elijas, y la métrica con la que la evaluaría."
    ]
  }
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

  // Los dominios de la evaluación que tienen respuesta, en el orden del radar.
  // Se arman acá arriba porque los usan tanto la tabla como el resumen y el
  // pedido final: son la única fuente de qué puntajes muestra el documento.
  const domains = getDomainsForType(domainType).filter((d) => typeof values?.[d.key] === "number");
  const scoreOf = (domain: AssessmentDomainDef) => values![domain.key]!;
  const scores = domains.map(scoreOf);

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
  if (result.specialization) push(`- **Especialización:** ${specializationLine(result, domains, scoreOf)}`);
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
  // Cada fila se lee sola: qué se preguntó, qué contestó la persona con las
  // palabras de la evaluación, el número y qué tan urgente es. Con el número
  // solo el modelo tiene que adivinar de qué se estaba hablando, y adivina mal.
  if (domains.length > 0) {
    push("## Puntajes por dominio", "");
    push(
      "| Dominio | Puntaje | Estado | Prioridad | Qué se preguntó | Mi respuesta |",
      "| --- | --- | --- | --- | --- | --- |"
    );
    for (const domain of domains) {
      const value = scoreOf(domain);
      push(
        `| ${tableCell(domain.label)} | ${value} / 5 | ${scoreLabel(value)} | ${scorePriority(value)} ` +
          `| ${tableCell(domain.question)} | ${tableCell(chosenStatement(domain, value))} |`
      );
    }
    push("");
  }

  // La prioridad ya está en la tabla, dominio por dominio: repetirla acá sólo
  // creaba dos lugares donde puede decir cosas distintas. Lo único que esta
  // lista agrega es el orden, así que eso es lo que se explica cuando no es el
  // orden obvio: en la evaluación de builder, una brecha en un dominio crítico
  // para la etapa del producto sube al frente aunque haya otra más baja, y desde
  // el documento eso se lee como un error. Se detecta mirando la lista y no
  // replicando el criterio de scoring.ts: si el criterio cambia, la nota sigue
  // apareciendo cuando corresponde.
  if (result.gaps.length > 0) {
    push(`## ${GAP_TITLES[type]}`, "");
    const porUrgencia = result.gaps.some((gap, i) => i > 0 && gap.value < result.gaps[i - 1].value);
    if (porUrgencia) {
      const etapa = result.context?.etapa;
      push(
        "Ordenadas por urgencia y no por puntaje" +
          (etapa
            ? `: para la etapa en la que está mi producto (${getContextValueLabel("etapa", etapa)}), ` +
              "las de arriba me frenan más aunque no sean las más bajas."
            : "."),
        ""
      );
    }
    push(...result.gaps.map((gap) => `- **${gap.label}** — ${gap.value} / 5`));
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
  push(...ASKS[type][askBand(scores)].map((ask, i) => `${i + 1}. ${ask}`));
  push("");

  // Los dos links van etiquetados, y distinto entre sí: el Markdown es una de
  // las dos mitades del feature que sí se puede atribuir, y la firma de marca y
  // la invitación a evaluarse son dos intenciones que no conviene sumar juntas.
  push("---", "");
  push(
    `Evaluación generada en [ProductPrepa](${homeUrl("export_md", "brand")}) · ` +
      `Podés hacer la tuya gratis en ${evalUrl("export_md", "cta")}`
  );

  return lines.join("\n");
}

/**
 * La especialización, con el criterio a la vista.
 *
 * Salía como un dato pelado y en un perfil parejo puede haber cuatro dominios
 * empatados en 5: el desempate lo termina haciendo el orden del array, que es
 * arbitrario, y el modelo lo lee como una señal fuerte sobre la persona. Decir
 * de dónde sale y cuántos empataron lo devuelve a lo que realmente es.
 */
function specializationLine(
  result: AssessmentResult,
  domains: ReadonlyArray<AssessmentDomainDef>,
  scoreOf: (domain: AssessmentDomainDef) => number
): string {
  const criterio = "dominio con mayor puntaje";
  if (domains.length === 0) return `${result.specialization} (${criterio})`;

  const max = Math.max(...domains.map(scoreOf));
  const empatados = domains.filter((d) => scoreOf(d) === max);
  // Sólo se aclara el empate si la especialización es efectivamente uno de los
  // dominios que empataron: si no, el número hablaría de otra cosa.
  if (empatados.length < 2 || !empatados.some((d) => d.label === result.specialization)) {
    return `${result.specialization} (${criterio})`;
  }
  return `${result.specialization} (${criterio}; hay ${empatados.length} empatados en ${max})`;
}
