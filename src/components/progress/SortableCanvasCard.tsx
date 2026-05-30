import { memo, useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { CalendarIcon, CheckCircle2, GripVertical, Lock, Trash2, UserCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSortable, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import type { UserProgressObjective } from "@/hooks/useUserProgressObjectives";
import { formatDueDate, isCompleted } from "./shared";

interface SortableCanvasCardProps {
  objective: UserProgressObjective;
  toggleStep: (obj: UserProgressObjective, stepId: string) => void;
  onDeleteCustom: (id: string) => void;
  isMapLocked: boolean;
  isRecentlyDropped?: boolean;
  overId: string | null;
  draggingId: string | null;
  objectiveIndex: number;
  allObjectives: UserProgressObjective[];
}

const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return true;
};

export const SortableCanvasCard = memo(function SortableCanvasCard({
  objective,
  toggleStep,
  onDeleteCustom,
  isMapLocked,
  isRecentlyDropped,
  overId,
  draggingId,
  objectiveIndex,
  allObjectives,
}: SortableCanvasCardProps) {
  const isMentor = objective.source === "mentor";
  const complete = isCompleted(objective);
  const completedSteps = objective.steps.filter((step) => step.completed).length;
  const [isShaking, setIsShaking] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: objective.id,
    disabled: isMentor || isMapLocked,
    animateLayoutChanges,
    transition: {
      duration: 200,
      easing: "cubic-bezier(0.25, 1, 0.5, 1)",
    },
  });

  const isTargetedByDrag = overId === objective.id && draggingId !== objective.id && draggingId !== null;
  const draggedIndex = draggingId ? allObjectives.findIndex((o) => o.id === draggingId) : -1;
  const isDragFromSameColumn = draggedIndex !== -1;
  const showIndicator = isTargetedByDrag && isDragFromSameColumn && !isMentor && !isMapLocked;
  const indicatorPosition = draggedIndex > objectiveIndex ? "top" : "bottom";

  const handleBlockedAttempt = useCallback(() => {
    if (!isShaking && (isMentor || isMapLocked)) {
      setIsShaking(true);
      if (isMentor) {
        toast.info("Este objetivo fue asignado por tu mentor y no puede moverse", {
          duration: 2000,
        });
      } else if (isMapLocked) {
        toast.info("El mapa está bloqueado. Contacta a tu mentor para editarlo", {
          duration: 2000,
        });
      }
      setTimeout(() => setIsShaking(false), 400);
    }
  }, [isShaking, isMentor, isMapLocked]);

  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div className="relative career-path-card-wrapper">
      {showIndicator && indicatorPosition === "top" && (
        <div className="absolute -top-2 left-2 right-2 h-1 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/30 z-20" />
      )}

      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        onPointerDown={(e) => {
          if (isMentor || isMapLocked) {
            handleBlockedAttempt();
            e.preventDefault();
          }
        }}
        className={cn(
          "relative rounded-xl border bg-background/80 backdrop-blur p-3 md:p-5 shadow-sm",
          "flex flex-col career-path-card",
          "transform-gpu",
          complete && "border-emerald-400/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]",
          isDragging && "opacity-40 scale-[1.02] shadow-lg z-50 ring-2 ring-primary/30",
          !isDragging && "transition-all duration-200 ease-out",
          isRecentlyDropped && "animate-drop-settle",
          isShaking && "animate-shake",
          (isMentor || isMapLocked) && "cursor-not-allowed"
        )}
      >
        <div className="flex flex-wrap items-center gap-2 mb-2 min-h-[28px]">
          {!isMentor && !isMapLocked && (
            <button
              ref={setActivatorNodeRef}
              {...listeners}
              className="touch-none cursor-grab active:cursor-grabbing -ml-1 p-0.5 rounded hover:bg-muted/60 transition-colors print:hidden"
              aria-label="Arrastrar objetivo"
              tabIndex={-1}
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0" />
            </button>
          )}
          <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs">
            {objective.type}
          </Badge>
          {isMentor ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge variant="secondary" className="text-xs flex items-center gap-1 cursor-help">
                    <Lock className="h-3 w-3" /> Mentoría
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-xs max-w-[200px]">
                    Este objetivo fue asignado por tu mentor y no puede moverse.
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Badge variant="secondary" className="text-xs">Personalizado</Badge>
          )}
          {complete ? (
            <Badge className="bg-emerald-500/90 text-white text-xs ml-auto">
              <CheckCircle2 className="h-3 w-3 mr-1" /> Completado
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs ml-auto">
              {completedSteps}/{objective.steps.length}
            </Badge>
          )}
        </div>

        <div className="space-y-1 mb-3 min-h-[72px]">
          <h3 className="font-semibold text-base md:text-lg leading-tight line-clamp-2">
            {objective.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
            {objective.summary}
          </p>
        </div>

        {objective.assigned_by_admin && (
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground/80 mb-2">
            <UserCircle2 className="h-3.5 w-3.5" />
            <span>Asignado por tu mentor</span>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {objective.due_date && (
            <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5" />
              {formatDueDate(objective.due_date)}
            </div>
          )}
          {!isMentor && !isMapLocked && (
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground ml-auto print:hidden"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteCustom(objective.id);
              }}
              title="Eliminar objetivo"
              aria-label="Eliminar objetivo"
            >
              <Trash2 className="h-3.5 w-3.5 md:h-4 md:w-4" />
            </Button>
          )}
        </div>

        <div className="flex-1 flex flex-col justify-end">
          {objective.level && (
            <div className="mt-4 bg-muted/60 rounded-lg px-4 py-2 text-xs flex items-center justify-between text-muted-foreground">
              <span>{objective.level.label ?? "Nivel"}</span>
              <span>
                {objective.level.current} → {objective.level.target}
              </span>
            </div>
          )}

          {objective.mentor_notes && (
            <div className="mt-4 border-l-2 border-primary/40 pl-4 text-xs text-muted-foreground italic">
              {objective.mentor_notes}
            </div>
          )}

          {objective.steps.length > 0 && (
            <div className="mt-auto pt-4 space-y-3">
              <p className="text-sm font-medium">Checklist de avance</p>
              <div className="space-y-2">
                {objective.steps.map((step) => (
                  <div
                    key={step.id}
                    role="button"
                    tabIndex={0}
                    className={cn(
                      "flex items-center gap-3 rounded-lg border text-sm",
                      "px-3 py-2.5 md:px-3 md:py-2",
                      "min-h-[44px] md:min-h-0",
                      "transition-colors touch-manipulation",
                      step.completed
                        ? "bg-emerald-500/10 border-emerald-400/50"
                        : "hover:bg-muted/60 active:bg-muted",
                      "cursor-pointer select-none"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleStep(objective, step.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        e.stopPropagation();
                        toggleStep(objective, step.id);
                      }
                    }}
                  >
                    <Checkbox
                      checked={step.completed}
                      tabIndex={-1}
                      className="h-5 w-5 md:h-4 md:w-4 flex-shrink-0 pointer-events-none"
                    />
                    <span
                      className={cn(
                        "flex-1",
                        step.completed && "line-through text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showIndicator && indicatorPosition === "bottom" && (
        <div className="absolute -bottom-2 left-2 right-2 h-1 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/30 z-20" />
      )}
    </div>
  );
});
