import { memo } from "react";
import { Badge } from "@/components/ui/badge";
import type { DragOverlayData } from "@/hooks/useDragAndDrop";

interface DragOverlayCardProps {
  data: DragOverlayData;
}

export const DragOverlayCard = memo(function DragOverlayCard({ data }: DragOverlayCardProps) {
  const sourceLabel =
    data.source === "recommended"
      ? "Recomendado"
      : data.source === "mentor"
        ? "Mentoría"
        : "Personalizado";

  return (
    <div className="rounded-xl border-2 border-primary bg-background/95 p-4 shadow-2xl ring-2 ring-primary/40 scale-105 max-w-[300px] transform-gpu">
      <div className="flex items-center gap-2 mb-2">
        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs">
          {data.type}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {sourceLabel}
        </Badge>
      </div>
      <p className="font-semibold text-sm line-clamp-1">{data.title}</p>
      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{data.summary}</p>
    </div>
  );
});
