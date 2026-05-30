import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { CanvasStage } from "@/types/progress";
import type { GeneratedObjective } from "@/hooks/useRecommendedObjectives";
import { DraggableRecommendedCard } from "./DraggableRecommendedCard";

interface RecommendedObjectivesColumnProps {
  title: string;
  description: string;
  objectives: GeneratedObjective[];
  draggingId: string | null;
  onQuickAdd: (objective: GeneratedObjective, timeframe?: CanvasStage) => void;
  onDismiss: (objectiveKey: string) => void;
  isMapLocked?: boolean;
  isDismissing: boolean;
}

export const RecommendedObjectivesColumn = memo(function RecommendedObjectivesColumn({
  title,
  description,
  objectives,
  draggingId,
  onQuickAdd,
  onDismiss,
  isMapLocked,
  isDismissing,
}: RecommendedObjectivesColumnProps) {
  return (
    <Card className="border-dashed h-full border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">{title}</CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] md:h-[360px] lg:h-[400px] pr-4">
          <div className="space-y-4">
            {objectives.map((objective) => (
              <DraggableRecommendedCard
                key={objective.key}
                objective={objective}
                draggingId={draggingId}
                onQuickAdd={onQuickAdd}
                onDismiss={onDismiss}
                isMapLocked={isMapLocked}
                isDismissing={isDismissing}
              />
            ))}

            {objectives.length === 0 && (
              <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                No hay objetivos recomendados. Completá tu autoevaluación para recibir sugerencias personalizadas.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
