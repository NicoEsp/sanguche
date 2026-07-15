import { z } from "zod";

export type SeniorityLevel = "Junior" | "Mid" | "Senior" | "Lead" | "Head";

export type AssessmentTypeKey = "experimentado" | "sin_experiencia" | "builder" | "lider";

export const DOMAINS = [
  {
    key: "estrategia",
    label: "Estrategia de producto",
    description: "Capacidad para definir visión, objetivos estratégicos y roadmap de largo plazo del producto.",
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
    question: "¿Qué tanto dominio tenés para priorizar y construir el roadmap del producto?",
    statements: [
      { value: 1, label: "Priorizo tareas siguiendo instrucciones sin evaluar impacto (1)" },
      { value: 2, label: "Propongo priorizaciones simples usando criterios dados por el equipo (2)" },
      { value: 3, label: "Construyo y actualizo roadmaps de mi scope equilibrando valor y esfuerzo (3)" },
      { value: 4, label: "Anticipo dependencias, comunico cambios y alineo roadmaps multiequipo (4)" },
      { value: 5, label: "Diseño procesos de priorización que optimizan portfolio y guían a la organización (5)" }
    ],
    levelDefinitions: [
      "Novato: Entiende conceptos de priorización pero requiere ayuda para aplicarlos",
      "Básico: Puede priorizar tareas simples usando frameworks básicos",
      "Intermedio: Gestiona roadmaps de features y usa múltiples criterios de priorización",
      "Avanzado: Crea roadmaps estratégicos balanceando recursos, impacto y dependencias",
      "Experto: Diseña frameworks de priorización innovadores y optimiza recursos cross-team"
    ]
  },
  { 
    key: "ejecucion",
    label: "Ejecución y entregas",
    description: "Dominio de metodologías ágiles, delivery management y seguimiento de proyectos.",
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
    description: "Capacidad para liderar equipos, mentorar profesionales y generar influencia organizacional.",
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

const domainScoreSchema = () =>
  z.number({
    required_error: "Obligatorio para avanzar",
    invalid_type_error: "Debe seleccionar una opción válida"
  }).int().min(1, "Debe seleccionar al menos 1").max(5, "El valor máximo es 5");

const shape: Record<DomainKey, z.ZodNumber> = DOMAINS.reduce((acc, d) => {
  (acc as Record<string, z.ZodNumber>)[d.key] = domainScoreSchema();
  return acc;
}, {} as Record<DomainKey, z.ZodNumber>);

export const assessmentSchema = z.object(shape);

export type AssessmentValues = z.infer<typeof assessmentSchema>;

export type DomainScore = {
  key: AnyDomainKey;
  label: string;
  value: number;
};

export type Gap = DomainScore & { prioridad: "Alta" | "Media" };

export type NeutralArea = DomainScore;

export type Strength = DomainScore & { nivel: "Destacada" | "Sólida" };

// ============= OPTIONAL DOMAINS =============

export const OPTIONAL_DOMAINS = [
  {
    key: "growth",
    label: "Growth",
    description: "Capacidad para detectar y probar oportunidades de Growth para tu producto.",
    question: "¿Qué tan familiarizado estás con detectar y probar oportunidades de Growth para tu producto?",
    statements: [
      { value: 1, label: "Todavía no sé bien cómo abordar Growth ni hice experimentos concretos. (1)" },
      { value: 2, label: "Identifico algunas oportunidades, pero me cuesta priorizarlas o convertirlas en experimentos claros. (2)" },
      { value: 3, label: "Puedo armar hipótesis y correr experimentos simples, aunque sin un proceso estable. (3)" },
      { value: 4, label: "Tengo un método para detectar oportunidades, diseñar experimentos y medir impacto en métricas de Growth. (4)" },
      { value: 5, label: "Trabajo Growth de forma continua: tengo un pipeline activo y uso datos para optimizar lo que funciona. (5)" }
    ],
    improvementFeedback: {
      1: {
        title: "Te falta un proceso básico de Growth.",
        description: "Hoy no tenés definido cómo detectar oportunidades ni cómo testearlas. Empezá por entender las bases: hipótesis, experimentos simples y métricas clave."
      },
      2: {
        title: "Te cuesta convertir ideas en experimentos.",
        description: "Tenés intuiciones y oportunidades, pero falta estructura. Priorizar por impacto/esfuerzo y definir hipótesis claras te va a ayudar a avanzar más rápido."
      },
      3: {
        title: "Te falta consistencia en el proceso.",
        description: "Sabés armar experimentos simples, pero todavía no tenés un sistema para repetirlos y medir impacto. Tu siguiente paso es armar un mini-pipeline de experimentos."
      }
    }
  },
  {
    key: "ia_aplicada",
    label: "IA aplicada a Producto",
    description: "Nivel de incorporación de IA en tu forma de trabajar como Product Builder.",
    question: "¿Qué tan incorporada tenés la IA en tu forma de trabajar como Product Builder?",
    statements: [
      { value: 1, label: "Todavía no la uso y no tengo claro en qué podría ayudarme en el día a día. (1)" },
      { value: 2, label: "La uso de vez en cuando, pero sin un proceso o criterio definido. (2)" },
      { value: 3, label: "La incorporo en varias tareas (research, documentación, prototipos), aunque sin un flujo consistente. (3)" },
      { value: 4, label: "La uso de manera estable para acelerar mi trabajo: prompts, herramientas y procesos definidos. (4)" },
      { value: 5, label: "Es parte central de mi workflow: diseño flujos, automatizaciones o sistemas que potencian mi trabajo como PM. (5)" }
    ],
    improvementFeedback: {
      1: {
        title: "Podés incorporar IA en tareas simples del día a día.",
        description: "Documentación, análisis, research o comunicación interna son buenos puntos de partida."
      },
      2: {
        title: "Te falta método para usarla con más impacto.",
        description: "Ya la probaste, pero sin un flujo estable. Sumá prompts propios y herramientas que te acompañen en discovery y delivery."
      },
      3: {
        title: "Necesitás consolidar un workflow claro.",
        description: "Usás IA en varias tareas, pero todavía no como parte estable de tu proceso. El siguiente paso es estandarizar lo que ya funciona."
      }
    }
  }
] as const;

export type OptionalDomainKey = (typeof OPTIONAL_DOMAINS)[number]["key"];

export type OptionalAssessmentValues = {
  growth?: number;
  ia_aplicada?: number;
};

export type OptionalDomainFeedback = {
  key: OptionalDomainKey;
  label: string;
  value: number;
  title: string;
  description: string;
};

// ============= EVALUACIONES POR PERFIL =============
// Cuatro evaluaciones sobre los mismos dominios. Lo que cambia por perfil es
// el subconjunto de dominios, el ángulo de la pregunta y la escalera de
// opciones: la vara de "qué es un 5" no es la misma para alguien sin
// experiencia, un builder o un líder de equipo.

export type AnyDomainKey = DomainKey | OptionalDomainKey;

export type AnyAssessmentValues = Partial<Record<AnyDomainKey, number>>;

export type AssessmentDomainDef = {
  key: AnyDomainKey;
  label: string;
  description: string;
  question: string;
  statements: ReadonlyArray<{ value: number; label: string }>;
  levelDefinitions: ReadonlyArray<string>;
};

export type AssessmentContext = {
  rolInteres?: "pm" | "diseno" | "dev" | "no_seguro";
  etapa?: "idea" | "mvp" | "usuarios" | "ingresos";
  detalle?: string;
};

export type SuggestedRole = {
  key: "pm" | "diseno" | "dev";
  label: string;
  coincideConInteres: boolean | null;
};

// --- Sin experiencia: mide afinidad y conocimiento teórico, no seniority ---

const SIN_EXPERIENCIA_STATEMENTS = [
  { value: 1, label: "Nunca lo pensé o no sé bien de qué se trata (1)" },
  { value: 2, label: "Tengo una idea vaga, lo escuché o leí alguna vez (2)" },
  { value: 3, label: "Entiendo el concepto y podría explicarlo con mis palabras (3)" },
  { value: 4, label: "Ya lo apliqué en algún proyecto personal, académico o freelance (4)" },
  { value: 5, label: "Me genera mucha curiosidad, es de lo que más me atrae explorar (5)" }
] as const;

const SIN_EXPERIENCIA_LEVELS = [
  "Sin contacto: Todavía no te cruzaste con este tema",
  "Explorando: Lo conocés de oídas y te da curiosidad",
  "Con base: Podés explicar el concepto con tus palabras",
  "Con práctica: Ya lo aplicaste en algún proyecto propio",
  "Alta afinidad: Es de las áreas que más te atraen para profundizar"
] as const;

export const SIN_EXPERIENCIA_DOMAINS: ReadonlyArray<AssessmentDomainDef> = [
  {
    key: "estrategia",
    label: "Estrategia de producto",
    description: "Pensar un producto en términos de visión, objetivos y el problema que resuelve.",
    question: "¿Qué tan familiarizado estás con pensar un producto en términos de visión, objetivo y para quién resuelve un problema?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  },
  {
    key: "discovery",
    label: "Discovery de usuarios",
    description: "Hablar con usuarios para entender sus problemas antes de construir la solución.",
    question: "¿Qué tan cómodo te sentís hablando con usuarios para entender sus problemas antes de proponer una solución?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  },
  {
    key: "analitica",
    label: "Analítica y métricas",
    description: "Usar números y datos para decidir qué hacer con un producto.",
    question: "¿Qué tan natural te resulta pensar en números y datos para decidir qué hacer con un producto?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  },
  {
    key: "ux",
    label: "UX e investigación",
    description: "Cómo se ve, se siente y se usa un producto desde los ojos de quien lo usa.",
    question: "¿Qué tanto te atrae pensar cómo se ve y se usa un producto desde la experiencia de quien lo usa?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  },
  {
    key: "tecnico",
    label: "Conocimiento técnico",
    description: "Entender cómo funciona un producto por dentro, sin necesidad de programar.",
    question: "¿Qué tan cómodo te sentís entendiendo (aunque no programes) cómo funciona algo por dentro, como APIs, bases de datos o lógica?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  },
  {
    key: "ejecucion",
    label: "Ejecución y entregas",
    description: "Llevar una idea desde la intención hasta algo terminado, con pasos y prioridades.",
    question: "¿Qué tan organizado sos para llevar una idea de \"quiero hacer esto\" a \"está hecho\", con pasos y prioridades?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  },
  {
    key: "comunicacion",
    label: "Comunicación y alineación",
    description: "Explicar una idea para que otros la entiendan y se sumen.",
    question: "¿Qué tan cómodo te sentís explicando una idea o un proyecto para que otros lo entiendan y se sumen?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  },
  {
    key: "liderazgo",
    label: "Liderazgo",
    description: "Influir en un grupo o proyecto sin tener el rol formal de líder.",
    question: "¿Qué tanto te pasó ya de influir en un grupo o proyecto sin tener el rol formal de líder?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  },
  {
    key: "roadmap",
    label: "Roadmap y priorización",
    description: "Decidir qué hacer primero cuando hay muchas cosas por hacer y poco tiempo.",
    question: "¿Qué tan natural te resulta priorizar, decidir qué hacer primero cuando hay muchas cosas por hacer y poco tiempo?",
    statements: SIN_EXPERIENCIA_STATEMENTS,
    levelDefinitions: SIN_EXPERIENCIA_LEVELS
  }
];

// --- Builder: mide madurez de método, instinto versus proceso ---

const BUILDER_STATEMENTS = [
  { value: 1, label: "Lo hago a instinto, sin método ni marco de referencia (1)" },
  { value: 2, label: "Conozco algo de teoría pero no la aplico de forma consistente (2)" },
  { value: 3, label: "Aplico un proceso básico, pero sé que me falta profundidad (3)" },
  { value: 4, label: "Tengo un proceso sólido y lo uso de forma consistente en mi producto (4)" },
  { value: 5, label: "Tengo un proceso propio, iterado, que podría enseñarle a otro builder (5)" }
] as const;

const BUILDER_LEVELS = [
  "A instinto: Resolvés sin método y cada decisión arranca de cero",
  "Teoría suelta: Conocés conceptos pero todavía no los bajás a la práctica",
  "Proceso básico: Tenés una forma de trabajar, con espacio para profundizar",
  "Proceso sólido: Aplicás un método consistente en tu producto",
  "Método propio: Iteraste tu proceso al punto de poder enseñarlo"
] as const;

export const BUILDER_DOMAINS: ReadonlyArray<AssessmentDomainDef> = [
  {
    key: "estrategia",
    label: "Estrategia de producto",
    description: "Tener claro y validado el para quién y el por qué de tu producto.",
    question: "¿Qué tan claro y validado tenés el \"para quién\" y \"por qué\" de tu producto?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "discovery",
    label: "Discovery de usuarios",
    description: "Hablar con usuarios reales y validar hipótesis antes de construir.",
    question: "¿Qué tan sistemático es tu proceso para hablar con usuarios reales y validar hipótesis antes de construir?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "ux",
    label: "UX e investigación",
    description: "El flujo de tu producto visto desde la experiencia real de quien lo usa.",
    question: "¿Qué tan trabajado está el flujo de tu producto desde la experiencia real de quien lo usa?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "ejecucion",
    label: "Ejecución y entregas",
    description: "Tu proceso para pasar de idea a feature shippeada.",
    question: "¿Qué tan ordenado es tu proceso para pasar de idea a feature shippeada?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "analitica",
    label: "Analítica y métricas",
    description: "Saber si tu producto funciona, con qué métricas y con qué frecuencia mirarlas.",
    question: "¿Qué tan bien sabés hoy si tu producto está funcionando, con qué métricas y con qué frecuencia las mirás?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "monetizacion",
    label: "Monetización y negocio",
    description: "Cómo tu producto genera o va a generar ingresos.",
    question: "¿Qué tan claro y probado tenés cómo tu producto genera (o va a generar) ingresos?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "growth",
    label: "Growth",
    description: "Tu proceso para conseguir usuarios y clientes nuevos.",
    question: "¿Qué tan sistemático es tu proceso para conseguir usuarios o clientes nuevos?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "tecnico",
    label: "Conocimiento técnico",
    description: "Decisiones de arquitectura, stack y deuda técnica en función del negocio.",
    question: "¿Qué tan bien tomás decisiones técnicas (arquitectura, stack, deuda técnica) en función del negocio y no solo de lo que te resulta cómodo?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "ia_aplicada",
    label: "IA aplicada a Producto",
    description: "Cuánto usás la IA para construir, desde código hasta soporte y contenido.",
    question: "¿Qué tan integrada tenés la IA en tu forma de construir (desde código hasta soporte o contenido)?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  },
  {
    key: "comunicacion",
    label: "Comunicación y alineación",
    description: "Cómo contás tu producto a usuarios, inversores o socios.",
    question: "¿Qué tan clara y convincente es tu forma de contar tu producto a usuarios, inversores o socios?",
    statements: BUILDER_STATEMENTS,
    levelDefinitions: BUILDER_LEVELS
  }
];

// --- Líder: mide la madurez del equipo, no la práctica individual ---

const LIDER_STATEMENTS = [
  { value: 1, label: "Mi equipo no tiene un proceso definido para esto, cada uno lo hace a su manera (1)" },
  { value: 2, label: "Existe una noción básica, pero no está sistematizada ni es pareja en el equipo (2)" },
  { value: 3, label: "Tenemos un proceso definido que seguimos con cierta consistencia (3)" },
  { value: 4, label: "El proceso está bien instalado, documentado, y el equipo lo aplica de forma autónoma (4)" },
  { value: 5, label: "Es una fortaleza distintiva, el equipo innova acá y podría ser referente para otros equipos (5)" }
] as const;

const LIDER_LEVELS = [
  "Sin proceso: Cada persona resuelve a su manera",
  "Incipiente: Hay una noción básica pero despareja",
  "Definido: Existe un proceso que se sigue con cierta consistencia",
  "Instalado: El proceso está documentado y el equipo lo aplica solo",
  "Referente: El equipo innova acá y puede marcar el camino a otros"
] as const;

export const LIDER_DOMAINS: ReadonlyArray<AssessmentDomainDef> = [
  {
    key: "estrategia",
    label: "Estrategia de producto",
    description: "Cuánto entiende tu equipo la estrategia y cómo la traduce al día a día.",
    question: "¿Qué tan bien tu equipo entiende y puede traducir la estrategia de producto en su trabajo del día a día?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "roadmap",
    label: "Roadmap y priorización",
    description: "La madurez del proceso de priorización y roadmap en tu equipo.",
    question: "¿Qué tan maduro es el proceso de priorización y construcción del roadmap en tu equipo?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "discovery",
    label: "Discovery de usuarios",
    description: "La cultura de research y validación con usuarios dentro del equipo.",
    question: "¿Qué tan instalada está la cultura de research y validación con usuarios en tu equipo?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "analitica",
    label: "Analítica y métricas",
    description: "Cómo usa datos tu equipo para decidir, más allá de reportarlos.",
    question: "¿Qué tan bien tu equipo usa datos para tomar decisiones, más allá de reportarlas?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "ejecucion",
    label: "Ejecución y entregas",
    description: "Qué tan predecible y saludable es el proceso de entrega del equipo.",
    question: "¿Qué tan predecible y saludable es el proceso de entrega de tu equipo?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "ux",
    label: "UX e investigación",
    description: "La colaboración entre producto y diseño dentro del equipo.",
    question: "¿Qué tan fluida es la colaboración entre producto y diseño en tu equipo?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "stakeholders",
    label: "Gestión de stakeholders",
    description: "Cómo gestiona el equipo las expectativas de otras áreas.",
    question: "¿Qué tan bien gestiona tu equipo (y vos como líder) las expectativas de stakeholders y otras áreas?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "comunicacion",
    label: "Comunicación y alineación",
    description: "Qué tan alineada está la organización sobre qué se construye y por qué.",
    question: "¿Qué tan alineada está tu organización sobre qué se está construyendo y por qué?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "liderazgo",
    label: "Liderazgo",
    description: "Cuánto invertís en desarrollar el criterio de producto de tu equipo.",
    question: "¿Qué tanto invertís en desarrollar el criterio de producto de tu equipo (coaching, feedback, autonomía)?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  },
  {
    key: "ia_aplicada",
    label: "IA aplicada a Producto",
    description: "Qué tan al día está tu equipo con las formas actuales de construir producto.",
    question: "¿Qué tan actualizado está tu equipo en las formas actuales de construir producto (IA, nuevas herramientas, nuevos métodos)?",
    statements: LIDER_STATEMENTS,
    levelDefinitions: LIDER_LEVELS
  }
];

// --- Metadata de cada evaluación: tarjeta del selector, plan y color ---

export type AssessmentTypeDef = {
  key: AssessmentTypeKey;
  title: string;
  /** Etiqueta corta para admin, filtros y reportes. */
  shortLabel: string;
  persona: string;
  promise: string;
  resultTag: string;
  plan: { key: string; name: string; route: string; ctaLabel: string };
  // Clases visuales por tipo: solo lo que se consume de forma compartida.
  // Las variantes compuestas (hover, gradientes) viven como literales en cada
  // componente porque Tailwind no genera clases armadas dinámicamente.
  accent: {
    hex: string;
    badge: string;
  };
};

export const ASSESSMENT_TYPES: ReadonlyArray<AssessmentTypeDef> = [
  {
    key: "experimentado",
    shortLabel: "Con experiencia",
    title: "Ya trabajo en producto",
    persona: "PM, Designer o Dev con experiencia",
    promise: "Sabé dónde estás parado hoy y qué te separa de tu próximo nivel.",
    resultTag: "Diagnóstico de seniority",
    plan: { key: "repremium", name: "RePremium", route: "/planes", ctaLabel: "Conocer RePremium" },
    accent: {
      hex: "#a855f7",
      badge: "bg-purple-500/15 text-purple-700 dark:text-purple-300 border-purple-500/30"
    }
  },
  {
    key: "sin_experiencia",
    shortLabel: "Dando el salto",
    title: "Quiero dar el salto",
    persona: "Sin experiencia en producto digital",
    promise: "Descubrí tu afinidad con cada área y por dónde te conviene entrar.",
    resultTag: "Mapa de afinidad",
    plan: { key: "premium", name: "Premium", route: "/planes", ctaLabel: "Conocer Premium" },
    accent: {
      hex: "#f59e0b",
      badge: "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30"
    }
  },
  {
    key: "builder",
    shortLabel: "Product Builder",
    title: "Estoy construyendo un producto",
    persona: "Founder o Product Builder",
    promise: "Medí cuánto método hay detrás de lo que estás creando.",
    resultTag: "Madurez de método",
    plan: { key: "productastic_review", name: "Productastic Review", route: "/planes", ctaLabel: "Conocer Productastic Review" },
    accent: {
      hex: "#10b981",
      badge: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30"
    }
  },
  {
    key: "lider",
    shortLabel: "Líder de equipo",
    title: "Lidero un equipo de producto",
    persona: "Manager, Head o Team Lead",
    promise: "Evaluá la madurez de tu equipo y encontrá dónde nivelarlo.",
    resultTag: "Radiografía del equipo",
    plan: { key: "productprepa_business", name: "ProductPrepa for B2B", route: "/empresas", ctaLabel: "Ver ProductPrepa for B2B" },
    accent: {
      hex: "#6366f1",
      badge: "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30"
    }
  }
];

export function getAssessmentTypeDef(type: AssessmentTypeKey | null | undefined): AssessmentTypeDef {
  return ASSESSMENT_TYPES.find((t) => t.key === type) ?? ASSESSMENT_TYPES[0];
}

/** Etiqueta corta del tipo para admin y reportes; sin tipo es una evaluación legacy. */
export function getAssessmentTypeShortLabel(type: AssessmentTypeKey | "legacy" | null | undefined): string {
  return !type || type === "legacy" ? "Legacy" : getAssessmentTypeDef(type).shortLabel;
}

export function getDomainsForType(type: AssessmentTypeKey): ReadonlyArray<AssessmentDomainDef> {
  switch (type) {
    case "sin_experiencia":
      return SIN_EXPERIENCIA_DOMAINS;
    case "builder":
      return BUILDER_DOMAINS;
    case "lider":
      return LIDER_DOMAINS;
    default:
      return DOMAINS;
  }
}

const schemaCache: Partial<Record<AssessmentTypeKey, ReturnType<typeof z.object>>> = {};

export function getAssessmentSchema(type: AssessmentTypeKey) {
  if (type === "experimentado") return assessmentSchema;
  const cached = schemaCache[type];
  if (cached) return cached;
  const typeShape: Record<string, z.ZodNumber> = {};
  for (const d of getDomainsForType(type)) {
    typeShape[d.key] = domainScoreSchema();
  }
  const schema = z.object(typeShape);
  schemaCache[type] = schema;
  return schema;
}

// --- Pregunta de contexto (no puntuada) al final de cada evaluación nueva ---

export type AssessmentContextDef = {
  question: string;
  helper: string;
  optionsField?: "rolInteres" | "etapa";
  options?: ReadonlyArray<{ value: string; label: string }>;
  textLabel?: string;
  textPlaceholder?: string;
};

export const CONTEXT_QUESTIONS: Partial<Record<AssessmentTypeKey, AssessmentContextDef>> = {
  sin_experiencia: {
    question: "¿Qué rol te imaginás probando primero?",
    helper: "No suma ni resta puntaje. Ayuda a orientar la recomendación final.",
    optionsField: "rolInteres",
    options: [
      { value: "pm", label: "Product Manager" },
      { value: "diseno", label: "Diseño de Producto" },
      { value: "dev", label: "Desarrollo" },
      { value: "no_seguro", label: "Todavía no estoy seguro/a" }
    ]
  },
  builder: {
    question: "¿En qué etapa está tu producto?",
    helper: "No afecta tu puntaje. Ordena las prioridades de tu resultado.",
    optionsField: "etapa",
    options: [
      { value: "idea", label: "Idea" },
      { value: "mvp", label: "MVP" },
      { value: "usuarios", label: "Con usuarios" },
      { value: "ingresos", label: "Con ingresos" }
    ],
    textLabel: "Contanos en una línea qué estás construyendo",
    textPlaceholder: "Ej: una app para gestionar turnos de canchas de pádel"
  },
  lider: {
    question: "¿Cómo está formado tu equipo?",
    helper: "No afecta tu puntaje. Da contexto a la recomendación final.",
    textLabel: "Personas a cargo y roles",
    textPlaceholder: "Ej: 6 personas, 2 PMs, 1 diseñadora, 3 devs"
  }
};

/**
 * Etiqueta visible de un valor de contexto (etapa o rol de interés), derivada
 * de las mismas opciones que ve el usuario en el wizard.
 */
export function getContextValueLabel(field: "etapa" | "rolInteres", value: string): string {
  for (const def of Object.values(CONTEXT_QUESTIONS)) {
    if (def.optionsField === field && def.options) {
      const option = def.options.find((o) => o.value === value);
      if (option) return option.label;
    }
  }
  return value;
}

// --- Cómo se muestra el nivel según la evaluación ---
// El bucket numérico es el mismo para todas; el nombre cambia porque no es lo
// mismo seniority individual que afinidad o madurez de equipo.

const NIVEL_DISPLAY: Record<AssessmentTypeKey, { title: string; labels: Record<SeniorityLevel, string> }> = {
  experimentado: {
    title: "Nivel estimado",
    labels: { Junior: "Junior", Mid: "Mid", Senior: "Senior", Lead: "Lead", Head: "Head" }
  },
  sin_experiencia: {
    title: "Afinidad general",
    labels: { Junior: "Explorando", Mid: "Con base", Senior: "Con práctica", Lead: "Alta afinidad", Head: "Alta afinidad" }
  },
  builder: {
    title: "Madurez de método",
    labels: { Junior: "A instinto", Mid: "Proceso incipiente", Senior: "Proceso sólido", Lead: "Método afilado", Head: "Método de referencia" }
  },
  lider: {
    title: "Madurez del equipo",
    labels: { Junior: "Inicial", Mid: "En desarrollo", Senior: "Establecido", Lead: "Avanzado", Head: "Referente" }
  }
};

export function getNivelDisplay(
  type: AssessmentTypeKey | null | undefined,
  nivel: SeniorityLevel
): { title: string; label: string } {
  const display = NIVEL_DISPLAY[type ?? "experimentado"];
  return { title: display.title, label: display.labels[nivel] };
}

// Dominios que más pesan según la etapa declarada por el builder: una brecha
// ahí frena más que el resto y se prioriza primero.
const STAGE_CRITICAL_DOMAINS: Record<NonNullable<AssessmentContext["etapa"]>, ReadonlyArray<AnyDomainKey>> = {
  idea: ["discovery", "estrategia"],
  mvp: ["discovery", "ejecucion", "ux"],
  usuarios: ["analitica", "ux", "growth"],
  ingresos: ["monetizacion", "growth", "analitica"]
};

const ETAPA_LABELS: Record<NonNullable<AssessmentContext["etapa"]>, string> = {
  idea: "idea",
  mvp: "MVP",
  usuarios: "con usuarios",
  ingresos: "con ingresos"
};

const ROLE_AFFINITY: ReadonlyArray<{ key: SuggestedRole["key"]; label: string; domains: ReadonlyArray<AnyDomainKey> }> = [
  { key: "pm", label: "Product Manager", domains: ["estrategia", "roadmap", "comunicacion", "liderazgo"] },
  { key: "diseno", label: "Diseño de Producto", domains: ["ux", "discovery", "comunicacion"] },
  { key: "dev", label: "Desarrollo con mirada de producto", domains: ["tecnico", "ejecucion", "analitica"] }
];

function computeSuggestedRole(values: AnyAssessmentValues, context?: AssessmentContext): SuggestedRole {
  const scored = ROLE_AFFINITY.map((role) => ({
    ...role,
    score: role.domains.reduce((acc, k) => acc + (values[k] ?? 0), 0) / role.domains.length
  })).sort((a, b) => b.score - a.score);

  // Si declaró interés y está cerca del puntaje más alto, su preferencia desempata.
  let top = scored[0];
  const declared = context?.rolInteres;
  if (declared && declared !== "no_seguro") {
    const cercanos = scored.filter((r) => scored[0].score - r.score < 0.2);
    const preferido = cercanos.find((r) => r.key === declared);
    if (preferido) top = preferido;
  }

  return {
    key: top.key,
    label: top.label,
    coincideConInteres: declared && declared !== "no_seguro" ? top.key === declared : null
  };
}

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
  optionalDomains?: OptionalAssessmentValues;
  optionalImprovements?: OptionalDomainFeedback[];
  assessmentType?: AssessmentTypeKey;
  context?: AssessmentContext;
  suggestedRole?: SuggestedRole;
};

export function computeOptionalImprovements(
  optionalValues: OptionalAssessmentValues
): OptionalDomainFeedback[] {
  const improvements: OptionalDomainFeedback[] = [];
  
  for (const domain of OPTIONAL_DOMAINS) {
    const value = optionalValues[domain.key as keyof OptionalAssessmentValues];
    
    // Solo mostrar mejora si respondió 1, 2 o 3
    if (value && value <= 3) {
      const feedback = domain.improvementFeedback[value as 1 | 2 | 3];
      if (feedback) {
        improvements.push({
          key: domain.key as OptionalDomainKey,
          label: domain.label,
          value,
          title: feedback.title,
          description: feedback.description
        });
      }
    }
  }
  
  return improvements;
}

export function computeSeniorityScore(
  values: AnyAssessmentValues,
  optionalValues?: OptionalAssessmentValues,
  assessmentType: AssessmentTypeKey = "experimentado",
  context?: AssessmentContext
): AssessmentResult {
  const domains = getDomainsForType(assessmentType);
  const entries = Object.entries(values).filter(
    ([, v]) => typeof v === "number"
  ) as [AnyDomainKey, number][];
  const sum = entries.reduce((acc, [, v]) => acc + v, 0);
  const n = entries.length || 1;
  const mean = sum / n;
  const promedioGlobal = Number(mean.toFixed(2));

  // Calcular desviación estándar (contra la media sin redondear)
  const variance = entries.reduce((acc, [, v]) => acc + Math.pow(v - mean, 2), 0) / n;
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
    key,
    label: domains.find((d) => d.key === key)?.label ?? key,
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
  let gaps: Gap[] = realGaps
    .sort((a, b) => a.value - b.value)
    .map(g => ({
      ...g,
      prioridad: g.value < 2.5 ? "Alta" : "Media"
    }));

  // Para builders, una brecha en un dominio crítico de su etapa frena más
  // que el resto: sube a prioridad Alta y encabeza la lista.
  if (assessmentType === "builder" && context?.etapa) {
    const criticos = STAGE_CRITICAL_DOMAINS[context.etapa];
    gaps = gaps
      .map((g) => (criticos.includes(g.key) ? { ...g, prioridad: "Alta" as const } : g))
      .sort((a, b) => {
        const aCritico = criticos.includes(a.key) ? 0 : 1;
        const bCritico = criticos.includes(b.key) ? 0 : 1;
        return aCritico - bCritico || a.value - b.value;
      });
  }

  // Identificar especialización (área más fuerte)
  const specialization = all.reduce((prev, current) =>
    current.value > prev.value ? current : prev
  ).label;

  const brechasCriticas = gaps.filter(g => g.prioridad === "Alta").length;
  const suggestedRole =
    assessmentType === "sin_experiencia" ? computeSuggestedRole(values, context) : undefined;

  const bag: EstimateBag = {
    nivel,
    promedio: promedioGlobal,
    desviacion: standardDeviation,
    especializacion: specialization,
    fortalezas: strengths.length,
    brechasCriticas
  };

  let profileEstimate: string;
  let ctaInfo: { text: string; route: string };
  switch (assessmentType) {
    case "sin_experiencia": {
      const topDomains = [...all].sort((a, b) => b.value - a.value).slice(0, 2);
      profileEstimate = generateAffinityEstimate(bag, topDomains, suggestedRole!);
      ctaInfo = generateAffinityCTA(bag);
      break;
    }
    case "builder":
      profileEstimate = generateBuilderEstimate(bag, gaps, context);
      ctaInfo = generateBuilderCTA(bag);
      break;
    case "lider":
      profileEstimate = generateTeamEstimate(bag);
      ctaInfo = generateTeamCTA(bag);
      break;
    default:
      profileEstimate = generateProfileEstimate(
        nivel,
        promedioGlobal,
        standardDeviation,
        specialization,
        strengths.length,
        brechasCriticas
      );
      ctaInfo = generateProfileCTA(
        nivel,
        promedioGlobal,
        standardDeviation,
        specialization,
        strengths.length,
        brechasCriticas
      );
  }

  // Calcular mejoras opcionales si se proporcionaron valores
  const optionalImprovements = optionalValues
    ? computeOptionalImprovements(optionalValues)
    : undefined;

  return {
    promedioGlobal,
    nivel,
    strengths,
    gaps,
    neutralAreas,
    profileEstimate,
    standardDeviation,
    specialization,
    ctaInfo,
    optionalDomains: optionalValues,
    optionalImprovements,
    assessmentType,
    context,
    suggestedRole
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
  const isBalanced = isBalancedProfile(desviacion);
  const hasSpecialization = isSpecializedProfile(desviacion);

  // 3+ brechas críticas
  if (brechasCriticas >= 3) {
    return `Tu perfil está en desarrollo, con alto potencial como Product Builder ${nivel}. Hoy es clave enfocarte en tus áreas críticas antes de dar nuevos pasos. Te conviene construir una base más sólida.`;
  }

  // Equilibrado + 3+ fortalezas
  if (isBalanced && fortalezas >= 3) {
    return `Perfil equilibrado de Product Builder ${nivel}, con bases sólidas y consistentes. Estás bien preparado para asumir desafíos de mayor nivel o responsabilidad. Es un gran momento para avanzar.`;
  }

  // Especializado + Senior/Lead/Head
  if (hasSpecialization) {
    if (nivel === "Senior" || nivel === "Lead" || nivel === "Head") {
      return `Product Builder ${nivel} con especialización marcada en ${especializacion}. Dominás con fuerza tu área, lo que te da un diferencial claro. El próximo salto puede estar en ampliar tu rango de impacto.`;
    } else {
      // Especializado + Junior/Mid
      return `Especialización temprana en ${especializacion}, dentro de un perfil Product Builder ${nivel}. Tenés una fortaleza clara, pero desarrollar una visión más integral va a potenciar mucho tu carrera.`;
    }
  }

  // Promedio ≥ 4.0
  if (promedio >= 4.0) {
    return `Perfil sólido de Product Builder ${nivel}, con muy buena consistencia. Tenés una excelente base para aspirar a más impacto o seniority. Usá esto como trampolín hacia tu próximo rol.`;
  }

  // Promedio ≥ 3.5
  if (promedio >= 3.5) {
    return `Product Builder ${nivel} con buen potencial de crecimiento. Tu perfil tiene varias competencias bien encaminadas. Si enfocás tus esfuerzos en las áreas clave, vas a poder crecer rápido.`;
  }

  // Resto (< 3.5)
  return `Perfil emergente de Product Builder ${nivel}. Este es un buen momento para enfocarte en fortalecer tus fundamentos. Consolidar las bases te va a abrir muchas más puertas.`;
}

function generateProfileCTA(
  nivel: SeniorityLevel,
  promedio: number,
  desviacion: number,
  especializacion: string,
  fortalezas: number,
  brechasCriticas: number
): { text: string; route: string } {
  const isBalanced = isBalancedProfile(desviacion);
  const hasSpecialization = isSpecializedProfile(desviacion);

  // 3+ brechas críticas
  if (brechasCriticas >= 3) {
    return {
      text: "Podés avanzar más rápido con acompañamiento personalizado.",
      route: "/planes"
    };
  }

  // Equilibrado + 3+ fortalezas
  if (isBalanced && fortalezas >= 3) {
    return {
      text: "La mentoría puede ayudarte a definir cuál debería ser ese \"siguiente paso\".",
      route: "/planes"
    };
  }

  // Especializado + Senior/Lead/Head
  if (hasSpecialization) {
    if (nivel === "Senior" || nivel === "Lead" || nivel === "Head") {
      return {
        text: "El plan RePremium te permite trabajar sobre esas áreas complementarias de forma concreta y enfocada.",
        route: "/planes"
      };
    } else {
      // Especializado + Junior/Mid
      return {
        text: "El plan RePremium te puede ayudar a construir ese perfil más balanceado, paso a paso.",
        route: "/planes"
      };
    }
  }

  // Promedio ≥ 4.0
  if (promedio >= 4.0) {
    return {
      text: "La mentoría puede ayudarte a convertir esa base en un diferencial estratégico.",
      route: "/planes"
    };
  }

  // Promedio ≥ 3.5
  if (promedio >= 3.5) {
    return {
      text: "Con el plan RePremium podés acelerar ese proceso con foco y acompañamiento.",
      route: "/planes"
    };
  }

  // Resto (< 3.5)
  return {
    text: "La mentoría puede ayudarte a ordenar ese camino y avanzar con claridad.",
    route: "/planes"
  };
}

// ============= GENERADORES POR EVALUACIÓN =============

type EstimateBag = {
  nivel: SeniorityLevel;
  promedio: number;
  desviacion: number;
  especializacion: string;
  fortalezas: number;
  brechasCriticas: number;
};

// Umbrales de forma de perfil compartidos por todos los generadores: si el
// diagnóstico y su CTA usaran valores distintos podrían contradecirse en la
// misma pantalla.
const isBalancedProfile = (desviacion: number) => desviacion < 0.8;
const isSpecializedProfile = (desviacion: number) => desviacion > 1.2;

// --- Sin experiencia: mapa de afinidad y rol de entrada sugerido ---

function generateAffinityEstimate(
  bag: EstimateBag,
  topDomains: DomainScore[],
  rol: SuggestedRole
): string {
  const [top1, top2] = topDomains;
  const zonas = top2 ? `${top1.label} y ${top2.label}` : top1?.label ?? "varias áreas";
  const coincidencia =
    rol.coincideConInteres === true
      ? " Coincide con el rol que tenías en mente, buena señal."
      : rol.coincideConInteres === false
        ? " Es distinto del rol que tenías en mente: vale la pena explorarlo antes de decidir."
        : "";

  if (bag.promedio >= 3.5) {
    return `Tenés más terreno ganado del que probablemente creés. Tus respuestas muestran base y curiosidad en ${zonas}, dos puntos de apoyo concretos para arrancar. El perfil de entrada que mejor se ajusta a tu combinación es ${rol.label}.${coincidencia}`;
  }
  if (bag.promedio >= 2.5) {
    return `Ya tenés puntos de apoyo claros, sobre todo en ${zonas}. Te falta vocabulario y práctica en el resto, algo que se resuelve con un plan de estudio ordenado. El perfil de entrada que mejor se ajusta hoy es ${rol.label}.${coincidencia}`;
  }
  return `Estás arrancando casi de cero, y eso no es un problema: este mapa muestra por dónde te conviene empezar. Tu afinidad más clara está en ${zonas}, un buen primer foco. Como perfil de entrada, ${rol.label} es el que mejor se ajusta a tus respuestas.${coincidencia}`;
}

function generateAffinityCTA(bag: EstimateBag): { text: string; route: string } {
  const route = "/planes";
  if (bag.promedio >= 3.5) {
    return {
      text: "El plan Premium te ayuda a convertir esa base en tu primer rol en producto, con un plan concreto y acompañamiento.",
      route
    };
  }
  if (bag.promedio >= 2.5) {
    return {
      text: "Con el plan Premium convertís esa afinidad en un plan de estudio concreto, con recursos y acompañamiento.",
      route
    };
  }
  return {
    text: "El plan Premium te ordena el camino desde cero: la base teórica, los recursos y el acompañamiento para dar el salto.",
    route
  };
}

// --- Builder: madurez de método, con la etapa del producto como lente ---

function generateBuilderEstimate(bag: EstimateBag, gaps: Gap[], context?: AssessmentContext): string {
  const etapa = context?.etapa;
  const gapDeEtapa = etapa
    ? gaps.find((g) => STAGE_CRITICAL_DOMAINS[etapa].includes(g.key))
    : undefined;
  const notaEtapa =
    etapa && gapDeEtapa
      ? ` Para la etapa en la que estás (${ETAPA_LABELS[etapa]}), ${gapDeEtapa.label} es la brecha que más te frena hoy.`
      : "";

  const isBalanced = isBalancedProfile(bag.desviacion);
  const hasSpecialization = isSpecializedProfile(bag.desviacion);

  if (bag.brechasCriticas >= 3) {
    return `Estás construyendo a pura intuición en varias áreas clave. Para arrancar alcanza, pero ya estás en el punto donde el método te ahorra meses de prueba y error.${notaEtapa}`;
  }
  if (isBalanced && bag.fortalezas >= 3) {
    return `Tenés un método más maduro que el de la mayoría de los builders: tu proceso es consistente en casi todos los frentes. El próximo salto está en los detalles finos y en validar el producto en sí.${notaEtapa}`;
  }
  if (hasSpecialization) {
    if (bag.promedio >= 3.2) {
      return `Tu proceso en ${bag.especializacion} está muy por encima del resto. Esa asimetría es común: se profundiza donde se disfruta. Emparejar el método en las áreas relegadas te va a rendir más que seguir afilando tu punto fuerte.${notaEtapa}`;
    }
    return `Ya construiste método en ${bag.especializacion}, y eso demuestra que podés hacerlo en el resto. Las otras áreas todavía corren a pura intuición.${notaEtapa}`;
  }
  if (bag.promedio >= 4.0) {
    return `Construís con un método sólido y consistente. Lo que sigue no es más teoría: es una mirada externa sobre el producto que estás haciendo con esa base.${notaEtapa}`;
  }
  if (bag.promedio >= 3.5) {
    return `Tu método va tomando forma: hay proceso en varias áreas y todavía intuición en otras. Con foco en las brechas correctas, nivelás rápido.${notaEtapa}`;
  }
  return `Hoy estás construyendo más con intuición que con método. Es lo normal al principio, y también lo más caro de sostener: cada decisión arranca de cero. La teoría aplicada a tu producto te ahorra iteraciones.${notaEtapa}`;
}

function generateBuilderCTA(bag: EstimateBag): { text: string; route: string } {
  const route = "/planes";
  if (bag.brechasCriticas >= 3) {
    return {
      text: "Una revisión externa de tu producto te muestra exactamente dónde el método te está faltando. Eso es Productastic Review.",
      route
    };
  }
  if (bag.promedio >= 4.0) {
    return {
      text: "El siguiente paso es feedback concreto sobre tu producto: una Productastic Review a fondo, con devolución accionable.",
      route
    };
  }
  if (bag.promedio >= 3.5) {
    return {
      text: "Productastic Review te marca en qué parte de tu producto aplicar la teoría que te falta, sin vueltas.",
      route
    };
  }
  return {
    text: "Productastic Review revisa tu producto de punta a punta y te dice por dónde empezar a ordenar el método.",
    route
  };
}

// --- Líder: diagnóstico del equipo, hablado en función del equipo ---

function generateTeamEstimate(bag: EstimateBag): string {
  const isBalanced = isBalancedProfile(bag.desviacion);
  const hasSpecialization = isSpecializedProfile(bag.desviacion);

  if (bag.brechasCriticas >= 3) {
    return "El diagnóstico muestra varios frentes donde el equipo todavía trabaja sin un proceso común. Antes de sumar herramientas o frameworks nuevos, conviene nivelar la base: pocas prácticas, bien instaladas.";
  }
  if (isBalanced && bag.fortalezas >= 3) {
    return "Tu equipo muestra una madurez pareja y sólida en la mayoría de los dominios. Con esa base, el salto está en actualizar la forma de trabajo a cómo se construye producto hoy.";
  }
  if (hasSpecialization) {
    if (bag.promedio >= 3.2) {
      return `Tu equipo destaca con fuerza en ${bag.especializacion}, bastante por encima del resto. Esa asimetría suele indicar prácticas que dependen de personas puntuales más que de un proceso instalado.`;
    }
    return `El equipo ya construyó una práctica clara en ${bag.especializacion}. Ese mismo camino se puede repetir en los dominios que hoy quedaron atrás.`;
  }
  if (bag.promedio >= 4.0) {
    return "El equipo opera con procesos maduros y consistentes. El foco ahora está en sostenerlos y mantenerse actualizado, más que en construir desde cero.";
  }
  if (bag.promedio >= 3.5) {
    return "El equipo tiene procesos definidos en buena parte de los dominios, con margen para instalarlos de forma más pareja entre las personas.";
  }
  return "El equipo todavía descansa más en el esfuerzo individual que en procesos compartidos. Es el punto de partida más común, y el que más rápido mejora con un programa estructurado.";
}

function generateTeamCTA(bag: EstimateBag): { text: string; route: string } {
  const route = "/empresas";
  const isBalanced = isBalancedProfile(bag.desviacion);
  const hasSpecialization = isSpecializedProfile(bag.desviacion);

  if (bag.brechasCriticas >= 3) {
    return {
      text: "Tu equipo todavía tiene procesos de producto poco parejos entre sus miembros. ProductPrepa for B2B les da una base común antes de escalar.",
      route
    };
  }
  if (isBalanced && bag.fortalezas >= 3) {
    return {
      text: "Tu equipo ya tiene un nivel sólido y consistente en la mayoría de los dominios. Con ProductPrepa for B2B pueden llevar ese nivel a la forma en que se construye producto hoy.",
      route
    };
  }
  if (hasSpecialization) {
    if (bag.promedio >= 3.2) {
      return {
        text: `Tu equipo tiene un punto fuerte marcado en ${bag.especializacion}, pero hay dominios más atrasados. ProductPrepa for B2B ayuda a emparejar ese nivel entre todos.`,
        route
      };
    }
    return {
      text: `Tu equipo ya mostró una fortaleza clara en ${bag.especializacion}. ProductPrepa for B2B les da el resto de las bases para que ese criterio sea compartido por todos.`,
      route
    };
  }
  if (bag.promedio >= 4.0) {
    return {
      text: "Tu equipo tiene una base fuerte de producto. ProductPrepa for B2B convierte esa base en una ventaja concreta frente a otros equipos.",
      route
    };
  }
  if (bag.promedio >= 3.5) {
    return {
      text: "Tu equipo va en buen camino. Con ProductPrepa for B2B pueden acelerar ese proceso con un plan pensado para todo el grupo.",
      route
    };
  }
  return {
    text: "ProductPrepa for B2B les da un punto de partida claro para nivelar a tu equipo, con foco en lo que hoy más lo necesita.",
    route
  };
}
