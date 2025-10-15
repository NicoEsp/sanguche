import { z } from "zod";

export type SeniorityLevel = "Junior" | "Mid" | "Senior" | "Lead" | "Head";

export const DOMAINS = [
  {
    key: "estrategia",
    label: "Estrategia de producto",
    description: "Capacidad para definir visión, objetivos estratégicos y roadmap de largo plazo del producto.",
    diagnosticQuestion: "¿Tu equipo tiene una visión de producto clara y documentada?",
    question: "¿Qué tan sólida sentís tu capacidad para definir la estrategia de producto?",
    statements: [
      { value: 1, label: "Sigo la estrategia definida por otros y no participo en su construcción (1)" },
      { value: 2, label: "Participo en conversaciones estratégicas aportando insumos puntuales cuando me lo piden (2)" },
      { value: 3, label: "Defino objetivos y prioridades para features o squads con acompañamiento ocasional (3)" },
      { value: 4, label: "Diseño y comunico estrategias integrales que alinean al equipo y stakeholders (4)" },
      { value: 5, label: "Impulso la visión de producto a nivel negocio y guío a otros en estrategia (5)" }
    ],
    levelDefinitions: [
      "Novato: Comprende conceptos básicos de estrategia pero necesita guía constante",
      "Básico: Puede contribuir en definiciones estratégicas con supervisión",
      "Intermedio: Define estrategias de producto de forma independiente para features específicas",
      "Avanzado: Lidera la estrategia de producto completa y la comunica efectivamente",
      "Experto: Define estrategias innovadoras que impactan el negocio y mentoriza a otros"
    ]
  },
  { 
    key: "roadmap",
    label: "Roadmap y priorización",
    description: "Habilidad para planificar, priorizar funcionalidades y gestionar el backlog del producto.",
    diagnosticQuestion: "¿Existe un roadmap actualizado y compartido con stakeholders?",
    question: "¿Qué tanto dominio tenés para priorizar y construir el roadmap del producto?",
    statements: [
      { value: 1, label: "Prioritizo tareas siguiendo instrucciones sin evaluar impacto (1)" },
      { value: 2, label: "Propongo priorizaciones simples usando criterios dados por el equipo (2)" },
      { value: 3, label: "Construyo y actualizo roadmaps de mi scope equilibrando valor y esfuerzo (3)" },
      { value: 4, label: "Anticipo dependencias, comunico cambios y alineo roadmaps multiequipo (4)" },
      { value: 5, label: "Diseño procesos de priorización que optimizan portfolio y guían a la organización (5)" }
    ],
    levelDefinitions: [
      "Novato: Entiende conceptos de priorización pero requiere ayuda para aplicarlos",
      "Básico: Puede priorizar tareas simples usando frameworks básicos",
      "Intermedio: Gestiona roadmaps de features y usa múltiples criterios de priorización",
      "Avanzado: Crea roadmaps estratégicos balanceando recursos, impacto y dependencies",
      "Experto: Diseña frameworks de priorización innovadores y optimiza recursos cross-team"
    ]
  },
  { 
    key: "ejecucion",
    label: "Ejecución y entregas",
    description: "Dominio de metodologías ágiles, delivery management y seguimiento de proyectos.",
    diagnosticQuestion: "¿Utilizas metodologías ágiles para la entrega de producto?",
    question: "¿Cómo describirías tu capacidad para planificar y asegurar la ejecución del producto?",
    statements: [
      { value: 1, label: "Necesito guía para organizar tareas y seguir ceremonias ágiles (1)" },
      { value: 2, label: "Coordino sprints simples asegurando entregas con apoyo del equipo (2)" },
      { value: 3, label: "Gestiono planificación, seguimiento y riesgos de mi squad de forma autónoma (3)" },
      { value: 4, label: "Orquesto múltiples equipos, removiendo bloqueos y mejorando procesos continuamente (4)" },
      { value: 5, label: "Diseño sistemas de ejecución escalables y mido performance de punta a punta (5)" }
    ],
    levelDefinitions: [
      "Novato: Conoce metodologías ágiles básicas pero necesita orientación en su aplicación",
      "Básico: Aplica Scrum/Kanban en proyectos simples con supervisión",
      "Intermedio: Gestiona sprints y entregas de forma autónoma con equipos pequeños",
      "Avanzado: Optimiza procesos de entrega y coordina múltiples equipos eficientemente",
      "Experto: Diseña e implementa procesos de delivery escalables y de alta performance"
    ]
  },
  { 
    key: "discovery",
    label: "Discovery de usuarios",
    description: "Capacidad para investigar usuarios, validar hipótesis y generar insights accionables.",
    diagnosticQuestion: "¿Realizas entrevistas con usuarios al menos una vez al mes?",
    question: "¿Qué tan sólida sentís tu habilidad en discovery de usuarios?",
    statements: [
      { value: 1, label: "Nunca participé de entrevistas con usuarios (1)" },
      { value: 2, label: "Acompañé entrevistas pero no las lideré (2)" },
      { value: 3, label: "Organicé entrevistas con ayuda (3)" },
      { value: 4, label: "Lideré procesos completos (4)" },
      { value: 5, label: "Sistematizo el proceso y enseño a otros (5)" }
    ],
    levelDefinitions: [
      "Novato: Comprende la importancia del user research pero requiere guía metodológica",
      "Básico: Conduce entrevistas básicas y encuestas con plantillas predefinidas",
      "Intermedio: Diseña y ejecuta research studies generando insights valiosos",
      "Avanzado: Lidera estrategias de discovery complejas y valida hipótesis sistemáticamente",
      "Experto: Crea frameworks de research innovadores y forma cultura data-driven"
    ]
  },
  { 
    key: "analitica",
    label: "Analítica y métricas",
    description: "Habilidad para definir KPIs, analizar datos y tomar decisiones basadas en métricas.",
    diagnosticQuestion: "¿Tienes definidas métricas clave para medir el éxito del producto?",
    question: "¿Cómo evaluás tu capacidad para definir y analizar métricas del producto?",
    statements: [
      { value: 1, label: "Consulto métricas básicas solo cuando me las comparten (1)" },
      { value: 2, label: "Sigo dashboards existentes y saco conclusiones tácticas (2)" },
      { value: 3, label: "Defino KPIs para mi área y analizo resultados regularmente (3)" },
      { value: 4, label: "Construyo modelos de medición que conectan métricas con decisiones estratégicas (4)" },
      { value: 5, label: "Anticipo tendencias del negocio y enseño a otros a operar con métricas (5)" }
    ],
    levelDefinitions: [
      "Novato: Entiende métricas básicas pero necesita ayuda para interpretarlas",
      "Básico: Analiza métricas simples y genera reportes básicos",
      "Intermedio: Define KPIs relevantes y crea dashboards para monitoreo continuo",
      "Avanzado: Diseña sistemas de medición complejos y deriva insights estratégicos",
      "Experto: Crea frameworks de analytics avanzados y predice tendencias del negocio"
    ]
  },
  { 
    key: "ux",
    label: "UX e investigación",
    description: "Conocimiento en experiencia de usuario, usabilidad y metodologías de design thinking.",
    diagnosticQuestion: "¿Colaboras regularmente con el equipo de UX/Design en el proceso de producto?",
    question: "¿Qué tan integrada sentís tu contribución al diseño y la experiencia de usuario?",
    statements: [
      { value: 1, label: "Confío en el criterio del equipo de diseño sin involucrarme en el proceso (1)" },
      { value: 2, label: "Participo en revisiones de diseño aportando feedback puntual (2)" },
      { value: 3, label: "Mapeo journeys y coordino validaciones de usabilidad para mi producto (3)" },
      { value: 4, label: "Cocreo soluciones complejas junto a UX asegurando experiencias consistentes (4)" },
      { value: 5, label: "Instalo prácticas de diseño centrado en usuario y mentoreo al equipo (5)" }
    ],
    levelDefinitions: [
      "Novato: Comprende principios básicos de UX pero necesita apoyo en su aplicación",
      "Básico: Evalúa usabilidad básica y propone mejoras simples de experiencia",
      "Intermedio: Diseña user journeys y coordina research de usabilidad efectivamente",
      "Avanzado: Lidera iniciativas de UX strategy y optimiza experiencias complejas",
      "Experto: Innova en metodologías de UX y establece estándares de diseño centrado en usuario"
    ]
  },
  { 
    key: "stakeholders",
    label: "Gestión de stakeholders",
    description: "Capacidad para alinear, comunicar y gestionar expectativas con diferentes equipos y roles.",
    diagnosticQuestion: "¿Tienes reuniones regulares de alineación con todos los stakeholders clave?",
    question: "¿Cómo describirías tu habilidad para gestionar stakeholders?",
    statements: [
      { value: 1, label: "Solo interactúo con stakeholders cuando me convocan (1)" },
      { value: 2, label: "Mantengo comunicación regular con mi equipo directo (2)" },
      { value: 3, label: "Gestiono expectativas y alineación con múltiples áreas involucradas (3)" },
      { value: 4, label: "Anticipo conflictos, negocio acuerdos y mantengo a todos sincronizados (4)" },
      { value: 5, label: "Construyo alianzas estratégicas y lidero alineación a nivel organizacional (5)" }
    ],
    levelDefinitions: [
      "Novato: Identifica stakeholders básicos pero necesita ayuda para gestionarlos",
      "Básico: Mantiene comunicación regular con stakeholders directos",
      "Intermedio: Mapea y gestiona stakeholders complejos manteniendo alineación",
      "Avanzado: Influencia stakeholders senior y resuelve conflictos interdepartamentales",
      "Experto: Construye ecosistemas de stakeholders y lidera transformaciones organizacionales"
    ]
  },
  { 
    key: "comunicacion",
    label: "Comunicación y alineación",
    description: "Habilidad para presentar, documentar y crear narrativas que generen alineación organizacional.",
    diagnosticQuestion: "¿Documentas y comunicas decisiones de producto de forma sistemática?",
    question: "¿Qué tan efectiva es tu comunicación para alinear a tu organización?",
    statements: [
      { value: 1, label: "Comparto información básica por mensajes o reuniones informales (1)" },
      { value: 2, label: "Documento actualizaciones clave cuando me las piden (2)" },
      { value: 3, label: "Estructuro narrativas claras para comunicar decisiones de producto (3)" },
      { value: 4, label: "Alineo equipos con presentaciones convincentes y documentación accesible (4)" },
      { value: 5, label: "Creo storytelling que inspira acción y establezco estándares de comunicación (5)" }
    ],
    levelDefinitions: [
      "Novato: Comunica información básica pero necesita apoyo en estructura y claridad",
      "Básico: Presenta updates simples y mantiene documentación básica",
      "Intermedio: Crea presentaciones efectivas y documenta decisiones estratégicas",
      "Avanzado: Desarrolla narrativas convincentes que alinean organizaciones complejas",
      "Experto: Inspira a través de storytelling y establece estándares de comunicación"
    ]
  },
  { 
    key: "liderazgo",
    label: "Liderazgo",
    description: "Capacidad para liderar equipos, mentorar profesionales y generar influence organizacional.",
    diagnosticQuestion: "¿Lideras o mentorízas a otros miembros del equipo de producto?",
    question: "¿Cómo evaluás tu liderazgo dentro del equipo de producto?",
    statements: [
      { value: 1, label: "Me enfoco en mis tareas individuales y no lidero iniciativas (1)" },
      { value: 2, label: "Coordino esfuerzos puntuales con pares cuando es necesario (2)" },
      { value: 3, label: "Guío a un equipo pequeño y ofrezco mentoring estructurado (3)" },
      { value: 4, label: "Desarrollo talento, delego estratégicamente y gestiono desempeño (4)" },
      { value: 5, label: "Moldeo la cultura de producto y formo líderes en toda la organización (5)" }
    ],
    levelDefinitions: [
      "Novato: Muestra potencial de liderazgo pero necesita desarrollar habilidades básicas",
      "Básico: Lidera tareas específicas y apoya a compañeros junior ocasionalmente",
      "Intermedio: Lidera equipos pequeños y mentoriza de forma estructurada",
      "Avanzado: Lidera equipos multidisciplinarios y desarrolla talento sistemáticamente",
      "Experto: Inspira liderazgo en otros y transforma culturas organizacionales"
    ]
  },
  { 
    key: "tecnico",
    label: "Conocimiento técnico",
    description: "Comprensión de tecnología, arquitectura de software y capacidades de desarrollo.",
    diagnosticQuestion: "¿Puedes evaluar la complejidad técnica y feasibilidad de las funcionalidades?",
    question: "¿Qué tan segura sentís tu comprensión técnica para tomar decisiones de producto?",
    statements: [
      { value: 1, label: "Necesito traducción técnica para comprender impacto y factibilidad (1)" },
      { value: 2, label: "Converso con devs sobre alcance sin profundizar en trade-offs (2)" },
      { value: 3, label: "Evalúo factibilidad técnica y propongo alternativas junto al equipo (3)" },
      { value: 4, label: "Tomo decisiones informadas sobre arquitectura y complejidad (4)" },
      { value: 5, label: "Diseño soluciones junto a líderes técnicos y elevo la calidad técnica (5)" }
    ],
    levelDefinitions: [
      "Novato: Entiende conceptos técnicos básicos pero necesita explicaciones detalladas",
      "Básico: Comprende limitaciones técnicas simples y comunica con desarrolladores",
      "Intermedio: Evalúa trade-offs técnicos y participa en decisiones de arquitectura",
      "Avanzado: Influencia decisiones técnicas complejas y optimiza performance del producto",
      "Experto: Innova en soluciones técnicas y establece estándares de calidad técnica"
    ]
  },
  { 
    key: "monetizacion",
    label: "Monetización y negocio",
    description: "Conocimiento de modelos de negocio, pricing strategies y métricas financieras del producto.",
    diagnosticQuestion: "¿Conoces el modelo de monetización y métricas de revenue de tu producto?",
    question: "¿Qué tanto entendés y potenciás la monetización del producto?",
    statements: [
      { value: 1, label: "Desconozco cómo el producto genera revenue (1)" },
      { value: 2, label: "Entiendo los basics del modelo actual cuando me los explican (2)" },
      { value: 3, label: "Analizo métricas de negocio y propongo mejoras de monetización (3)" },
      { value: 4, label: "Experimento con pricing, growth y nuevas palancas de ingresos (4)" },
      { value: 5, label: "Defino estrategias de negocio que expanden revenue y guío al equipo (5)" }
    ],
    levelDefinitions: [
      "Novato: Comprende conceptos básicos de monetización pero necesita contexto del negocio",
      "Básico: Analiza métricas de revenue simples y comprende el modelo de negocio actual",
      "Intermedio: Propone optimizaciones de monetización y evalúa nuevas oportunidades",
      "Avanzado: Diseña estrategias de pricing y monetización que maximizan el valor",
      "Experto: Innova en modelos de negocio y crea nuevas fuentes de revenue sostenibles"
    ]
  }
] as const;

export type DomainKey = (typeof DOMAINS)[number]["key"];

const shape: Record<DomainKey, z.ZodNumber> = DOMAINS.reduce((acc, d) => {
  (acc as Record<string, z.ZodNumber>)[d.key] = z.number({ 
    required_error: "Obligatorio para avanzar",
    invalid_type_error: "Debe seleccionar una opción válida"
  }).int().min(1, "Debe seleccionar al menos 1").max(5, "El valor máximo es 5");
  return acc;
}, {} as Record<DomainKey, z.ZodNumber>);

export const assessmentSchema = z.object(shape);

export type AssessmentValues = z.infer<typeof assessmentSchema>;

export type DomainScore = {
  key: DomainKey;
  label: string;
  value: number;
};

export type Gap = DomainScore & { prioridad: "Alta" | "Media" };

export type NeutralArea = DomainScore;

export type Strength = DomainScore & { nivel: "Destacada" | "Sólida" };

export type AssessmentResult = {
  promedioGlobal: number;
  nivel: SeniorityLevel;
  strengths: Strength[];
  gaps: Gap[];
  neutralAreas: NeutralArea[];
  profileEstimate: string;
  standardDeviation: number;
  specialization: string;
  ctaInfo: { text: string; route: string };
};

export function computeSeniorityScore(values: AssessmentValues): AssessmentResult {
  const entries = Object.entries(values) as [keyof AssessmentValues, number][];
  const sum = entries.reduce((acc, [, v]) => acc + v, 0);
  const n = entries.length || 1;
  const promedioGlobal = Number((sum / n).toFixed(2));

  // Calcular desviación estándar
  const variance = entries.reduce((acc, [, v]) => acc + Math.pow(v - promedioGlobal, 2), 0) / n;
  const standardDeviation = Number(Math.sqrt(variance).toFixed(2));

  const nivel: SeniorityLevel =
    promedioGlobal <= 2.0
      ? "Junior"
      : promedioGlobal <= 3.2
      ? "Mid"
      : promedioGlobal <= 4.2
      ? "Senior"
      : promedioGlobal <= 4.6
      ? "Lead"
      : "Head";

  const all: DomainScore[] = entries.map(([key, value]) => ({
    key: key as DomainKey,
    label: DOMAINS.find((d) => d.key === key)!.label,
    value,
  }));

  // Categorizar basado en umbrales lógicos
  const realStrengths = all.filter(d => d.value >= 4.0);
  const realGaps = all.filter(d => d.value < 3.0);
  const neutralAreas = all.filter(d => d.value >= 3.0 && d.value < 4.0);

  // Fortalezas con niveles
  const strengths: Strength[] = realStrengths
    .sort((a, b) => b.value - a.value)
    .map(s => ({
      ...s,
      nivel: s.value >= 4.5 ? "Destacada" : "Sólida"
    }));

  // Brechas con priorización inteligente
  const gaps: Gap[] = realGaps
    .sort((a, b) => a.value - b.value)
    .map(g => ({
      ...g,
      prioridad: g.value < 2.5 ? "Alta" : "Media"
    }));

  // Identificar especialización (área más fuerte)
  const specialization = all.reduce((prev, current) => 
    current.value > prev.value ? current : prev
  ).label;

  // Generar perfil estimado
  const profileEstimate = generateProfileEstimate(
    nivel, 
    promedioGlobal, 
    standardDeviation, 
    specialization, 
    strengths.length, 
    gaps.filter(g => g.prioridad === "Alta").length
  );

  // Generar CTA dinámico
  const ctaInfo = generateProfileCTA(
    nivel,
    promedioGlobal,
    standardDeviation,
    specialization,
    strengths.length,
    gaps.filter(g => g.prioridad === "Alta").length
  );

  return { 
    promedioGlobal, 
    nivel, 
    strengths, 
    gaps, 
    neutralAreas,
    profileEstimate,
    standardDeviation,
    specialization,
    ctaInfo
  };
}

function generateProfileEstimate(
  nivel: SeniorityLevel, 
  promedio: number, 
  desviacion: number, 
  especializacion: string,
  fortalezas: number,
  brechasCriticas: number
): string {
  const isBalanced = desviacion < 0.8;
  const hasSpecialization = desviacion > 1.2;

  // 3+ brechas críticas
  if (brechasCriticas >= 3) {
    return `Tu perfil está en desarrollo, con alto potencial como PM ${nivel}. Hoy es clave enfocarte en tus áreas críticas antes de dar nuevos pasos. Te conviene construir una base más sólida.`;
  }

  // Equilibrado + 3+ fortalezas
  if (isBalanced && fortalezas >= 3) {
    return `Perfil equilibrado de PM ${nivel}, con bases sólidas y consistentes. Estás bien preparado para asumir desafíos de mayor nivel o responsabilidad. Es un gran momento para avanzar.`;
  }

  // Especializado + Senior/Lead/Head
  if (hasSpecialization) {
    if (nivel === "Senior" || nivel === "Lead" || nivel === "Head") {
      return `PM ${nivel} con especialización marcada en ${especializacion}. Dominás con fuerza tu área, lo que te da un diferencial claro. El próximo salto puede estar en ampliar tu rango de impacto.`;
    } else {
      // Especializado + Junior/Mid
      return `Especialización temprana en ${especializacion}, dentro de un perfil PM ${nivel}. Tenés una fortaleza clara, pero desarrollar una visión más integral va a potenciar mucho tu carrera.`;
    }
  }

  // Promedio ≥ 4.0
  if (promedio >= 4.0) {
    return `Perfil sólido de PM ${nivel}, con muy buena consistencia. Tenés una excelente base para aspirar a más impacto o seniority. Usá esto como trampolín hacia tu próximo rol.`;
  }

  // Promedio ≥ 3.5
  if (promedio >= 3.5) {
    return `PM ${nivel} con buen potencial de crecimiento. Tu perfil tiene varias competencias bien encaminadas. Si enfocás tus esfuerzos en las áreas clave, vas a poder crecer rápido.`;
  }

  // Resto (< 3.5)
  return `Perfil emergente de PM ${nivel}. Este es un buen momento para enfocarte en fortalecer tus fundamentos. Consolidar las bases te va a abrir muchas más puertas.`;
}

function generateProfileCTA(
  nivel: SeniorityLevel,
  promedio: number,
  desviacion: number,
  especializacion: string,
  fortalezas: number,
  brechasCriticas: number
): { text: string; route: string } {
  const isBalanced = desviacion < 0.8;
  const hasSpecialization = desviacion > 1.2;

  // 3+ brechas críticas
  if (brechasCriticas >= 3) {
    return {
      text: "Podés avanzar más rápido con acompañamiento personalizado.",
      route: "/premium"
    };
  }

  // Equilibrado + 3+ fortalezas
  if (isBalanced && fortalezas >= 3) {
    return {
      text: "La mentoría puede ayudarte a definir cuál debería ser ese \"siguiente paso\".",
      route: "/premium"
    };
  }

  // Especializado + Senior/Lead/Head
  if (hasSpecialization) {
    if (nivel === "Senior" || nivel === "Lead" || nivel === "Head") {
      return {
        text: "El plan Premium te permite trabajar sobre esas áreas complementarias de forma concreta y enfocada.",
        route: "/premium"
      };
    } else {
      // Especializado + Junior/Mid
      return {
        text: "El plan Premium te puede ayudar a construir ese perfil más balanceado, paso a paso.",
        route: "/premium"
      };
    }
  }

  // Promedio ≥ 4.0
  if (promedio >= 4.0) {
    return {
      text: "La mentoría puede ayudarte a convertir esa base en un diferencial estratégico.",
      route: "/premium"
    };
  }

  // Promedio ≥ 3.5
  if (promedio >= 3.5) {
    return {
      text: "Con el plan Premium podés acelerar ese proceso con foco y acompañamiento.",
      route: "/premium"
    };
  }

  // Resto (< 3.5)
  return {
    text: "La mentoría puede ayudarte a ordenar ese camino y avanzar con claridad.",
    route: "/premium"
  };
}
