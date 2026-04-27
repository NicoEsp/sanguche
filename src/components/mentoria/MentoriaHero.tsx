import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Calendar,
  Clock,
  Target,
  CheckCircle,
  TrendingUp,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface MentoriaHeroProps {
  mentoriaCompleted: boolean;
  lastMentoriaDate?: string | null;
  /** Plan RePremium = 2 sesiones por mes */
  hasActiveRePremium?: boolean;
}

function isNewMonth(lastDate?: string | null): boolean {
  if (!lastDate) return true;

  const last = new Date(lastDate);
  const now = new Date();

  return (
    now.getMonth() !== last.getMonth() ||
    now.getFullYear() !== last.getFullYear()
  );
}

interface HeroVariant {
  badge: string;
  title: string;
  description: string;
  meta: { icon: LucideIcon; label: string }[];
  cta: { label: string; icon: LucideIcon; onClick: () => void };
  decorIcon: LucideIcon;
  /** Plan RePremium = ribbon distintivo arriba a la derecha */
  rePremiumRibbon?: boolean;
}

export function MentoriaHero({
  mentoriaCompleted,
  lastMentoriaDate,
  hasActiveRePremium = false,
}: MentoriaHeroProps) {
  const navigate = useNavigate();

  const handleScheduleClick = () => {
    window.open(
      "https://calendar.notion.so/meet/nicoproducto/zf4fl4q8q",
      "_blank"
    );
  };

  const handleProgressClick = () => {
    navigate("/progreso");
  };

  const sessionAvailable = isNewMonth(lastMentoriaDate);
  let variant: HeroVariant;

  // ── First time (sin mentoría completada) ──
  if (!mentoriaCompleted) {
    variant = {
      badge: hasActiveRePremium ? "Plan RePremium · Mentoría 1:1" : "Mentoría 1:1",
      title: "Agendá tu mentoría 1:1 con NicoProducto",
      description: hasActiveRePremium
        ? "Sesión personalizada de 45 min. Con tu plan RePremium tenés 2 sesiones cada mes."
        : "Sesión personalizada de 45 min enfocada en tus áreas de mejora específicas.",
      meta: [
        { icon: Clock, label: "45 minutos" },
        { icon: Target, label: "100% personalizado" },
        { icon: Calendar, label: "Google Meet" },
      ],
      cta: {
        label: "Agendar sesión",
        icon: Calendar,
        onClick: handleScheduleClick,
      },
      decorIcon: Calendar,
      rePremiumRibbon: hasActiveRePremium,
    };
  }
  // ── RePremium: 2 sesiones/mes ──
  else if (hasActiveRePremium) {
    if (sessionAvailable) {
      // Aún no usó ninguna este mes
      variant = {
        badge: "Plan RePremium · 0/2 este mes",
        title: "Tenés 2 sesiones disponibles este mes",
        description:
          "Con tu plan RePremium podés agendar 2 sesiones de 45 min por mes. Cuando quieras, arrancamos.",
        meta: [
          { icon: Clock, label: "45 min cada una" },
          { icon: Target, label: "100% personalizado" },
          { icon: Zap, label: "Ideal con 2 semanas entre sesiones" },
        ],
        cta: {
          label: "Agendar sesión",
          icon: Calendar,
          onClick: handleScheduleClick,
        },
        decorIcon: Sparkles,
        rePremiumRibbon: true,
      };
    } else {
      // Ya hizo 1 este mes — le queda 1
      variant = {
        badge: "Plan RePremium · 1/2 este mes",
        title: "Te queda 1 sesión este mes",
        description:
          "Aprovechá tu segunda sesión cuando estés listo. Recordá que el cupo se reinicia el primer día del próximo mes.",
        meta: [
          { icon: Clock, label: "45 minutos" },
          { icon: Target, label: "100% personalizado" },
          { icon: Calendar, label: "Google Meet" },
        ],
        cta: {
          label: "Agendar tu 2ª sesión",
          icon: Calendar,
          onClick: handleScheduleClick,
        },
        decorIcon: Zap,
        rePremiumRibbon: true,
      };
    }
  }
  // ── Premium: 1 sesión/mes ──
  else if (sessionAvailable) {
    variant = {
      badge: "Sesión mensual",
      title: "Tu sesión mensual te está esperando",
      description:
        "Agendá 45 min con tu mentor para revisar tu plan y trazar los próximos pasos.",
      meta: [
        { icon: Clock, label: "45 minutos" },
        { icon: Target, label: "100% personalizado" },
        { icon: Calendar, label: "Google Meet" },
      ],
      cta: {
        label: "Agendar sesión",
        icon: Calendar,
        onClick: handleScheduleClick,
      },
      decorIcon: Sparkles,
    };
  } else {
    variant = {
      badge: "Plan en marcha",
      title: "Excelente trabajo en tu última mentoría",
      description:
        "Ahora es momento de poner en práctica lo conversado y seguir avanzando con tu Career Path.",
      meta: [
        { icon: Target, label: "Objetivos definidos" },
        { icon: CheckCircle, label: "Plan en marcha" },
        { icon: Calendar, label: "Próxima: inicio del próximo mes" },
      ],
      cta: {
        label: "Ver mi Career Path",
        icon: TrendingUp,
        onClick: handleProgressClick,
      },
      decorIcon: CheckCircle,
    };
  }

  const DecorIcon = variant.decorIcon;
  const CtaIcon = variant.cta.icon;

  return (
    <Card className="relative overflow-hidden border-primary/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.10] via-primary/[0.04] to-transparent" />

      {variant.rePremiumRibbon && (
        <div className="absolute right-4 top-4 z-10 hidden sm:block">
          <span className="inline-flex items-center gap-1 rounded-full bg-purple-500/15 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-purple-600 ring-1 ring-inset ring-purple-500/30 dark:text-purple-300">
            <Zap className="h-3 w-3" />
            RePremium
          </span>
        </div>
      )}

      <CardContent className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          {/* Decor icon */}
          <div className="flex shrink-0 self-start sm:self-center">
            <div className="rounded-xl bg-primary/15 p-3 text-primary ring-1 ring-inset ring-primary/20">
              <DecorIcon className="h-6 w-6" />
            </div>
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {variant.badge}
            </div>
            <h2 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {variant.title}
            </h2>
            <p className="text-sm text-muted-foreground">
              {variant.description}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
              {variant.meta.map(({ icon: MetaIcon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5"
                >
                  <MetaIcon className="h-3 w-3" />
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* CTA */}
          <Button
            onClick={variant.cta.onClick}
            className="w-full shrink-0 sm:w-auto sm:self-center"
          >
            <CtaIcon className="mr-2 h-4 w-4" />
            {variant.cta.label}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
