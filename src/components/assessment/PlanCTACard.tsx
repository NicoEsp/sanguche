import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { AssessmentTypeKey, getAssessmentTypeDef } from "@/utils/scoring";

interface PlanCTACardProps {
  type: AssessmentTypeKey;
  text: string;
  onCtaClick?: () => void;
}

// Misma receta de tarjeta con gradiente que usan los planes pagos en
// /planes, con la rampa de color de cada evaluación. Clases completas por
// variante: Tailwind no genera clases compuestas dinámicamente.
const CARD_STYLES: Record<
  AssessmentTypeKey,
  { glow: string; card: string; topBar: string; title: string; button: string }
> = {
  experimentado: {
    glow: "bg-gradient-to-r from-purple-500/20 via-fuchsia-500/15 to-purple-600/20",
    card: "border-purple-500/30 bg-gradient-to-br from-purple-950/90 via-purple-900/80 to-fuchsia-950/90 shadow-purple-900/20",
    topBar: "bg-gradient-to-r from-purple-400 via-fuchsia-300 to-purple-500",
    title: "bg-gradient-to-r from-white via-purple-100 to-fuchsia-200",
    button: "bg-gradient-to-r from-purple-500 to-fuchsia-500 hover:from-purple-400 hover:to-fuchsia-400 shadow-purple-900/30"
  },
  sin_experiencia: {
    glow: "bg-gradient-to-r from-amber-500/20 via-orange-500/15 to-amber-600/20",
    card: "border-amber-500/30 bg-gradient-to-br from-amber-950/90 via-amber-900/80 to-orange-950/90 shadow-amber-900/20",
    topBar: "bg-gradient-to-r from-amber-400 via-orange-300 to-amber-500",
    title: "bg-gradient-to-r from-white via-amber-100 to-orange-200",
    button: "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 shadow-amber-900/30"
  },
  builder: {
    glow: "bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-600/20",
    card: "border-emerald-500/30 bg-gradient-to-br from-emerald-950/90 via-emerald-900/80 to-teal-950/90 shadow-emerald-900/20",
    topBar: "bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-500",
    title: "bg-gradient-to-r from-white via-emerald-100 to-teal-200",
    button: "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 shadow-emerald-900/30"
  },
  lider: {
    glow: "bg-gradient-to-r from-indigo-500/20 via-blue-500/15 to-indigo-600/20",
    card: "border-indigo-500/30 bg-gradient-to-br from-indigo-950/90 via-indigo-900/80 to-blue-950/90 shadow-indigo-900/20",
    topBar: "bg-gradient-to-r from-indigo-400 via-blue-300 to-indigo-500",
    title: "bg-gradient-to-r from-white via-indigo-100 to-blue-200",
    button: "bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-400 hover:to-blue-400 shadow-indigo-900/30"
  }
};

const HEADLINES: Record<AssessmentTypeKey, string> = {
  experimentado: "Tu próximo nivel no llega solo con más experiencia.",
  sin_experiencia: "El salto es más corto con un plan de estudio.",
  builder: "Tu producto merece una revisión a fondo.",
  lider: "Nivelá a tu equipo con un programa a medida."
};

export function PlanCTACard({ type, text, onCtaClick }: PlanCTACardProps) {
  const typeDef = getAssessmentTypeDef(type);
  const styles = CARD_STYLES[type];

  return (
    <div className="group relative animate-fade-in">
      <div
        className={`absolute -inset-1 top-3 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500 opacity-60 group-hover:opacity-100 pointer-events-none ${styles.glow}`}
      />
      <div
        className={`relative overflow-hidden rounded-2xl border p-6 sm:p-8 text-white shadow-2xl ${styles.card}`}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 pointer-events-none ${styles.topBar}`} />
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)",
            backgroundSize: "24px 24px"
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-5 w-5 text-white" />
            <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
              {typeDef.plan.name}
            </span>
          </div>

          <h3 className={`text-xl sm:text-2xl font-bold mb-2 bg-clip-text text-transparent ${styles.title}`}>
            {HEADLINES[type]}
          </h3>
          <p className="text-white/85 text-sm sm:text-base mb-6 max-w-2xl">{text}</p>

          <Button
            asChild
            size="lg"
            className={`w-full sm:w-auto h-12 rounded-xl border-0 text-white font-semibold shadow-lg transition-all duration-300 hover:scale-[1.02] ${styles.button}`}
            onClick={onCtaClick}
          >
            <Link to={typeDef.plan.route}>
              {typeDef.plan.ctaLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
