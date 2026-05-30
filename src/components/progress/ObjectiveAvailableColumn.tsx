import { memo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Lock } from "lucide-react";
import type { CanvasStage } from "@/types/progress";
import { DraggableObjectiveCard } from "./DraggableObjectiveCard";
import type { AvailableObjective } from "./shared";

interface ObjectiveAvailableColumnProps {
  title: string;
  description: string;
  objectives: AvailableObjective[];
  draggingId: string | null;
  locked?: boolean;
  onDelete?: (id: string) => void;
  onQuickAdd?: (objective: AvailableObjective, timeframe?: CanvasStage) => void;
  isMapLocked?: boolean;
}

export const ObjectiveAvailableColumn = memo(function ObjectiveAvailableColumn({
  title,
  description,
  objectives,
  draggingId,
  locked,
  onDelete,
  onQuickAdd,
  isMapLocked,
}: ObjectiveAvailableColumnProps) {
  return (
    <Card className="border-dashed h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
          {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] md:h-[360px] lg:h-[400px] pr-4">
          <div className="space-y-4">
            {objectives.map((objective) => (
              <DraggableObjectiveCard
                key={objective.id}
                objective={objective}
                draggingId={draggingId}
                locked={locked}
                onDelete={onDelete}
                onQuickAdd={onQuickAdd}
                isMapLocked={isMapLocked}
              />
            ))}

            {objectives.length === 0 && (
              <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                Todavía no tienes objetivos en esta sección.
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
});
