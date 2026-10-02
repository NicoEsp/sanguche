import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { ASSESSMENT_TYPES, AssessmentTypeKey } from "@/utils/scoring";
import { CARD_ACCENTS, TYPE_ICONS, questionNote } from "@/components/assessment/assessmentTypeCards";

interface AssessmentTypeSelectorProps {
  onSelect: (type: AssessmentTypeKey) => void;
  isReevaluation?: boolean;
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

      {/* El perfil "lider" también mira al equipo, pero desde la lectura de una
          sola persona. Lo que distingue al programa para equipos es el alcance:
          se evalúa a cada integrante. Sin esta aclaración un líder no sabe cuál
          de las dos puertas le corresponde. */}
      <p className="mt-6 text-sm text-muted-foreground">
        ¿Buscás que se evalúe a cada integrante y no solo tu lectura del equipo?{" "}
        <Link
          to="/empresas"
          className="text-primary hover:underline font-medium"
        >
          Mirá el programa para equipos
        </Link>
      </p>

      <p className="mt-4 text-xs text-muted-foreground">
        Se guarda una sola evaluación por cuenta. Si más adelante cambiás de perfil, podés
        volver a evaluarte y el resultado nuevo reemplaza al anterior.
      </p>
    </div>
  );
}
