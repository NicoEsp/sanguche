import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useMentoriaJourney } from "@/hooks/useMentoriaJourney";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";

interface MentoriaJourneyCardProps {
  profileId: string | undefined;
  /** Sesiones 1:1 registradas (profiles.mentoria_sessions_count) */
  sessionsCount: number;
  lastMentoriaDate?: string | null;
  /** Suscripción vigente. Si no, mostramos la versión "tu recorrido sigue guardado" */
  isActiveSubscriber: boolean;
  /** CTA de reactivación, solo para quienes ya no pagan */
  onResume?: () => void;
}

/** "2026-04-06T..." → "abril 2026" */
function formatMonthYear(date: string): string {
  return new Date(date)
    .toLocaleDateString("es-ES", { month: "long", year: "numeric" })
    .replace(" de ", " ");
}

/** "2026-07-12T..." → "12 de julio" */
function formatDay(date: string): string {
  return new Date(date).toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });
}

interface StatProps {
  value: number;
  label: string;
  highlighted?: boolean;
}

function Stat({ value, label, highlighted = false }: StatProps) {
  return (
    <div
      className={
        highlighted
          ? "rounded-xl bg-primary/10 px-4 py-3 sm:px-5 sm:py-4"
          : "rounded-xl bg-muted/60 px-4 py-3 sm:px-5 sm:py-4"
      }
    >
      <div
        className={
          highlighted
            ? "text-2xl font-bold text-primary sm:text-3xl"
            : "text-2xl font-bold text-foreground sm:text-3xl"
        }
      >
        {value.toLocaleString("es-ES")}
      </div>
      <div
        className={
          highlighted
            ? "text-xs text-primary/80 sm:text-sm"
            : "text-xs text-muted-foreground sm:text-sm"
        }
      >
        {label}
      </div>
    </div>
  );
}

export function MentoriaJourneyCard({
  profileId,
  sessionsCount,
  lastMentoriaDate,
  isActiveSubscriber,
  onResume,
}: MentoriaJourneyCardProps) {
  const { trackEvent } = useMixpanelTracking();
  const { data: journey } = useMentoriaJourney(profileId, sessionsCount);
  const hasTrackedView = useRef(false);

  useEffect(() => {
    if (!journey || hasTrackedView.current) return;
    hasTrackedView.current = true;

    trackEvent("mentoria_journey_viewed", {
      variant: isActiveSubscriber ? "active" : "lapsed",
      total_minutes: journey.totalMinutes,
      sessions_count: journey.sessionsCount,
      exercises_with_feedback: journey.exercisesWithFeedback,
    });
  }, [journey, isActiveSubscriber, trackEvent]);

  // Sin sesiones registradas no hay recorrido que mostrar todavía.
  if (!journey || journey.sessionsCount === 0) return null;

  const { totalMinutes, exercisesWithFeedback, startedAt } = journey;

  const title = isActiveSubscriber
    ? `Llevás ${totalMinutes.toLocaleString("es-ES")} minutos de mentoría 1:1`
    : `Acumulaste ${totalMinutes.toLocaleString("es-ES")} minutos de mentoría 1:1`;

  const description = isActiveSubscriber
    ? startedAt
      ? `Desde ${formatMonthYear(startedAt)}, cada sesión quedó registrada con lo que trabajaron.`
      : "Cada sesión quedó registrada con lo que trabajaron."
    : "Tu Career Path, tus ejercicios y tus notas de sesión siguen guardados.";

  const handleResume = () => {
    trackEvent("mentoria_journey_resume_clicked", {
      total_minutes: totalMinutes,
      sessions_count: sessionsCount,
    });
    onResume?.();
  };

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-5 sm:p-6">
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-primary">
            Tu recorrido
          </div>
          <h2 className="text-lg font-semibold leading-snug text-foreground sm:text-xl">
            {title}
          </h2>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Stat value={totalMinutes} label="minutos 1:1" highlighted />
          <Stat
            value={sessionsCount}
            label={sessionsCount === 1 ? "sesión" : "sesiones"}
          />
          <Stat
            value={exercisesWithFeedback}
            label={
              exercisesWithFeedback === 1
                ? "ejercicio con feedback"
                : "ejercicios con feedback"
            }
          />
        </div>

        {(lastMentoriaDate || (!isActiveSubscriber && onResume)) && (
          <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {lastMentoriaDate
                ? `Última sesión: ${formatDay(lastMentoriaDate)}`
                : ""}
            </p>

            {!isActiveSubscriber && onResume && (
              <Button onClick={handleResume} className="w-full sm:w-auto">
                Retomar la mentoría
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
