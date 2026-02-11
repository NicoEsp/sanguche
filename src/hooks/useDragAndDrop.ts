import { useCallback, useMemo, useRef, useState } from "react";
import {
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
  DragCancelEvent,
  PointerSensor,
  KeyboardSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
  CollisionDetection,
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

const STAGES: CanvasStage[] = ["now", "soon", "later"];

type StageObjectivesMap = Record<CanvasStage, UserProgressObjective[]>;

/** Lightweight shape used for the DragOverlay when dragging from the available panel */
export interface DragOverlayData {
  id: string;
  title: string;
  summary: string;
  type: string;
  source: "mentor" | "custom" | "recommended";
}

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
  activeOverlayData: DragOverlayData | null;
  overId: string | null;
  recentlyDroppedId: string | null;

  // Configuration
  sensors: ReturnType<typeof useSensors>;
  dndContextProps: {
    collisionDetection: CollisionDetection;
    modifiers: (typeof restrictToWindowEdges)[];
    measuring: { droppable: { strategy: MeasuringStrategy } };
  };

  // Handlers
  handleDragStart: (event: DragStartEvent) => void;
  handleDragOver: (event: DragOverEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: (event: DragCancelEvent) => void;
}

/**
 * Resolves the target timeframe from a drop event.
 * If the target is a stage column id, returns it directly.
 * If the target is an objective id, returns that objective's timeframe.
 */
function resolveTargetTimeframe(
  targetId: string,
  canvasObjectives: UserProgressObjective[]
): CanvasStage | null {
  if (STAGES.includes(targetId as CanvasStage)) {
    return targetId as CanvasStage;
  }
  const targetObj = canvasObjectives.find((o) => o.id === targetId);
  return targetObj?.timeframe ?? null;
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
  const [activeOverlayData, setActiveOverlayData] = useState<DragOverlayData | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const [recentlyDroppedId, setRecentlyDroppedId] = useState<string | null>(null);
  const dropAnimationTimer = useRef<ReturnType<typeof setTimeout>>();

  // Sensors — PointerSensor for desktop, TouchSensor for mobile
  // Touch uses distance constraint instead of delay for snappier activation
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Custom collision detection: use pointerWithin first (more precise for columns),
  // fall back to rectIntersection for edge cases (e.g. keyboard navigation)
  const collisionDetection: CollisionDetection = useCallback(
    (args) => {
      const pointerCollisions = pointerWithin(args);
      if (pointerCollisions.length > 0) {
        return pointerCollisions;
      }
      return rectIntersection(args);
    },
    []
  );

  // DndContext configuration — memoized to avoid re-creating on every render
  const dndContextProps = useMemo(
    () => ({
      collisionDetection,
      modifiers: [restrictToWindowEdges] as (typeof restrictToWindowEdges)[],
      measuring: {
        droppable: {
          strategy: MeasuringStrategy.WhileDragging,
        },
      },
    }),
    [collisionDetection]
  );

  // ---------- State reset helper ----------
  const resetDragState = useCallback(() => {
    setDraggingId(null);
    setActiveObjective(null);
    setActiveOverlayData(null);
    setOverId(null);
  }, []);

  // ---------- Drop animation helper ----------
  const triggerDropAnimation = useCallback((id: string) => {
    if (dropAnimationTimer.current) {
      clearTimeout(dropAnimationTimer.current);
    }
    setRecentlyDroppedId(id);
    dropAnimationTimer.current = setTimeout(() => setRecentlyDroppedId(null), 350);
  }, []);

  // ---------- Handlers ----------

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      setDraggingId(id);

      // 1. Check canvas objectives (sortable cards on the board)
      const canvasObj = canvasObjectives.find((o) => o.id === id);
      if (canvasObj) {
        setActiveObjective(canvasObj);
        setActiveOverlayData({
          id: canvasObj.id,
          title: canvasObj.title,
          summary: canvasObj.summary,
          type: canvasObj.type,
          source: canvasObj.source as "mentor" | "custom",
        });
        return;
      }

      // 2. Check recommended objectives
      const recommendedObj = recommendedObjectives.find((o) => o.key === id);
      if (recommendedObj) {
        setActiveObjective(null);
        setActiveOverlayData({
          id: recommendedObj.key,
          title: recommendedObj.title,
          summary: recommendedObj.summary,
          type: recommendedObj.type,
          source: "recommended",
        });
        return;
      }

      // 3. Fallback — no overlay data
      setActiveObjective(null);
      setActiveOverlayData(null);
    },
    [canvasObjectives, recommendedObjectives]
  );

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const { over } = event;
    setOverId((over?.id as string) ?? null);
  }, []);

  const handleDragCancel = useCallback(
    (_event: DragCancelEvent) => {
      resetDragState();
    },
    [resetDragState]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      resetDragState();

      if (!over || !profileId || isMapLocked) return;

      const draggedId = active.id as string;
      const targetId = over.id as string;

      // --- Scenario 1: Dropping a recommended objective onto the canvas ---
      const recommendedObj = recommendedObjectives.find((obj) => obj.key === draggedId);
      if (recommendedObj) {
        const alreadyAssigned = userObjectives.some((obj) => obj.title === recommendedObj.title);
        if (alreadyAssigned) {
          toast.error("Este objetivo ya está en tu canvas");
          return;
        }

        // Resolve timeframe — works whether dropped on a column or on an objective card
        const targetTimeframe = resolveTargetTimeframe(targetId, canvasObjectives) ?? "now";

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

        trackEvent("objective_added_to_canvas", {
          source: "recommended",
          timeframe: targetTimeframe,
          objective_title: recommendedObj.title,
          domain: recommendedObj.domainKey,
          method: "drag",
        });

        triggerDropAnimation(draggedId);
        return;
      }

      // --- Scenario 2: Moving a canvas objective to a different column ---
      const activeObj = canvasObjectives.find((o) => o.id === draggedId);
      if (!activeObj) return;
      if (activeObj.source === "mentor") return; // Can't move mentor objectives

      const targetTimeframe = resolveTargetTimeframe(targetId, canvasObjectives);
      if (!targetTimeframe) return;

      // Cross-column move
      if (activeObj.timeframe !== targetTimeframe) {
        const targetStageObjectives = objectivesByStage[targetTimeframe];
        const newPosition = targetStageObjectives.length;

        const previousObjectives = queryClient.getQueryData<UserProgressObjective[]>([
          "user-progress-objectives",
          profileId,
        ]);

        queryClient.setQueryData<UserProgressObjective[]>(
          ["user-progress-objectives", profileId],
          (old) =>
            old?.map((obj) =>
              obj.id === activeObj.id
                ? { ...obj, timeframe: targetTimeframe, position: newPosition }
                : obj
            ) ?? []
        );

        updateUserObjective.mutate(
          {
            id: activeObj.id,
            userId: profileId,
            updates: { timeframe: targetTimeframe, position: newPosition },
          },
          {
            onError: () => {
              queryClient.setQueryData(["user-progress-objectives", profileId], previousObjectives);
              toast.error("Error al mover el objetivo. Intenta nuevamente.");
            },
          }
        );

        triggerDropAnimation(draggedId);
        return;
      }

      // --- Scenario 3: Reordering within the same column ---
      const overObj = canvasObjectives.find((o) => o.id === targetId);
      if (!overObj || overObj.timeframe !== activeObj.timeframe) return;

      const stageObjectives = objectivesByStage[activeObj.timeframe];
      const oldIndex = stageObjectives.findIndex((o) => o.id === draggedId);
      const newIndex = stageObjectives.findIndex((o) => o.id === targetId);

      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;

      const reorderedObjectives = arrayMove(stageObjectives, oldIndex, newIndex);

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

      const updates = reorderedObjectives.map((obj, idx) => ({
        id: obj.id,
        position: idx,
      }));

      Promise.all(
        updates.map(({ id, position }) =>
          supabase.from("user_progress_objectives").update({ position }).eq("id", id)
        )
      ).catch(() => {
        queryClient.setQueryData(["user-progress-objectives", profileId], previousObjectives);
        toast.error("Error al reordenar. Intenta nuevamente.");
      });

      triggerDropAnimation(draggedId);
    },
    [
      resetDragState,
      triggerDropAnimation,
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
    activeOverlayData,
    overId,
    recentlyDroppedId,
    // Configuration
    sensors,
    dndContextProps,
    // Handlers
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  };
}
