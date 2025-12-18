import { DomainKey, SeniorityLevel } from "./scoring";

export interface RecommendedObjectiveTemplate {
  key: string;                                 // Unique ID: "discovery_junior_1"
  domainKey: DomainKey;                        // Assessment domain
  targetLevels: SeniorityLevel[];              // Which levels this applies to
  title: string;
  summary: string;
  type: string;
  suggestedTimeframe: "now" | "soon" | "later";
  steps: Array<{ title: string }>;
  priority: number;                            // Lower = higher priority
}

// Map seniority levels to simpler categories for objective matching
export function getObjectiveTargetLevel(nivel: SeniorityLevel): "junior" | "mid" | "senior" {
  switch (nivel) {
    case "Junior":
      return "junior";
    case "Mid":
      return "mid";
    case "Senior":
    case "Lead":
    case "Head":
      return "senior";
    default:
      return "mid";
  }
}

export const RECOMMENDED_OBJECTIVES: RecommendedObjectiveTemplate[] = [
  // ============= DISCOVERY =============
  {
    key: "discovery_junior_1",
    domainKey: "discovery",
    targetLevels: ["Junior"],
    title: "Realizar tu primera entrevista de usuario",
    summary: "Dominar las bases del discovery mediante práctica guiada",
    type: "Habilidad técnica",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Leer guía de entrevistas de usuario" },
      { title: "Preparar script de 5 preguntas abiertas" },
      { title: "Coordinar primera entrevista con usuario real" },
      { title: "Documentar insights y aprendizajes" }
    ]
  },
  {
    key: "discovery_mid_1",
    domainKey: "discovery",
    targetLevels: ["Mid"],
    title: "Sistematizar proceso de discovery",
    summary: "Crear un proceso repetible para validar hipótesis de producto",
    type: "Proceso",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Definir cadencia de entrevistas (semanal/quincenal)" },
      { title: "Crear repositorio de insights accesible al equipo" },
      { title: "Documentar 3 hipótesis validadas/invalidadas" },
      { title: "Compartir aprendizajes en una sesión con el equipo" }
    ]
  },
  {
    key: "discovery_senior_1",
    domainKey: "discovery",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Escalar cultura de discovery en el equipo",
    summary: "Implementar prácticas de discovery continuo a nivel organizacional",
    type: "Liderazgo",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Capacitar al equipo en técnicas de entrevista" },
      { title: "Crear framework de priorización de research" },
      { title: "Establecer métricas de efectividad del discovery" },
      { title: "Liderar quarterly review de insights" }
    ]
  },

  // ============= ESTRATEGIA =============
  {
    key: "estrategia_junior_1",
    domainKey: "estrategia",
    targetLevels: ["Junior"],
    title: "Comprender la estrategia de tu producto",
    summary: "Entender cómo tu trabajo diario conecta con los objetivos de negocio",
    type: "Conocimiento",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Identificar los 3 OKRs principales del producto" },
      { title: "Mapear cómo tu feature actual aporta a esos objetivos" },
      { title: "Hacer preguntas estratégicas en la próxima planning" },
      { title: "Documentar tu entendimiento y validarlo con tu lead" }
    ]
  },
  {
    key: "estrategia_mid_1",
    domainKey: "estrategia",
    targetLevels: ["Mid"],
    title: "Proponer una iniciativa estratégica",
    summary: "Desarrollar capacidad de pensamiento estratégico proactivo",
    type: "Habilidad técnica",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Identificar oportunidad no explotada en tu producto" },
      { title: "Preparar análisis de impacto vs esfuerzo" },
      { title: "Crear one-pager con propuesta y métricas de éxito" },
      { title: "Presentar la propuesta a stakeholders" }
    ]
  },
  {
    key: "estrategia_senior_1",
    domainKey: "estrategia",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Liderar definición de estrategia de producto",
    summary: "Guiar al equipo en la creación de visión y estrategia",
    type: "Liderazgo",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Facilitar workshop de visión con stakeholders clave" },
      { title: "Documentar estrategia de producto para próximos 12 meses" },
      { title: "Alinear roadmap con objetivos estratégicos" },
      { title: "Comunicar estrategia a toda la organización" }
    ]
  },

  // ============= ROADMAP =============
  {
    key: "roadmap_junior_1",
    domainKey: "roadmap",
    targetLevels: ["Junior"],
    title: "Dominar frameworks de priorización",
    summary: "Aprender a evaluar y priorizar features de forma estructurada",
    type: "Habilidad técnica",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Estudiar RICE, MoSCoW e Impact/Effort" },
      { title: "Aplicar un framework a tu backlog actual" },
      { title: "Documentar el proceso de decisión" },
      { title: "Presentar priorización y recibir feedback" }
    ]
  },
  {
    key: "roadmap_mid_1",
    domainKey: "roadmap",
    targetLevels: ["Mid"],
    title: "Crear roadmap de 6 meses",
    summary: "Desarrollar visión de mediano plazo para tu área de producto",
    type: "Proceso",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Mapear dependencias con otros equipos" },
      { title: "Definir milestones trimestrales" },
      { title: "Crear versión visual del roadmap" },
      { title: "Comunicar roadmap a stakeholders" }
    ]
  },
  {
    key: "roadmap_senior_1",
    domainKey: "roadmap",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Coordinar roadmap multi-equipo",
    summary: "Alinear prioridades entre múltiples squads y áreas",
    type: "Liderazgo",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Mapear interdependencias entre equipos" },
      { title: "Facilitar sesión de alineación cross-team" },
      { title: "Crear proceso de actualización de roadmap" },
      { title: "Establecer cadencia de revisión trimestral" }
    ]
  },

  // ============= EJECUCIÓN =============
  {
    key: "ejecucion_junior_1",
    domainKey: "ejecucion",
    targetLevels: ["Junior"],
    title: "Mejorar tus specs y documentación",
    summary: "Crear documentación clara que facilite el trabajo del equipo",
    type: "Habilidad técnica",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Estudiar templates de PRD efectivos" },
      { title: "Escribir spec detallada para próxima feature" },
      { title: "Incluir criterios de aceptación claros" },
      { title: "Obtener feedback del equipo de desarrollo" }
    ]
  },
  {
    key: "ejecucion_mid_1",
    domainKey: "ejecucion",
    targetLevels: ["Mid"],
    title: "Optimizar ciclo de delivery",
    summary: "Identificar y eliminar cuellos de botella en el proceso de entrega",
    type: "Proceso",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Medir lead time actual del equipo" },
      { title: "Identificar top 3 bloqueos recurrentes" },
      { title: "Implementar mejora en una ceremonia ágil" },
      { title: "Medir impacto de la mejora" }
    ]
  },
  {
    key: "ejecucion_senior_1",
    domainKey: "ejecucion",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Escalar procesos de delivery",
    summary: "Implementar mejoras de proceso a nivel organizacional",
    type: "Liderazgo",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Documentar best practices del equipo" },
      { title: "Crear playbook de delivery para nuevos PMs" },
      { title: "Implementar métricas de performance cross-team" },
      { title: "Liderar retrospectiva organizacional" }
    ]
  },

  // ============= ANALÍTICA =============
  {
    key: "analitica_junior_1",
    domainKey: "analitica",
    targetLevels: ["Junior"],
    title: "Crear tu primer dashboard de producto",
    summary: "Aprender a medir y visualizar métricas clave",
    type: "Habilidad técnica",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Identificar 3-5 métricas clave de tu feature" },
      { title: "Aprender a usar herramienta de analytics" },
      { title: "Crear dashboard con métricas principales" },
      { title: "Presentar insights del dashboard al equipo" }
    ]
  },
  {
    key: "analitica_mid_1",
    domainKey: "analitica",
    targetLevels: ["Mid"],
    title: "Implementar framework de métricas",
    summary: "Estructurar medición de producto de forma sistemática",
    type: "Proceso",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Definir North Star Metric del producto" },
      { title: "Crear árbol de métricas (input/output)" },
      { title: "Establecer targets y alertas" },
      { title: "Implementar revisión semanal de métricas" }
    ]
  },
  {
    key: "analitica_senior_1",
    domainKey: "analitica",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Crear cultura data-driven",
    summary: "Implementar toma de decisiones basada en datos a escala",
    type: "Liderazgo",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Capacitar al equipo en análisis de datos" },
      { title: "Implementar experimentos con significancia estadística" },
      { title: "Crear proceso de documentación de learnings" },
      { title: "Establecer data review mensual" }
    ]
  },

  // ============= COMUNICACIÓN =============
  {
    key: "comunicacion_junior_1",
    domainKey: "comunicacion",
    targetLevels: ["Junior"],
    title: "Mejorar tus presentaciones de producto",
    summary: "Desarrollar habilidades de comunicación efectiva",
    type: "Habilidad técnica",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Estudiar estructura de presentaciones efectivas" },
      { title: "Preparar demo de tu próxima feature" },
      { title: "Practicar con un colega y pedir feedback" },
      { title: "Presentar en la próxima sesión de equipo" }
    ]
  },
  {
    key: "comunicacion_mid_1",
    domainKey: "comunicacion",
    targetLevels: ["Mid"],
    title: "Crear narrativa de producto",
    summary: "Desarrollar storytelling que genere alineación",
    type: "Habilidad técnica",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Escribir narrativa de visión de tu producto" },
      { title: "Crear presentación ejecutiva de roadmap" },
      { title: "Adaptar comunicación para diferentes audiencias" },
      { title: "Medir efectividad con feedback 360" }
    ]
  },
  {
    key: "comunicacion_senior_1",
    domainKey: "comunicacion",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Establecer estándares de comunicación",
    summary: "Crear frameworks de comunicación organizacionales",
    type: "Liderazgo",
    suggestedTimeframe: "later",
    priority: 3,
    steps: [
      { title: "Documentar templates de comunicación" },
      { title: "Crear guía de storytelling de producto" },
      { title: "Implementar all-hands de producto" },
      { title: "Mentorear a otros PMs en comunicación" }
    ]
  },

  // ============= STAKEHOLDERS =============
  {
    key: "stakeholders_junior_1",
    domainKey: "stakeholders",
    targetLevels: ["Junior"],
    title: "Mapear y conocer a tus stakeholders",
    summary: "Entender quiénes son y qué necesitan tus stakeholders",
    type: "Conocimiento",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Crear mapa de stakeholders de tu producto" },
      { title: "Agendar 1:1 con cada stakeholder clave" },
      { title: "Documentar necesidades y expectativas" },
      { title: "Definir cadencia de comunicación con cada uno" }
    ]
  },
  {
    key: "stakeholders_mid_1",
    domainKey: "stakeholders",
    targetLevels: ["Mid"],
    title: "Gestionar expectativas proactivamente",
    summary: "Anticipar y resolver conflictos de intereses",
    type: "Habilidad técnica",
    suggestedTimeframe: "now",
    priority: 1,
    steps: [
      { title: "Identificar conflictos potenciales de prioridades" },
      { title: "Preparar propuesta de resolución" },
      { title: "Facilitar conversación de alineación" },
      { title: "Documentar acuerdos y compromisos" }
    ]
  },
  {
    key: "stakeholders_senior_1",
    domainKey: "stakeholders",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Construir alianzas estratégicas",
    summary: "Desarrollar influencia a nivel organizacional",
    type: "Liderazgo",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Identificar sponsors ejecutivos clave" },
      { title: "Crear plan de relacionamiento estratégico" },
      { title: "Liderar iniciativa cross-funcional" },
      { title: "Medir satisfacción de stakeholders senior" }
    ]
  },

  // ============= UX =============
  {
    key: "ux_junior_1",
    domainKey: "ux",
    targetLevels: ["Junior"],
    title: "Participar activamente en diseño UX",
    summary: "Colaborar más efectivamente con el equipo de diseño",
    type: "Habilidad técnica",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Asistir y participar en sesiones de diseño" },
      { title: "Aprender a dar feedback constructivo de UX" },
      { title: "Conducir test de usabilidad simple" },
      { title: "Documentar insights de usabilidad" }
    ]
  },
  {
    key: "ux_mid_1",
    domainKey: "ux",
    targetLevels: ["Mid"],
    title: "Liderar iniciativa de mejora UX",
    summary: "Impulsar mejoras de experiencia basadas en datos",
    type: "Proceso",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Analizar métricas de usabilidad actuales" },
      { title: "Identificar top 3 fricciones de usuario" },
      { title: "Co-crear soluciones con equipo de UX" },
      { title: "Medir impacto de mejoras implementadas" }
    ]
  },
  {
    key: "ux_senior_1",
    domainKey: "ux",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Instalar prácticas de diseño centrado en usuario",
    summary: "Escalar metodologías de UX en la organización",
    type: "Liderazgo",
    suggestedTimeframe: "later",
    priority: 3,
    steps: [
      { title: "Definir estándares de UX para el equipo" },
      { title: "Implementar design reviews estructurados" },
      { title: "Crear métricas de experiencia de usuario" },
      { title: "Facilitar workshops de design thinking" }
    ]
  },

  // ============= TÉCNICO =============
  {
    key: "tecnico_junior_1",
    domainKey: "tecnico",
    targetLevels: ["Junior"],
    title: "Mejorar tu comprensión técnica",
    summary: "Entender mejor la tecnología detrás de tu producto",
    type: "Conocimiento",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Pedir walkthrough técnico de arquitectura" },
      { title: "Aprender a leer logs y métricas técnicas" },
      { title: "Participar en sesiones de refinement técnico" },
      { title: "Documentar glosario técnico del producto" }
    ]
  },
  {
    key: "tecnico_mid_1",
    domainKey: "tecnico",
    targetLevels: ["Mid"],
    title: "Participar en decisiones técnicas",
    summary: "Contribuir activamente en trade-offs técnicos",
    type: "Habilidad técnica",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Participar en próxima decisión de arquitectura" },
      { title: "Preparar análisis de impacto técnico en producto" },
      { title: "Documentar trade-offs y decisión final" },
      { title: "Comunicar decisión técnica a stakeholders" }
    ]
  },
  {
    key: "tecnico_senior_1",
    domainKey: "tecnico",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Influir en estrategia técnica",
    summary: "Contribuir a decisiones de arquitectura a largo plazo",
    type: "Liderazgo",
    suggestedTimeframe: "later",
    priority: 3,
    steps: [
      { title: "Participar en tech strategy planning" },
      { title: "Aportar perspectiva de producto en deuda técnica" },
      { title: "Alinear roadmap técnico con producto" },
      { title: "Facilitar comunicación producto-engineering" }
    ]
  },

  // ============= LIDERAZGO =============
  {
    key: "liderazgo_junior_1",
    domainKey: "liderazgo",
    targetLevels: ["Junior"],
    title: "Liderar tu primer proyecto",
    summary: "Desarrollar habilidades de liderazgo desde el primer rol",
    type: "Habilidad técnica",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Identificar pequeña iniciativa para liderar" },
      { title: "Definir objetivos y plan de acción" },
      { title: "Coordinar con otros miembros del equipo" },
      { title: "Presentar resultados y aprendizajes" }
    ]
  },
  {
    key: "liderazgo_mid_1",
    domainKey: "liderazgo",
    targetLevels: ["Mid"],
    title: "Mentorear a un colega junior",
    summary: "Desarrollar habilidades de mentoría y coaching",
    type: "Liderazgo",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Identificar colega que podría beneficiarse" },
      { title: "Establecer cadencia de 1:1 mensuales" },
      { title: "Compartir frameworks y recursos útiles" },
      { title: "Pedir feedback sobre tu mentoría" }
    ]
  },
  {
    key: "liderazgo_senior_1",
    domainKey: "liderazgo",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Desarrollar cultura de producto",
    summary: "Influir en cómo la organización piensa sobre producto",
    type: "Liderazgo",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Documentar principios de producto del equipo" },
      { title: "Crear programa de onboarding para nuevos PMs" },
      { title: "Facilitar guild o comunidad de práctica" },
      { title: "Medir engagement y satisfacción del equipo" }
    ]
  },

  // ============= MONETIZACIÓN =============
  {
    key: "monetizacion_junior_1",
    domainKey: "monetizacion",
    targetLevels: ["Junior"],
    title: "Entender el modelo de negocio",
    summary: "Comprender cómo tu producto genera valor económico",
    type: "Conocimiento",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Investigar modelo de revenue del producto" },
      { title: "Identificar métricas financieras clave" },
      { title: "Mapear cómo tu feature impacta revenue" },
      { title: "Presentar análisis a tu lead" }
    ]
  },
  {
    key: "monetizacion_mid_1",
    domainKey: "monetizacion",
    targetLevels: ["Mid"],
    title: "Proponer mejora de monetización",
    summary: "Identificar oportunidades de optimización de revenue",
    type: "Habilidad técnica",
    suggestedTimeframe: "soon",
    priority: 2,
    steps: [
      { title: "Analizar funnel de conversión actual" },
      { title: "Identificar oportunidad de optimización" },
      { title: "Diseñar experimento de pricing/conversión" },
      { title: "Medir y presentar resultados" }
    ]
  },
  {
    key: "monetizacion_senior_1",
    domainKey: "monetizacion",
    targetLevels: ["Senior", "Lead", "Head"],
    title: "Definir estrategia de monetización",
    summary: "Diseñar modelo de negocio sostenible a largo plazo",
    type: "Estrategia",
    suggestedTimeframe: "later",
    priority: 3,
    steps: [
      { title: "Analizar landscape competitivo de pricing" },
      { title: "Proponer evolución del modelo de negocio" },
      { title: "Crear business case con proyecciones" },
      { title: "Presentar a liderazgo ejecutivo" }
    ]
  }
];

/**
 * Get recommended objectives for a user based on their assessment
 */
export function getObjectivesForDomain(
  domainKey: DomainKey, 
  userLevel: SeniorityLevel
): RecommendedObjectiveTemplate[] {
  return RECOMMENDED_OBJECTIVES.filter(obj => 
    obj.domainKey === domainKey && 
    obj.targetLevels.includes(userLevel)
  );
}

/**
 * Get domain label for display
 */
export function getDomainLabel(domainKey: DomainKey): string {
  const domainLabels: Record<DomainKey, string> = {
    estrategia: "Estrategia de producto",
    roadmap: "Roadmap y priorización",
    ejecucion: "Ejecución y entregas",
    discovery: "Discovery de usuarios",
    analitica: "Analítica y métricas",
    comunicacion: "Comunicación y alineación",
    stakeholders: "Gestión de stakeholders",
    ux: "UX e investigación",
    tecnico: "Conocimiento técnico",
    liderazgo: "Liderazgo",
    monetizacion: "Monetización y negocio"
  };
  return domainLabels[domainKey] || domainKey;
}
