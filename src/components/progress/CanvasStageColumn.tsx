import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { UserProgressObjective } from "@/hooks/useUserProgressObjectives";
import { SortableCanvasCard } from "./SortableCanvasCard";
import type { StageConfig } from "./shared";

interface CanvasStageColumnProps {
  stage: StageConfig;
  objectives: UserProgressObjective[];
  draggingId: string | null;
  overId: string | null;
  toggleStep: (obj: UserProgressObjective, stepId: string) => void;
  onDeleteCustom: (id: string) => void;
  isMapLocked: boolean;
  showEmptyState?: boolean;
  recentlyDroppedId?: string | null;
}

export const CanvasStageColumn = memo(function CanvasStageColumn({
  stage,
  objectives,
  draggingId,
  overId,
  toggleStep,
  onDeleteCustom,
  isMapLocked,
  showEmptyState,
  recentlyDroppedId,
}: CanvasStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const objectiveIds = useMemo(() => objectives.map((o) => o.id), [objectives]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative p-4 md:p-6 lg:p-8 career-path-column",
        "min-h-[400px] md:min-h-[500px]",
        "grid grid-rows-[auto_1fr]",
        "border-t md:border-t-0 md:border-l",
        "transition-all duration-200",
        draggingId && "border-primary/60",
        stage.key === "now" && "md:border-l-0 border-t-0",
        `bg-gradient-to-b ${stage.gradient}`
      )}
    >
      {isOver && draggingId && (
        <div className="absolute inset-2 border-2 border-dashed border-primary/60 rounded-xl bg-primary/5 pointer-events-none z-10 flex items-center justify-center transition-opacity duration-150">
          <div className="bg-primary/20 backdrop-blur-sm rounded-lg px-4 py-2 animate-fade-in">
            <span className="text-sm font-medium text-primary">Soltar en {stage.label}</span>
          </div>
        </div>
      )}

      {draggingId && !isOver && objectives.length === 0 && (
        <div className="absolute inset-2 border-2 border-dashed border-muted-foreground/20 rounded-xl pointer-events-none z-10 transition-opacity duration-150" />
      )}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">{stage.label}</h2>
          <p className="text-sm text-muted-foreground max-w-[240px]">{stage.description}</p>
        </div>
        <Badge variant="secondary" className="bg-background/70 backdrop-blur border">
          {objectives.length}
        </Badge>
      </div>

      <ScrollArea className="h-full pr-2">
        <SortableContext items={objectiveIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 auto-rows-auto">
            {showEmptyState && objectives.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="rounded-full bg-primary/10 p-4 mb-4">
                  <Sparkles className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">
                  ¡Empezá a construir tu Career Path!
                </h3>
                <p className="text-muted-foreground max-w-md mb-4 text-sm">
                  Arrastrá objetivos desde las secciones de abajo hacia las columnas según tu prioridad.
                </p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="animate-bounce">👇</span>
                  <span>Explorá los objetivos disponibles</span>
                </div>
              </div>
            )}

            {objectives.length === 0 && !showEmptyState && (
              <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground text-sm">
                Arrastrá objetivos aquí para planificar tu camino.
              </div>
            )}

            {objectives.map((objective, index) => (
              <SortableCanvasCard
                key={objective.id}
                objective={objective}
                toggleStep={toggleStep}
                onDeleteCustom={onDeleteCustom}
                isMapLocked={isMapLocked}
                isRecentlyDropped={recentlyDroppedId === objective.id}
                overId={overId}
                draggingId={draggingId}
                objectiveIndex={index}
                allObjectives={objectives}
              />
            ))}
          </div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
});
