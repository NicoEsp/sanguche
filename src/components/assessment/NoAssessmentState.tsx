import { ArrowRight, Share2, Target, Compass } from "lucide-react";
import { Link } from "react-router-dom";
import { ASSESSMENT_TYPES, AssessmentTypeKey, DOMAINS, DomainScore } from "@/utils/scoring";
import { CompetencyRadar } from "@/components/assessment/CompetencyRadar";
import { CARD_ACCENTS, TYPE_ICONS, questionNote } from "@/components/assessment/assessmentTypeCards";

interface NoAssessmentStateProps {
  /** Nombre de pila para el saludo; sin él el saludo queda genérico. */
  firstName?: string | null;
  onSelectProfile: (type: AssessmentTypeKey) => void;
}

// Valores de ejemplo para el radar de muestra. Son ilustrativos y así se
// rotulan en pantalla: no representan a nadie ni se guardan.
const SAMPLE_VALUES: Record<string, number> = {
  estrategia: 4,
  roadmap: 3,
  ejecucion: 4,
  discovery: 2,
  analitica: 2,
  ux: 3,
  stakeholders: 4,
  comunicacion: 4,
  liderazgo: 3,
  tecnico: 3,
  monetizacion: 2
};

const SAMPLE_SCORES: DomainScore[] = DOMAINS.map((d) => ({
  key: d.key,
  label: d.label,
  value: SAMPLE_VALUES[d.key] ?? 3
}));

const OUTCOMES = [
  {
    icon: Share2,
    title: "Tu mapa de competencias",
    text: "Tu puntaje en cada dominio, de 1 a 5, en un radar que podés descargar y compartir."
  },
  {
    icon: Target,
    title: "Brechas priorizadas",
    text: "Qué conviene trabajar primero y qué ya tenés ganado, ordenado por prioridad."
  },
  {
    icon: Compass,
    title: "Un próximo paso a tu medida",
    text: "Una recomendación según tu perfil, y tus resultados en Markdown para seguir la charla con tu IA."
  }
] as const;

/**
 * Estado de /mejoras para quien todavía no tiene una evaluación guardada.
 *
 * Antes era un aviso de una línea: la persona llegaba, no veía nada y tenía que
 * adivinar qué hacer. Acá se le muestra qué va a tener en esta pantalla (con un
 * radar de ejemplo rotulado como tal) y se la manda directo a la evaluación de
 * su perfil, saltando el selector con ?tipo=.
 */
export function NoAssessmentState({ firstName, onSelectProfile }: NoAssessmentStateProps) {
  return (
    <div className="space-y-10 animate-fade-in">
      <div className="relative overflow-hidden rounded-2xl border bg-card p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:items-center">
          <div>
            <span
              className="font-handwritten text-xl text-primary/80 inline-block rotate-[-2deg]"
              aria-hidden="true"
            >
              {firstName ? `hola, ${firstName}` : "hola"}
            </span>
            <h2 className="mt-1 text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
              Tu diagnóstico de Producto empieza con una evaluación
            </h2>
            <p className="mt-3 text-muted-foreground leading-relaxed max-w-xl">
              Es gratuita y toma unos 5 minutos. Cuando la termines, esta página pasa a mostrar
              tu situación real en vez de estar vacía.
            </p>

            <ul className="mt-6 space-y-4">
              {OUTCOMES.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-[18px] w-[18px]" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="font-medium leading-snug">{title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <figure className="relative rounded-xl border bg-muted/30 p-4 sm:p-5">
            <span className="absolute left-4 top-4 rounded-full border bg-background px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              Ejemplo ilustrativo
            </span>
            <div aria-hidden="true" className="pt-6 opacity-90">
              <CompetencyRadar scores={SAMPLE_SCORES} accentHex="#a855f7" className="max-w-sm" />
            </div>
            <figcaption className="mt-1 text-center text-xs text-muted-foreground">
              Así se ve el mapa de competencias. El tuyo se arma con tus respuestas.
            </figcaption>
          </figure>
        </div>
      </div>

      <div>
        <h2 className="text-xl font-semibold">Elegí tu punto de partida</h2>
        <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
          Hay una evaluación por perfil y el diagnóstico se arma a tu medida. Tocá la que mejor
          te describe hoy y arrancás directo.
        </p>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {ASSESSMENT_TYPES.map((t, idx) => {
            const Icon = TYPE_ICONS[t.key];
            const accent = CARD_ACCENTS[t.key];
            return (
              <Link
                key={t.key}
                to={`/autoevaluacion?tipo=${t.key}`}
                onClick={() => onSelectProfile(t.key)}
                style={{ animationDelay: `${idx * 70}ms`, animationFillMode: "backwards" }}
                className={`group relative overflow-hidden rounded-2xl border bg-card p-5 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 animate-fade-in ${accent.hover}`}
              >
                <span
                  aria-hidden="true"
                  className={`pointer-events-none select-none absolute -bottom-5 -right-1 text-[6rem] font-extrabold tracking-tighter leading-none ${accent.numeral}`}
                >
                  {String(idx + 1).padStart(2, "0")}
                </span>

                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${accent.chip}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${accent.badge}`}>
                      {t.resultTag}
                    </span>
                  </div>

                  <h3 className="mt-4 font-semibold leading-snug">{t.title}</h3>
                  <p className="mt-0.5 text-sm text-muted-foreground">{t.persona}</p>
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">{t.promise}</p>

                  <div className="mt-4 flex items-center justify-between border-t pt-3">
                    <span className="text-xs text-muted-foreground">{questionNote(t.key)}</span>
                    <span className={`inline-flex items-center gap-1 text-sm font-medium ${accent.arrow}`}>
                      Empezar
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          Se guarda una sola evaluación por cuenta. Si más adelante cambiás de perfil, podés
          volver a evaluarte y el resultado nuevo reemplaza al anterior.
        </p>
      </div>
    </div>
  );
}
