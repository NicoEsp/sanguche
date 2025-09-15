import { z } from "zod";

export type SeniorityLevel = "Junior" | "Mid" | "Senior" | "Lead" | "Head";

export const DOMAINS = [
  { key: "estrategia", label: "Estrategia de producto" },
  { key: "roadmap", label: "Roadmap y priorización" },
  { key: "ejecucion", label: "Ejecución y entregas" },
  { key: "discovery", label: "Discovery de usuarios" },
  { key: "analitica", label: "Analítica y métricas" },
  { key: "ux", label: "UX e investigación" },
  { key: "stakeholders", label: "Gestión de stakeholders" },
  { key: "comunicacion", label: "Comunicación y alineación" },
  { key: "liderazgo", label: "Liderazgo" },
  { key: "tecnico", label: "Conocimiento técnico" },
  { key: "monetizacion", label: "Monetización y negocio" },
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

export type Gap = DomainScore & { prioridad: "Alta" | "Media" | "Baja" };

export type AssessmentResult = {
  promedioGlobal: number;
  nivel: SeniorityLevel;
  strengths: DomainScore[];
  gaps: Gap[];
};

export function computeSeniorityScore(values: AssessmentValues): AssessmentResult {
  const entries = Object.entries(values) as [keyof AssessmentValues, number][];
  const sum = entries.reduce((acc, [, v]) => acc + v, 0);
  const n = entries.length || 1;
  const promedioGlobal = Number((sum / n).toFixed(2));

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

  const strengths = [...all].sort((a, b) => b.value - a.value).slice(0, 3);

  const gapsBase = [...all].sort((a, b) => a.value - b.value).slice(0, 3);
  const gaps: Gap[] = gapsBase.map((g) => ({
    ...g,
    prioridad: g.value <= 2.5 ? "Alta" : g.value <= 3.5 ? "Media" : "Baja",
  }));

  return { promedioGlobal, nivel, strengths, gaps };
}
