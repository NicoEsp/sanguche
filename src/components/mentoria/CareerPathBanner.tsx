import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ArrowRight, ListChecks, Route, Sparkles, Target } from "lucide-react";
import { useUserProgressObjectives } from "@/hooks/useUserProgressObjectives";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import { isCompleted } from "@/components/progress/shared";

interface CareerPathBannerProps {
  profileId: string | undefined;
}

export function CareerPathBanner({ profileId }: CareerPathBannerProps) {
  const navigate = useNavigate();
  const { trackEvent } = useMixpanelTracking();
  const { data: objectives = [], isLoading } = useUserProgressObjectives(profileId);
  const hasTrackedView = useRef(false);

  const totalObjectives = objectives.length;
  const completedCount = objectives.filter((obj) => isCompleted(obj)).length;
  const completionRate = totalObjectives
    ? Math.round((completedCount / totalObjectives) * 100)
    : 0;
  const hasObjectives = totalObjectives > 0;
  const allCompleted = hasObjectives && completedCount === totalObjectives;

  const isReady = !!profileId && !isLoading;

  useEffect(() => {
    if (!isReady || hasTrackedView.current) return;
    hasTrackedView.current = true;

    trackEvent("career_path_banner_viewed", {
      location: "mentoria",
      has_objectives: hasObjectives,
      objectives_count: totalObjectives,
      completed_count: completedCount,
      completion_rate: completionRate,
    });
  }, [isReady, hasObjectives, totalObjectives, completedCount, completionRate, trackEvent]);

  const handleClick = () => {
    trackEvent("career_path_banner_clicked", {
      location: "mentoria",
      has_objectives: hasObjectives,
      objectives_count: totalObjectives,
      completed_count: completedCount,
      completion_rate: completionRate,
      cta: hasObjectives ? "continue" : "create",
    });

    navigate("/progreso");
  };

  const copy = !hasObjectives
    ? {
        badge: "Incluido en tu plan",
        title: "Convertí tu mentoría en un Career Path",
        description:
          "Armá tu plan con objetivos por horizonte temporal, checklist de avance y los objetivos que definís con tu mentor. Se guarda solo y lo podés exportar en PDF.",
        cta: "Armar mi Career Path",
      }
    : allCompleted
      ? {
          badge: "Career Path al 100%",
          title: "¡Completaste todos tus objetivos!",
          description:
            "Sumá nuevos objetivos para seguir avanzando o exportá tu Career Path en PDF para revisarlo en tu próxima mentoría.",
          cta: "Sumar nuevos objetivos",
        }
      : {
          badge: "Tu plan en marcha",
          title: `Llevás ${completedCount} de ${totalObjectives} objetivos completados`,
          description:
            "Marcá los pasos que ya diste en tu Career Path y llegá a tu próxima mentoría con el avance a la vista.",
          cta: "Ver mi Career Path",
        };

  if (!isReady) return null;

  return (
    <Card className="relative overflow-hidden border-primary/20">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/[0.10] via-primary/[0.04] to-transparent" />

      <CardContent className="relative p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex shrink-0 self-start sm:self-center">
            <div className="rounded-xl bg-primary/15 p-3 text-primary ring-1 ring-inset ring-primary/20">
              <Route className="h-6 w-6" />
            </div>
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
              {copy.badge}
            </div>
            <h2 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
              {copy.title}
            </h2>
            <p className="text-sm text-muted-foreground">{copy.description}</p>

            {hasObjectives ? (
              <div className="max-w-xs pt-2">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>Avance</span>
                  <span className="font-medium text-foreground">{completionRate}%</span>
                </div>
                <ProgressBar value={completionRate} className="h-2" />
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Target className="h-3 w-3" />
                  Objetivos por horizonte
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <ListChecks className="h-3 w-3" />
                  Checklist de avance
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3" />
                  Sugerencias personalizadas
                </span>
              </div>
            )}
          </div>

          <Button
            onClick={handleClick}
            variant={hasObjectives ? "outline" : "default"}
            className="w-full shrink-0 sm:w-auto sm:self-center"
          >
            {copy.cta}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
