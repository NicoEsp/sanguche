import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

interface ReevaluationBannerProps {
  onCtaClick?: () => void;
}

/**
 * Banner para usuarios con una evaluación del formato anterior (sin tipo de
 * perfil): los invita a volver a evaluarse para ver el radar y la
 * recomendación por perfil. Su resultado actual se sigue mostrando abajo.
 */
export function ReevaluationBanner({ onCtaClick }: ReevaluationBannerProps) {
  return (
    <div className="relative rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-7 animate-fade-in">
      <span
        className="font-handwritten text-xl text-primary/80 absolute -top-3.5 right-6 rotate-[3deg]"
        aria-hidden="true"
      >
        nuevo
      </span>

      <div className="flex flex-col sm:flex-row sm:items-center gap-5">
        {/* Radar decorativo en miniatura */}
        <svg
          viewBox="0 0 96 96"
          className="h-20 w-20 shrink-0 mx-auto sm:mx-0"
          aria-hidden="true"
        >
          <polygon points="48,10 84,34 70,80 26,80 12,34" fill="none" className="stroke-border" strokeWidth="1.5" />
          <polygon points="48,29 66,41 59,64 37,64 30,41" fill="none" className="stroke-border" strokeWidth="1" />
          <polygon
            points="48,16 74,38 62,70 34,64 22,38"
            className="fill-primary/15 stroke-primary"
            strokeWidth="2"
            strokeLinejoin="round"
          />
        </svg>

        <div className="flex-1">
          <h3 className="text-lg font-semibold leading-snug">
            Ahora podés ver tu perfil en un gráfico de radar.
          </h3>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            Volvé a tomar la evaluación (te toma unos minutos) y vas a ver tus fortalezas
            y brechas de un vistazo, además de una recomendación hecha a tu medida.
          </p>
        </div>

        <Button asChild className="shrink-0" onClick={onCtaClick}>
          <Link to="/autoevaluacion?reevaluar=1">
            Volver a evaluarme
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
