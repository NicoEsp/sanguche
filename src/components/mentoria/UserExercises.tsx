import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useMyExercises, useUpdateExercise, type UserExercise } from "@/hooks/useUserExercises";
import { useState, memo, useMemo } from "react";
import { format, differenceInCalendarDays } from "date-fns";
import { es } from "date-fns/locale";
import {
  FileText,
  Calendar,
  Link as LinkIcon,
  Send,
  Save,
  CheckCircle2,
  Briefcase,
  Loader2,
  Sparkles,
  Trophy,
  Flame,
  ChevronRight,
  Play,
  BookOpen,
  Target,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const statusLabels = {
  assigned: "Nuevo",
  in_progress: "En progreso",
  submitted: "Enviado",
  reviewed: "Revisado",
};

const typeConfig = {
  case_study: {
    label: "Caso de estudio",
    icon: Briefcase,
    accent: "text-sky-600 dark:text-sky-400",
    bg: "bg-sky-500/10",
    ring: "ring-sky-500/20",
    gradient: "from-sky-500/15 via-sky-500/5 to-transparent",
  },
  practical: {
    label: "Ejercicio práctico",
    icon: Target,
    accent: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
    ring: "ring-emerald-500/20",
    gradient: "from-emerald-500/15 via-emerald-500/5 to-transparent",
  },
  theoretical: {
    label: "Teórico",
    icon: BookOpen,
    accent: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
    ring: "ring-violet-500/20",
    gradient: "from-violet-500/15 via-violet-500/5 to-transparent",
  },
} as const;

function getDueMeta(dueDate: string | null) {
  if (!dueDate) return null;
  const days = differenceInCalendarDays(new Date(dueDate), new Date());
  if (days < 0) {
    return { label: `Venció hace ${Math.abs(days)} ${Math.abs(days) === 1 ? "día" : "días"}`, tone: "overdue" as const, days };
  }
  if (days === 0) return { label: "Vence hoy", tone: "urgent" as const, days };
  if (days === 1) return { label: "Vence mañana", tone: "urgent" as const, days };
  if (days <= 3) return { label: `Vence en ${days} días`, tone: "soon" as const, days };
  return { label: `Vence en ${days} días`, tone: "calm" as const, days };
}

const toneStyles = {
  overdue: "text-destructive bg-destructive/10",
  urgent: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  soon: "text-amber-600 dark:text-amber-400 bg-amber-500/10",
  calm: "text-muted-foreground bg-muted",
} as const;

function pickNextExercise(pending: UserExercise[]): UserExercise | null {
  if (pending.length === 0) return null;
  const inProgress = pending.filter((e) => e.status === "in_progress");
  const pool = inProgress.length > 0 ? inProgress : pending;
  const withDue = pool.filter((e) => e.due_date);
  if (withDue.length > 0) {
    return [...withDue].sort(
      (a, b) => new Date(a.due_date!).getTime() - new Date(b.due_date!).getTime()
    )[0];
  }
  return [...pool].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  )[0];
}

export const UserExercises = memo(function UserExercises() {
  const { data: exercises, isLoading } = useMyExercises();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const updateExercise = useUpdateExercise();

  const pendingExercises = useMemo(
    () => exercises?.filter((e) => e.status === "assigned" || e.status === "in_progress") ?? [],
    [exercises]
  );

  const completedExercises = useMemo(
    () => exercises?.filter((e) => e.status === "submitted" || e.status === "reviewed") ?? [],
    [exercises]
  );

  const totalCount = (exercises?.length ?? 0);
  const completedCount = completedExercises.length;
  const inProgressCount = pendingExercises.filter((e) => e.status === "in_progress").length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const nextExercise = useMemo(() => pickNextExercise(pendingExercises), [pendingExercises]);
  const otherPending = useMemo(
    () => pendingExercises.filter((e) => e.id !== nextExercise?.id),
    [pendingExercises, nextExercise]
  );

  const selectedExercise = exercises?.find((e) => e.id === selectedExerciseId);

  const handleSaveDraft = async () => {
    if (!selectedExerciseId) return;
    await updateExercise.mutateAsync({
      id: selectedExerciseId,
      submission_text: submissionText,
      status: "in_progress",
    });
  };

  const handleSubmit = async () => {
    if (!selectedExerciseId) return;
    await updateExercise.mutateAsync({
      id: selectedExerciseId,
      submission_text: submissionText,
      submission_date: new Date().toISOString(),
      status: "submitted",
    });
    setSelectedExerciseId(null);
    setSubmissionText("");
  };

  const handleViewExercise = (exerciseId: string) => {
    const exercise = exercises?.find((e) => e.id === exerciseId);
    if (exercise) {
      setSelectedExerciseId(exerciseId);
      setSubmissionText(exercise.submission_text || "");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (selectedExerciseId && selectedExercise) {
    const isReadOnly =
      selectedExercise.status === "submitted" || selectedExercise.status === "reviewed";
    const typeInfo = typeConfig[selectedExercise.exercise_type];
    const TypeIcon = typeInfo.icon;

    return (
      <Card className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500 overflow-hidden">
        <div className={cn("h-1 w-full bg-gradient-to-r", typeInfo.gradient)} />
        <CardHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedExerciseId(null)}
            className="w-fit -ml-2 mb-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Volver a mis ejercicios
          </Button>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-3">
              <div className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium", typeInfo.bg, typeInfo.accent)}>
                <TypeIcon className="h-3.5 w-3.5" />
                {typeInfo.label}
              </div>
              <CardTitle className="text-2xl leading-tight">{selectedExercise.exercise_title}</CardTitle>
              {selectedExercise.due_date && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    Vence el {format(new Date(selectedExercise.due_date), "d 'de' MMMM, yyyy", { locale: es })}
                  </span>
                </div>
              )}
            </div>
            <Badge variant="secondary" className="shrink-0">
              {statusLabels[selectedExercise.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedExercise.exercise_description && (
            <div className="space-y-2">
              <Label>Descripción</Label>
              <div className="rounded-lg border p-4 bg-muted/30 whitespace-pre-wrap text-sm leading-relaxed">
                {selectedExercise.exercise_description}
              </div>
            </div>
          )}

          {selectedExercise.attachment_url && (
            <div className="space-y-2">
              <Label>Material de apoyo</Label>
              <a
                href={selectedExercise.attachment_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                Descargar material
              </a>
            </div>
          )}

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="submission" className="text-base">Tu respuesta</Label>
              {selectedExercise.submission_date && (
                <span className="text-xs text-muted-foreground">
                  Enviado el {format(new Date(selectedExercise.submission_date), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              )}
            </div>
            <Textarea
              id="submission"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Tomate tu tiempo. Escribí tu respuesta aquí..."
              rows={10}
              disabled={isReadOnly}
              className={isReadOnly ? "bg-muted/30" : ""}
            />
          </div>

          {selectedExercise.status === "reviewed" && selectedExercise.admin_feedback && (
            <div className="space-y-2 bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <Label>Feedback del mentor</Label>
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed">
                {selectedExercise.admin_feedback}
              </div>
            </div>
          )}

          {!isReadOnly && (
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleSaveDraft}
                disabled={updateExercise.isPending}
              >
                {updateExercise.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar borrador
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={updateExercise.isPending || !submissionText.trim()}
              >
                {updateExercise.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Send className="h-4 w-4 mr-2" />
                )}
                Enviar respuesta
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const hasExercises = totalCount > 0;

  return (
    <div className="space-y-6">
      {/* Progress hero */}
      <Card
        className={cn(
          "relative overflow-hidden border-primary/20",
          "animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        )}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent pointer-events-none" />
        <CardContent className="relative p-6 space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Tu camino de aprendizaje
              </div>
              <h2 className="text-2xl font-semibold">
                {!hasExercises
                  ? "Tu mentor está preparando tus primeros ejercicios"
                  : completedCount === totalCount
                  ? "¡Completaste todos tus ejercicios!"
                  : completedCount === 0
                  ? "Todo listo para empezar"
                  : `Llevás ${completedCount} de ${totalCount} ejercicios`}
              </h2>
            </div>
            <div className={cn(
              "shrink-0 rounded-full p-3",
              completedCount === totalCount && hasExercises ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {completedCount === totalCount && hasExercises ? (
                <Trophy className="h-6 w-6" />
              ) : (
                <Flame className="h-6 w-6" />
              )}
            </div>
          </div>

          {hasExercises && (
            <>
              <div className="space-y-2">
                <Progress value={progressPct} className="h-2.5" />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{progressPct}% completado</span>
                  <span>{totalCount - completedCount} por hacer</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 pt-2">
                <StatTile label="Pendientes" value={pendingExercises.length - inProgressCount} />
                <StatTile label="En progreso" value={inProgressCount} accent />
                <StatTile label="Completados" value={completedCount} />
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Next exercise hero */}
      {nextExercise && (
        <NextExerciseHero
          exercise={nextExercise}
          onStart={() => handleViewExercise(nextExercise.id)}
        />
      )}

      {/* Rest of exercises */}
      <Card
        className="animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
        style={{ animationDelay: "150ms", animationFillMode: "backwards" }}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Briefcase className="h-5 w-5 text-primary" />
            Mis ejercicios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pending">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="pending">
                Pendientes ({pendingExercises.length})
              </TabsTrigger>
              <TabsTrigger value="completed">
                Completados ({completedExercises.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending" className="space-y-3 mt-4">
              {pendingExercises.length === 0 ? (
                <EmptyState
                  icon={FileText}
                  title="No tenés ejercicios pendientes"
                  subtitle="Cuando tu mentor te asigne uno nuevo, vas a verlo acá."
                />
              ) : nextExercise && otherPending.length === 0 ? (
                <EmptyState
                  icon={Sparkles}
                  title="Este es todo tu foco ahora"
                  subtitle="Tenés un solo ejercicio pendiente — el de arriba. Dale."
                />
              ) : (
                otherPending.map((exercise, idx) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => handleViewExercise(exercise.id)}
                    delay={idx * 60}
                  />
                ))
              )}
            </TabsContent>

            <TabsContent value="completed" className="space-y-3 mt-4">
              {completedExercises.length === 0 ? (
                <EmptyState
                  icon={CheckCircle2}
                  title="Todavía no completaste ninguno"
                  subtitle="Cuando envíes tu primer ejercicio, va a aparecer acá."
                />
              ) : (
                completedExercises.map((exercise, idx) => (
                  <ExerciseRow
                    key={exercise.id}
                    exercise={exercise}
                    onClick={() => handleViewExercise(exercise.id)}
                    delay={idx * 60}
                    completed
                  />
                ))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
});

function StatTile({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-lg border bg-background/60 backdrop-blur-sm px-3 py-2.5 text-center",
        accent && "border-primary/30 bg-primary/5"
      )}
    >
      <div className={cn("text-2xl font-semibold tabular-nums", accent && "text-primary")}>
        {value}
      </div>
      <div className="text-[11px] uppercase tracking-wide text-muted-foreground mt-0.5">
        {label}
      </div>
    </div>
  );
}

function NextExerciseHero({
  exercise,
  onStart,
}: {
  exercise: UserExercise;
  onStart: () => void;
}) {
  const typeInfo = typeConfig[exercise.exercise_type];
  const TypeIcon = typeInfo.icon;
  const dueMeta = getDueMeta(exercise.due_date);
  const isInProgress = exercise.status === "in_progress";
  const descriptionPreview = exercise.exercise_description
    ? exercise.exercise_description.length > 180
      ? exercise.exercise_description.slice(0, 180).trimEnd() + "…"
      : exercise.exercise_description
    : null;

  return (
    <Card
      className={cn(
        "relative overflow-hidden group cursor-pointer transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-0.5 ring-1",
        typeInfo.ring,
        "animate-in fade-in-0 slide-in-from-bottom-4 duration-500"
      )}
      style={{ animationDelay: "75ms", animationFillMode: "backwards" }}
      onClick={onStart}
    >
      <div className={cn("absolute inset-0 bg-gradient-to-br pointer-events-none", typeInfo.gradient)} />
      <div className="relative p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={cn("rounded-xl p-3 ring-1 ring-inset", typeInfo.bg, typeInfo.ring)}>
              <TypeIcon className={cn("h-6 w-6", typeInfo.accent)} />
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Play className="h-3 w-3 fill-current" />
                {isInProgress ? "Continúa donde dejaste" : "Tu próximo paso"}
              </div>
              <div className={cn("text-xs font-medium mt-0.5", typeInfo.accent)}>
                {typeInfo.label}
              </div>
            </div>
          </div>
          {dueMeta && (
            <div
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium",
                toneStyles[dueMeta.tone]
              )}
            >
              <Clock className="h-3.5 w-3.5" />
              {dueMeta.label}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xl sm:text-2xl font-semibold leading-tight">
            {exercise.exercise_title}
          </h3>
          {descriptionPreview && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {descriptionPreview}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="text-xs text-muted-foreground">
            {isInProgress ? "Tenés un borrador guardado" : "Sentate, respirá, empezá."}
          </div>
          <Button size="lg" className="group/btn shadow-sm">
            {isInProgress ? "Continuar" : "Empezar ahora"}
            <ChevronRight className="h-4 w-4 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function ExerciseRow({
  exercise,
  onClick,
  delay = 0,
  completed = false,
}: {
  exercise: UserExercise;
  onClick: () => void;
  delay?: number;
  completed?: boolean;
}) {
  const typeInfo = typeConfig[exercise.exercise_type];
  const TypeIcon = typeInfo.icon;
  const dueMeta = !completed ? getDueMeta(exercise.due_date) : null;
  const isReviewed = exercise.status === "reviewed";

  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full text-left rounded-lg border bg-card p-4 transition-all",
        "hover:border-primary/40 hover:shadow-md hover:-translate-y-px",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "animate-in fade-in-0 slide-in-from-bottom-2 duration-500"
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: "backwards" }}
    >
      <div className="flex items-start gap-3">
        <div className={cn("shrink-0 rounded-lg p-2 ring-1 ring-inset", typeInfo.bg, typeInfo.ring)}>
          <TypeIcon className={cn("h-4 w-4", typeInfo.accent)} />
        </div>

        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-start justify-between gap-3">
            <h4 className="font-medium leading-snug line-clamp-2">
              {exercise.exercise_title}
            </h4>
            <Badge
              variant={
                isReviewed ? "default"
                : completed ? "secondary"
                : exercise.status === "in_progress" ? "default"
                : "outline"
              }
              className="shrink-0"
            >
              {statusLabels[exercise.status]}
            </Badge>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <span className={typeInfo.accent}>{typeInfo.label}</span>
            {dueMeta && (
              <span className={cn("inline-flex items-center gap-1 rounded px-1.5 py-0.5", toneStyles[dueMeta.tone])}>
                <Clock className="h-3 w-3" />
                {dueMeta.label}
              </span>
            )}
            {completed && exercise.submission_date && (
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Enviado {format(new Date(exercise.submission_date), "d 'de' MMM", { locale: es })}
              </span>
            )}
          </div>
        </div>

        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
      </div>
    </button>
  );
}

function EmptyState({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof FileText;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="text-center py-10 space-y-2">
      <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
        <Icon className="h-5 w-5 text-muted-foreground/60" />
      </div>
      <p className="text-sm font-medium">{title}</p>
      <p className="text-xs text-muted-foreground max-w-xs mx-auto">{subtitle}</p>
    </div>
  );
}
