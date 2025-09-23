import { z } from "zod";

export type SeniorityLevel = "Junior" | "Mid" | "Senior" | "Lead" | "Head";

export const DOMAINS = [
  { 
    key: "estrategia", 
    label: "Estrategia de producto",
    description: "Capacidad para definir visión, objetivos estratégicos y roadmap de largo plazo del producto.",
    diagnosticQuestion: "¿Tu equipo tiene una visión de producto clara y documentada?",
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

  return { 
    promedioGlobal, 
    nivel, 
    strengths, 
    gaps, 
    neutralAreas,
    profileEstimate,
    standardDeviation,
    specialization
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

  if (brechasCriticas >= 3) {
    return `Perfil en desarrollo con potencial ${nivel}. Se recomienda enfocarse en las áreas críticas antes de avanzar.`;
  }

  if (isBalanced && fortalezas >= 3) {
    return `Perfil equilibrado de PM ${nivel} con competencias sólidas en todas las áreas. Listo para el siguiente nivel.`;
  }

  if (hasSpecialization) {
    if (nivel === "Senior" || nivel === "Lead" || nivel === "Head") {
      return `Perfil especializado de PM ${nivel} con dominio destacado en ${especializacion}. Considera desarrollar áreas complementarias.`;
    } else {
      return `Perfil con especialización temprana en ${especializacion}. Desarrolla competencias generales para un perfil más balanceado de PM ${nivel}.`;
    }
  }

  if (promedio >= 4.0) {
    return `Perfil sólido de PM ${nivel} con consistencia en la mayoría de áreas. Excelente base para roles de mayor responsabilidad.`;
  }

  if (promedio >= 3.5) {
    return `Perfil competente de PM ${nivel} con buen potencial de crecimiento. Algunas áreas clave necesitan desarrollo adicional.`;
  }

  return `Perfil emergente de PM ${nivel}. Enfócate en desarrollar las competencias fundamentales para consolidar tu nivel actual.`;
}
