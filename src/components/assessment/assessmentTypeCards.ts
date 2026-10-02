import { Compass, Hammer, Rocket, Users, type LucideIcon } from "lucide-react";
import {
  AssessmentTypeKey,
  CONTEXT_QUESTIONS,
  OPTIONAL_DOMAINS,
  getDomainsForType
} from "@/utils/scoring";

// Lo comparten el selector de /autoevaluacion y el estado vacío de /mejoras:
// las dos muestran las mismas cuatro tarjetas y tienen que verse igual.

export const TYPE_ICONS: Record<AssessmentTypeKey, LucideIcon> = {
  experimentado: Compass,
  sin_experiencia: Rocket,
  builder: Hammer,
  lider: Users
};

// Clases completas por tipo: Tailwind no genera clases compuestas dinámicamente,
// por eso cada variante vive acá como string literal.
export const CARD_ACCENTS: Record<
  AssessmentTypeKey,
  { chip: string; numeral: string; hover: string; arrow: string; badge: string }
> = {
  experimentado: {
    chip: "bg-purple-500/10 text-purple-600 dark:text-purple-300",
    numeral: "text-purple-500/10 dark:text-purple-400/10",
    hover: "hover:border-purple-500/50 hover:ring-1 hover:ring-purple-500/30",
    arrow: "text-purple-600 dark:text-purple-300",
    badge: "border-purple-500/30 bg-purple-500/10 text-purple-700 dark:text-purple-300"
  },
  sin_experiencia: {
    chip: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
    numeral: "text-amber-500/10 dark:text-amber-400/10",
    hover: "hover:border-amber-500/50 hover:ring-1 hover:ring-amber-500/30",
    arrow: "text-amber-600 dark:text-amber-300",
    badge: "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
  },
  builder: {
    chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
    numeral: "text-emerald-500/10 dark:text-emerald-400/10",
    hover: "hover:border-emerald-500/50 hover:ring-1 hover:ring-emerald-500/30",
    arrow: "text-emerald-600 dark:text-emerald-300",
    badge: "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
  },
  lider: {
    chip: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-300",
    numeral: "text-indigo-500/10 dark:text-indigo-400/10",
    hover: "hover:border-indigo-500/50 hover:ring-1 hover:ring-indigo-500/30",
    arrow: "text-indigo-600 dark:text-indigo-300",
    badge: "border-indigo-500/30 bg-indigo-500/10 text-indigo-700 dark:text-indigo-300"
  }
};

export function questionNote(type: AssessmentTypeKey): string {
  const count = getDomainsForType(type).length;
  if (type === "experimentado") {
    return `${count} preguntas + ${OPTIONAL_DOMAINS.length} opcionales`;
  }
  return CONTEXT_QUESTIONS[type] ? `${count} preguntas + 1 de contexto` : `${count} preguntas`;
}
