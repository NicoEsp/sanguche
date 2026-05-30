import type { CanvasStage, ProgressObjective } from "@/types/progress";
import type { UserProgressObjective } from "@/hooks/useUserProgressObjectives";

export interface StageConfig {
  key: CanvasStage;
  label: string;
  description: string;
  gradient: string;
}

export const STAGES: StageConfig[] = [
  {
    key: "now",
    label: "En foco",
    description: "Acciones inmediatas para impulsar tu crecimiento",
    gradient: "from-primary/20 via-primary/5 to-transparent",
  },
  {
    key: "soon",
    label: "Próximos pasos",
    description: "Metas para los próximos 60-90 días",
    gradient: "from-amber-200/40 via-amber-100/40 to-transparent",
  },
  {
    key: "later",
    label: "Visión",
    description: "Hitos estratégicos para tu carrera a largo plazo",
    gradient: "from-emerald-200/40 via-emerald-100/30 to-transparent",
  },
];

export type StageObjectivesMap = Record<CanvasStage, UserProgressObjective[]>;

export type AvailableObjective = {
  id: string;
  title: string;
  summary: string;
  type: string;
  steps?: Array<{ id: string; title: string; completed: boolean }>;
  source?: string | null;
  dueDate?: string | null;
  due_date?: string | null;
};

export interface AddCustomObjectiveState {
  title: string;
  summary: string;
  type: string;
  timeframe: CanvasStage;
  dueDate?: Date;
  stepsText: string;
}

export const OBJECTIVE_TYPE_OPTIONS = [
  "Habilidad técnica",
  "Proyecto",
  "Aprendizaje",
  "Hito",
] as const;

export const OTHER_TYPE_SENTINEL = "__other__";
export const CUSTOM_TYPE_MAX_LENGTH = 30;

export const isPresetObjectiveType = (value: string) =>
  (OBJECTIVE_TYPE_OPTIONS as readonly string[]).includes(value);

export const initialCustomState: AddCustomObjectiveState = {
  title: "",
  summary: "",
  type: OBJECTIVE_TYPE_OPTIONS[0],
  timeframe: "soon",
  dueDate: undefined,
  stepsText: "",
};

export const MAX_CUSTOM_OBJECTIVES = 3;

const longDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
});

export const formatDueDate = (date?: string) => {
  if (!date) return "Sin fecha";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Sin fecha";
  }
  return longDateFormatter.format(parsed);
};

export const getObjectiveDueDate = (objective: AvailableObjective) => {
  if ("due_date" in objective) {
    return objective.due_date ?? undefined;
  }
  return objective.dueDate;
};

export const isCompleted = (objective: ProgressObjective | UserProgressObjective) => {
  if (objective.steps.length > 0) {
    return objective.steps.every((step) => step.completed);
  }
  return objective.status === "completed";
};
