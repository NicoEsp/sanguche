import { useCallback, useState } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  MeasuringStrategy,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";
import { arrayMove } from "@dnd-kit/sortable";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { QueryClient } from "@tanstack/react-query";
import type { CanvasStage } from "@/types/progress";
import type { UserProgressObjective } from "@/hooks/useUserProgressObjectives";
import type { GeneratedObjective } from "@/hooks/useRecommendedObjectives";

type StageObjectivesMap = Record<CanvasStage, UserProgressObjective[]>;

interface UseDragAndDropOptions {
  profileId: string | undefined;
  isMapLocked: boolean;
  userObjectives: UserProgressObjective[];
  recommendedObjectives: GeneratedObjective[];
  canvasObjectives: UserProgressObjective[];
  objectivesByStage: StageObjectivesMap;
  customObjectives: UserProgressObjective[];
  createUserObjective: {
    mutate: (params: {
      userId: string;
      title: string;
      summary: string;
      type: string;
      timeframe: CanvasStage;
      steps: Array<{ id: string; title: string; completed: boolean }>;
    }) => void;
  };
  updateUserObjective: {
    mutate: (
      params: {
        id: string;
        userId: string;
        updates: Record<string, unknown>;
      },
      options?: { onError?: () => void }
    ) => void;
  };
  queryClient: QueryClient;
  trackEvent: (event: string, properties?: Record<string, unknown>) => void;
}

interface UseDragAndDropReturn {
  // State
  draggingId: string | null;
  activeObjective: UserProgressObjective | null;
  overId: string | null;
  recentlyDroppedId: string | null;

  // Configuration
  sensors: ReturnType<typeof useSensors>;
  dndContextProps: {
    collisionDetection: typeof closestCenter;
    modifiers: (typeof restrictToWindowEdges)[];
    measuring: { droppable: { strategy: MeasuringStrategy } };
  };

  // Handlers
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

export function useDragAndDrop({
  profileId,
  isMapLocked,
  userObjectives,
  recommendedObjectives,
  canvasObjectives,
  objectivesByStage,
  customObjectives,
  createUserObjective,
  updateUserObjective,
  queryClient,
  trackEvent,
}: UseDragAndDropOptions): UseDragAndDropReturn {
  // DnD state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeObjective, setActiveObjective] = useState<UserProgressObjective | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [recentlyDroppedId, setRecentlyDroppedId] = useState<string | null>(null);

  // DnD sensors - PointerSensor for desktop, TouchSensor for mobile with delay to prevent scroll conflicts
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // DndContext configuration
  const dndContextProps = {
    collisionDetection: closestCenter,
    modifiers: [restrictToWindowEdges],
    measuring: {
      droppable: {
        strategy: MeasuringStrategy.Always,
      },
    },
  };

  // Handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      setDraggingId(id);
      // Find objective for DragOverlay
      const obj = canvasObjectives.find((o) => o.id === id);
      setActiveObjective(obj ?? null);
    },
    [canvasObjectives]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId((over?.id as string) ?? null);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setDraggingId(null);
      setActiveObjective(null);
      setOverId(null);

      if (!over || !profileId || isMapLocked) return;

      const draggedId = active.id as string;
      const targetId = over.id as string;

      // Check if it's a recommended objective (by key)
      const recommendedObj = recommendedObjectives.find((obj) => obj.key === draggedId);
      if (recommendedObj) {
        // Check for duplicate by title
        const alreadyAssigned = userObjectives.some((obj) => obj.title === recommendedObj.title);
        if (alreadyAssigned) {
          toast.error("Este objetivo ya está en tu canvas");
          return;
        }

        // Determine target timeframe
        const targetTimeframe = ["now", "soon", "later"].includes(targetId)
          ? (targetId as CanvasStage)
          : "now";

        // Create custom objective from recommended
        createUserObjective.mutate({
          userId: profileId,
          title: recommendedObj.title,
          summary: recommendedObj.summary,
          type: recommendedObj.type,
          timeframe: targetTimeframe,
          steps: recommendedObj.steps.map((step, idx) => ({
            id: `step-${Date.now()}-${idx}`,
            title: step.title,
            completed: false,
          })),
        });

        // Track objective added
        trackEvent("objective_added_to_canvas", {
          source: "recommended",
          timeframe: targetTimeframe,
          objective_title: recommendedObj.title,
          domain: recommendedObj.domainKey,
          method: "drag",
        });
        return;
      }

      // Check if dropped on a column (timeframe change)
      if (["now", "soon", "later"].includes(targetId)) {
        const customObj = customObjectives.find((obj) => obj.id === draggedId);
        if (customObj && customObj.timeframe !== targetId) {
          // Calculate position at end of target column
          const targetStageObjectives = objectivesByStage[targetId as CanvasStage];
          const newPosition = targetStageObjectives.length;

          // Optimistic update - update cache immediately
          const previousObjectives = queryClient.getQueryData<UserProgressObjective[]>([
            "user-progress-objectives",
            profileId,
          ]);

          queryClient.setQueryData<UserProgressObjective[]>(
            ["user-progress-objectives", profileId],
            (old) =>
              old?.map((obj) =>
                obj.id === customObj.id
                  ? { ...obj, timeframe: targetId as CanvasStage, position: newPosition }
                  : obj
              ) ?? []
          );

          // Perform actual mutation
          updateUserObjective.mutate(
            {
              id: customObj.id,
              userId: profileId,
              updates: { timeframe: targetId, position: newPosition },
            },
            {
              onError: () => {
                // Revert on error
                queryClient.setQueryData(["user-progress-objectives", profileId], previousObjectives);
                toast.error("Error al mover el objetivo. Intenta nuevamente.");
              },
            }
          );

          // Trigger drop animation
          setRecentlyDroppedId(draggedId);
          setTimeout(() => setRecentlyDroppedId(null), 300);
          return;
        }
        return;
      }

      // Check if dropped on another objective (reordering within same column)
      const activeObj = canvasObjectives.find((o) => o.id === draggedId);
      const overObj = canvasObjectives.find((o) => o.id === targetId);

      if (activeObj && overObj && activeObj.timeframe === overObj.timeframe) {
        const isMentorObj = activeObj.source === "mentor";
        if (isMentorObj) return; // Can't reorder mentor objectives

        const stageObjectives = objectivesByStage[activeObj.timeframe];
        const oldIndex = stageObjectives.findIndex((o) => o.id === draggedId);
        const newIndex = stageObjectives.findIndex((o) => o.id === targetId);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const reorderedObjectives = arrayMove(stageObjectives, oldIndex, newIndex);

          // Optimistic update with new positions
          const previousObjectives = queryClient.getQueryData<UserProgressObjective[]>([
            "user-progress-objectives",
            profileId,
          ]);

          queryClient.setQueryData<UserProgressObjective[]>(
            ["user-progress-objectives", profileId],
            (old) => {
              if (!old) return old;
              return old.map((obj) => {
                const newIdx = reorderedObjectives.findIndex((r) => r.id === obj.id);
                if (newIdx !== -1) {
                  return { ...obj, position: newIdx };
                }
                return obj;
              });
            }
          );

          // Persist new positions
          const updates = reorderedObjectives.map((obj, idx) => ({
            id: obj.id,
            position: idx,
          }));

          // Update all positions in parallel
          Promise.all(
            updates.map(({ id, position }) =>
              supabase.from("user_progress_objectives").update({ position }).eq("id", id)
            )
          ).catch(() => {
            queryClient.setQueryData(["user-progress-objectives", profileId], previousObjectives);
            toast.error("Error al reordenar. Intenta nuevamente.");
          });

          // Trigger drop animation
          setRecentlyDroppedId(draggedId);
          setTimeout(() => setRecentlyDroppedId(null), 300);
        }
      }
    },
    [
      profileId,
      isMapLocked,
      recommendedObjectives,
      userObjectives,
      createUserObjective,
      customObjectives,
      updateUserObjective,
      trackEvent,
      queryClient,
      canvasObjectives,
      objectivesByStage,
    ]
  );

  return {
    // State
    draggingId,
    activeObjective,
    overId,
    recentlyDroppedId,
    // Configuration
    sensors,
    dndContextProps,
    // Handlers
    handleDragStart,
    handleDragOver,
    handleDragEnd,
  };
}
