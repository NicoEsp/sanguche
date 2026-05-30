import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GripVertical, HelpCircle, Plus, Sparkles, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useDraggable } from "@dnd-kit/core";
import type { CanvasStage } from "@/types/progress";
import type { GeneratedObjective } from "@/hooks/useRecommendedObjectives";

interface DraggableRecommendedCardProps {
  objective: GeneratedObjective;
  draggingId: string | null;
  onQuickAdd: (objective: GeneratedObjective, timeframe?: CanvasStage) => void;
  onDismiss: (objectiveKey: string) => void;
  isMapLocked?: boolean;
  isDismissing: boolean;
}

export const DraggableRecommendedCard = memo(function DraggableRecommendedCard({
  objective,
  draggingId,
  onQuickAdd,
  onDismiss,
  isMapLocked,
  isDismissing,
}: DraggableRecommendedCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: objective.key,
    disabled: false,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        "group border rounded-xl p-4 bg-background/80 transition-all shadow-sm",
        draggingId === objective.key && "border-primary bg-primary/10",
        isDragging && "opacity-50 scale-[1.02] shadow-lg",
        "cursor-grab active:cursor-grabbing hover:border-primary/50 hover:shadow-md"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-2 flex-1">
          <GripVertical className="h-4 w-4 text-muted-foreground/50 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-0">
                <Sparkles className="h-3 w-3 mr-1" />
                Recomendado
              </Badge>
            </div>
            <h3 className="font-medium leading-tight">{objective.title}</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mt-1">
              {objective.summary}
            </p>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-xs text-primary/70 mt-1 cursor-help inline-flex items-center gap-1">
                    <span>Basado en: {objective.domainLabel}</span>
                    <HelpCircle className="h-3 w-3" />
                  </p>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="text-sm">
                    {objective.reason === "gap"
                      ? `Tu puntuación en "${objective.domainLabel}" fue menor a 3. Esta es un área clave donde trabajar puede impactar significativamente en tu crecimiento profesional.`
                      : `Tu puntuación en "${objective.domainLabel}" fue de 3-4. Tienes una base sólida, pero hay oportunidad de llevarla al siguiente nivel.`}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss(objective.key);
          }}
          disabled={isDismissing}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground ml-6">
        <Badge variant="secondary">{objective.type}</Badge>
        <Badge variant="outline" className="border-dashed">
          {objective.steps.length} pasos
        </Badge>
      </div>

      {!isMapLocked && (
        <div className="md:hidden mt-3">
          <Button
            size="sm"
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(objective, objective.suggestedTimeframe);
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar a{" "}
            {objective.suggestedTimeframe === "now"
              ? "En Foco"
              : objective.suggestedTimeframe === "soon"
                ? "Próximos"
                : "Visión"}
          </Button>
        </div>
      )}
    </div>
  );
});
