import { ArrowRight, Compass, Hammer, Rocket, Users, type LucideIcon } from "lucide-react";
import {
  ASSESSMENT_TYPES,
  AssessmentTypeKey,
  CONTEXT_QUESTIONS,
  OPTIONAL_DOMAINS,
  getDomainsForType
} from "@/utils/scoring";

interface AssessmentTypeSelectorProps {
  onSelect: (type: AssessmentTypeKey) => void;
  isReevaluation?: boolean;
}

const TYPE_ICONS: Record<AssessmentTypeKey, LucideIcon> = {
  experimentado: Compass,
  sin_experiencia: Rocket,
  builder: Hammer,
  lider: Users
};

// Clases completas por tipo: Tailwind no genera clases compuestas dinámicamente,
// por eso cada variante vive acá como string literal.
const CARD_ACCENTS: Record<
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

function questionNote(type: AssessmentTypeKey): string {
  const count = getDomainsForType(type).length;
  if (type === "experimentado") {
    return `${count} preguntas + ${OPTIONAL_DOMAINS.length} opcionales`;
  }
  return CONTEXT_QUESTIONS[type] ? `${count} preguntas + 1 de contexto` : `${count} preguntas`;
}

export function AssessmentTypeSelector({ onSelect, isReevaluation = false }: AssessmentTypeSelectorProps) {
  return (
    <div className="animate-fade-in">
      <div className="mb-8">
        <span
          className="font-handwritten text-xl text-primary/80 inline-block rotate-[-2deg]"
          aria-hidden="true"
        >
          elegí tu punto de partida
        </span>
        <h1 className="mt-1 text-3xl sm:text-4xl font-extrabold tracking-tight">
          Contanos desde dónde arrancás
        </h1>
        <p className="mt-3 text-muted-foreground max-w-2xl leading-relaxed">
          Cuatro evaluaciones distintas, una por perfil. Elegí la que mejor te describe hoy
          y el diagnóstico se arma a tu medida.
          {isReevaluation && " Tu resultado anterior se reemplaza por el nuevo."}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {ASSESSMENT_TYPES.map((t, idx) => {
          const Icon = TYPE_ICONS[t.key];
          const accent = CARD_ACCENTS[t.key];
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => onSelect(t.key)}
              style={{ animationDelay: `${idx * 70}ms`, animationFillMode: "backwards" }}
              className={`group relative overflow-hidden rounded-2xl border bg-card p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 animate-fade-in ${accent.hover}`}
            >
              <span
                aria-hidden="true"
                className={`pointer-events-none select-none absolute -bottom-6 -right-2 text-[7rem] font-extrabold tracking-tighter leading-none ${accent.numeral}`}
              >
                {String(idx + 1).padStart(2, "0")}
              </span>

              <div className="relative">
                <div className="flex items-start justify-between gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${accent.chip}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${accent.badge}`}>
                    {t.resultTag}
                  </span>
                </div>

                <h2 className="mt-4 text-lg font-semibold leading-snug">{t.title}</h2>
                <p className="mt-0.5 text-sm text-muted-foreground">{t.persona}</p>
                <p className="mt-3 text-sm leading-relaxed text-foreground/80">{t.promise}</p>

                <div className="mt-5 flex items-center justify-between border-t pt-4">
                  <span className="text-xs text-muted-foreground">{questionNote(t.key)}</span>
                  <span className={`inline-flex items-center gap-1 text-sm font-medium ${accent.arrow}`}>
                    Empezar
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-muted-foreground">
        Se guarda una sola evaluación por cuenta. Si más adelante cambiás de perfil, podés
        volver a evaluarte y el resultado nuevo reemplaza al anterior.
      </p>
    </div>
  );
}
