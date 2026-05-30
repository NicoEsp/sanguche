import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GripVertical, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import type { CanvasStage } from "@/types/progress";
import { type AvailableObjective, formatDueDate, getObjectiveDueDate } from "./shared";

interface DraggableObjectiveCardProps {
  objective: AvailableObjective;
  draggingId: string | null;
  locked?: boolean;
  onDelete?: (id: string) => void;
  onQuickAdd?: (objective: AvailableObjective, timeframe?: CanvasStage) => void;
  isMapLocked?: boolean;
}

export const DraggableObjectiveCard = memo(function DraggableObjectiveCard({
  objective,
  draggingId,
  locked,
  onDelete,
  onQuickAdd,
  isMapLocked,
}: DraggableObjectiveCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: objective.id,
    disabled: locked,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;
  const dueDate = getObjectiveDueDate(objective);
  const completedSteps = objective.steps?.filter((step) => step.completed).length ?? 0;
  const totalSteps = objective.steps?.length ?? 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group border rounded-xl p-4 bg-background/80 transition-all shadow-sm",
        draggingId === objective.id && "border-primary bg-primary/10",
        isDragging && "opacity-50 scale-[1.02] shadow-lg",
        !locked && "cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md",
        locked && "cursor-not-allowed opacity-75"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          {!locked && (
            <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <h3 className="font-medium leading-tight">{objective.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {objective.summary}
            </p>
          </div>
        </div>
        {objective.source === "custom" && onDelete && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={() => onDelete(objective.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
        <Badge variant="secondary">{objective.type}</Badge>
        <Badge variant="outline" className="border-dashed">
          {completedSteps}/{totalSteps} pasos
        </Badge>
        {dueDate && <Badge variant="outline">{formatDueDate(dueDate)}</Badge>}
      </div>

      {onQuickAdd && !locked && !isMapLocked && (
        <div className="md:hidden mt-3">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(objective, "now");
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar al Canvas
          </Button>
        </div>
      )}
    </div>
  );
});
