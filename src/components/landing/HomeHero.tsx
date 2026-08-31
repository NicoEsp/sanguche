import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HomeHeroProps {
  /** A dónde manda el CTA principal: la evaluación si hay sesión, /auth si no. */
  ctaHref: string;
  onCtaClick?: () => void;
  onSoyDevClick?: () => void;
}

/**
 * Hero de la home.
 *
 * Vive fuera de Index.tsx para que lo pueda renderizar también el build (ver
 * scripts/prerender/render.tsx): el HTML servido de "/" no tenía nada dentro
 * del #root, así que un fetcher que no ejecuta JS —como los de los asistentes—
 * no veía ni el título de la página.
 *
 * Sin hooks a propósito: lo que depende de la sesión (a dónde va el CTA) y el
 * tracking entran por props, así el mismo markup sirve para las dos vistas y no
 * hay copy duplicado que pueda divergir.
 */
export function HomeHero({ ctaHref, onCtaClick, onSoyDevClick }: HomeHeroProps) {
  return (
    <section className="container py-20 sm:py-32 px-4 sm:px-6">
      <div className="max-w-3xl">
        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6">
          Descubrí tu nivel real como{" "}
          <span className="text-primary">Product Builder</span>
        </h1>

        <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mb-10 leading-relaxed">
          Una evaluación gratuita de 5 minutos, diseñada por{" "}
          <a
            href="https://www.linkedin.com/in/nicolas-espindola/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-foreground underline underline-offset-4 hover:text-primary transition-colors">

            NicoProducto
          </a>
          , para identificar tus fortalezas y áreas de mejora. No importa tu experiencia previa.
        </p>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto text-base sm:text-lg px-4 sm:px-10 py-6 sm:py-7 font-semibold"
            onClick={onCtaClick}>

            <Link to={ctaHref}>
              Comenzar evaluación gratis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>

          <Link
            to="/soy-dev"
            onClick={onSoyDevClick}
            className="inline-flex items-center gap-1 font-mono text-sm bg-slate-900/80 text-slate-300 border border-slate-700 hover:border-slate-400 rounded-md px-4 py-2 transition-colors duration-200">

            <span className="text-green-400 mr-1">&gt;</span>
            <span className="text-sky-400">soyDev</span>
            <span className="text-slate-500">.</span>
            <span className="text-amber-400">queHago</span>
            <span className="text-slate-500">()</span>
            <span className="animate-blink text-slate-400 ml-0.5">▎</span>
          </Link>
        </div>
      </div>
    </section>
  );
}

interface HomeUpgradeTeaserProps {
  onCtaClick?: () => void;
}

/** Puente de la home a /planes. Puro por el mismo motivo que HomeHero. */
export function HomeUpgradeTeaser({ onCtaClick }: HomeUpgradeTeaserProps) {
  return (
    <section className="container py-16 sm:py-24 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto text-center">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
          Empezá gratis. Crecé a tu ritmo.
        </h2>
        <p className="text-muted-foreground mb-8">
          La evaluación es completamente gratuita. Cuando quieras mentoría 1:1, cursos y un career path personalizado, tenemos planes pensados para cada etapa.
        </p>
        <Button asChild variant="outline" size="lg" onClick={onCtaClick}>
          <Link to="/planes">
            Ver planes
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
