import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Lock, Sparkles } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallCard } from "@/components/PaywallCard";
import { Seo } from "@/components/Seo";
import { useRecommendedObjectives, GeneratedObjective } from "@/hooks/useRecommendedObjectives";
import {
  useUserProgressObjectives,
  useCreateUserObjective,
  useUpdateUserObjective,
  useDeleteUserObjective,
} from "@/hooks/useUserProgressObjectives";
import type { UserProgressObjective } from "@/hooks/useUserProgressObjectives";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragOverlay } from "@dnd-kit/core";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import { useCareerPathPdfExport } from "@/hooks/useCareerPathPdfExport";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";
import type { CanvasStage } from "@/types/progress";
import { toast } from "sonner";
import { CareerPathHeader } from "@/components/progress/CareerPathHeader";
import { CanvasStageColumn } from "@/components/progress/CanvasStageColumn";
import { DragOverlayCard } from "@/components/progress/DragOverlayCard";
import { ObjectiveAvailableColumn } from "@/components/progress/ObjectiveAvailableColumn";
import { RecommendedObjectivesColumn } from "@/components/progress/RecommendedObjectivesColumn";
import { AddCustomObjectiveDialog } from "@/components/progress/AddCustomObjectiveDialog";
import {
  type AddCustomObjectiveState,
  type StageObjectivesMap,
  MAX_CUSTOM_OBJECTIVES,
  STAGES,
  initialCustomState,
  isCompleted,
} from "@/components/progress/shared";

export default function Progress() {
  const location = useLocation();
  const isDemoMode = import.meta.env.DEV && new URLSearchParams(location.search).has("demo");
  const { hasActivePremium, loading: subscriptionLoading } = useSubscription({ skip: isDemoMode });
  const { profile, loading: profileLoading } = useUserProfile();
  const profileId = profile?.id;
  const queryClient = useQueryClient();
  const { trackEvent } = useMixpanelTracking();
  const hasTrackedPageView = useRef(false);

  // Data
  const {
    recommendedObjectives,
    isLoading: loadingRecommended,
    dismissObjective,
    isDismissing,
  } = useRecommendedObjectives();
  const { data: userObjectives = [], isLoading: loadingUser } = useUserProgressObjectives(profileId);

  // Mutations
  const createUserObjective = useCreateUserObjective();
  const updateUserObjective = useUpdateUserObjective();
  const deleteUserObjective = useDeleteUserObjective();

  // UI state
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customState, setCustomState] = useState<AddCustomObjectiveState>(initialCustomState);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);

  const isLoadingData = loadingRecommended || loadingUser;
  const isFullyLoaded = !subscriptionLoading && !profileLoading && !isLoadingData;
  const hasAccess = isDemoMode || hasActivePremium;

  const isMapLocked =
    userObjectives.length > 0 && userObjectives.every((obj) => obj.is_locked);

  const { mentorObjectives, customObjectives } = useMemo(() => {
    const mentor = userObjectives.filter((obj) => obj.source === "mentor");
    const custom = userObjectives.filter((obj) => obj.source === "custom");
    return { mentorObjectives: mentor, customObjectives: custom };
  }, [userObjectives]);

  const customObjectivesCreatedCount = useMemo(
    () => customObjectives.filter((obj) => obj.objective_id === null).length,
    [customObjectives]
  );
  const customObjectiveLimitReached = customObjectivesCreatedCount >= MAX_CUSTOM_OBJECTIVES;
  const remainingCustomSlots = Math.max(0, MAX_CUSTOM_OBJECTIVES - customObjectivesCreatedCount);

  const canvasObjectives = useMemo(
    () => [...mentorObjectives, ...customObjectives],
    [mentorObjectives, customObjectives]
  );

  const objectivesByStage = useMemo<StageObjectivesMap>(() => {
    const result = canvasObjectives.reduce<StageObjectivesMap>(
      (acc, objective) => {
        acc[objective.timeframe].push(objective);
        return acc;
      },
      { now: [], soon: [], later: [] }
    );
    result.now.sort((a, b) => a.position - b.position);
    result.soon.sort((a, b) => a.position - b.position);
    result.later.sort((a, b) => a.position - b.position);
    return result;
  }, [canvasObjectives]);

  const { completedObjectives, completionRate } = useMemo(() => {
    const completed = canvasObjectives.filter((obj) => isCompleted(obj));
    const rate = canvasObjectives.length
      ? Math.round((completed.length / canvasObjectives.length) * 100)
      : 0;
    return { completedObjectives: completed, completionRate: rate };
  }, [canvasObjectives]);

  const {
    draggingId,
    activeOverlayData,
    overId,
    recentlyDroppedId,
    sensors,
    dndContextProps,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop({
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
  });

  // PDF export
  const getPdfTrackingPayload = useCallback(
    () => ({
      objectives_count: canvasObjectives.length,
      completion_rate: completionRate,
      completed_objectives: completedObjectives.length,
      is_locked: isMapLocked,
    }),
    [canvasObjectives.length, completionRate, completedObjectives.length, isMapLocked]
  );
  const { exportRef, isExportingPdf, handleExportPdf } = useCareerPathPdfExport({
    trackEvent,
    getTrackingPayload: getPdfTrackingPayload,
  });

  // Page view tracking
  useEffect(() => {
    if (isFullyLoaded && hasAccess && !hasTrackedPageView.current) {
      hasTrackedPageView.current = true;
      trackEvent("career_path_page_view", {
        has_objectives: canvasObjectives.length > 0,
        objectives_count: canvasObjectives.length,
        completed_count: completedObjectives.length,
        completion_rate: completionRate,
        is_locked: isMapLocked,
        objectives_by_stage: {
          now: objectivesByStage.now.length,
          soon: objectivesByStage.soon.length,
          later: objectivesByStage.later.length,
        },
      });
    }
  }, [
    isFullyLoaded,
    hasAccess,
    trackEvent,
    canvasObjectives.length,
    completedObjectives.length,
    completionRate,
    isMapLocked,
    objectivesByStage,
  ]);

  const toggleStep = useCallback(
    (objective: UserProgressObjective, stepId: string) => {
      if (!profileId) return;

      const step = objective.steps.find((s) => s.id === stepId);
      const isCompletingStep = step && !step.completed;

      const updatedSteps = objective.steps.map((s) =>
        s.id === stepId ? { ...s, completed: !s.completed } : s
      );
      const allCompleted = updatedSteps.every((s) => s.completed);

      if (isCompletingStep) {
        trackEvent("objective_step_completed", {
          objective_title: objective.title,
          step_title: step.title,
          is_objective_completed: allCompleted,
          source: objective.source,
        });
      }

      const previousObjectives = queryClient.getQueryData<UserProgressObjective[]>([
        "user-progress-objectives",
        profileId,
      ]);

      queryClient.setQueryData<UserProgressObjective[]>(
        ["user-progress-objectives", profileId],
        (old) =>
          old?.map((obj) =>
            obj.id === objective.id
              ? {
                  ...obj,
                  steps: updatedSteps,
                  status: allCompleted ? "completed" : "in-progress",
                }
              : obj
          ) ?? []
      );

      updateUserObjective.mutate(
        {
          id: objective.id,
          userId: profileId,
          updates: {
            steps: updatedSteps,
            status: allCompleted ? "completed" : "in-progress",
          },
        },
        {
          onError: () => {
            queryClient.setQueryData(
              ["user-progress-objectives", profileId],
              previousObjectives
            );
            toast.error("Error al actualizar. Intenta nuevamente.");
          },
        }
      );

      if (allCompleted && isCompletingStep) {
        toast.success("🎉 ¡Objetivo completado!", {
          description: `Excelente trabajo con "${objective.title}"`,
        });
      }
    },
    [profileId, updateUserObjective, trackEvent, queryClient]
  );

  const handleDeleteCustom = useCallback(
    (id: string) => {
      if (!profileId || isMapLocked) return;
      deleteUserObjective.mutate({ id, userId: profileId });
    },
    [profileId, isMapLocked, deleteUserObjective]
  );

  const lockUserObjectives = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_progress_objectives")
        .update({
          is_locked: true,
          locked_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("is_locked", false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-progress-objectives", profileId] });
      toast.success("Tu Career Path ha sido guardado exitosamente");
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        console.error("Error locking objectives:", error);
      }
      toast.error("Error al guardar tu Career Path");
    },
  });

  const handleLockCareerPath = useCallback(() => {
    if (!profileId) return;

    trackEvent("career_path_saved", {
      objectives_count: canvasObjectives.length,
      completion_rate: completionRate,
      now_count: objectivesByStage.now.length,
      soon_count: objectivesByStage.soon.length,
      later_count: objectivesByStage.later.length,
      source_mentor_count: mentorObjectives.length,
      source_custom_count: customObjectives.length,
      objectives_by_stage: {
        now: objectivesByStage.now.length,
        soon: objectivesByStage.soon.length,
        later: objectivesByStage.later.length,
      },
    });

    lockUserObjectives.mutate(profileId);
    setIsLockDialogOpen(false);
  }, [
    lockUserObjectives,
    profileId,
    trackEvent,
    canvasObjectives.length,
    completionRate,
    objectivesByStage,
    mentorObjectives.length,
    customObjectives.length,
  ]);

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCustomState(initialCustomState);
    }
  }, []);

  const addCustomObjective = useCallback(() => {
    const trimmedType = customState.type.trim();
    if (
      customObjectiveLimitReached ||
      !customState.title.trim() ||
      !trimmedType ||
      !profileId ||
      isMapLocked
    ) {
      return;
    }

    const steps = customState.stepsText
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: `c-${Date.now()}-${index}`,
        title: line,
        completed: false,
      }));

    createUserObjective.mutate({
      userId: profileId,
      title: customState.title,
      summary: customState.summary,
      type: trimmedType,
      timeframe: customState.timeframe,
      steps,
      dueDate: customState.dueDate
        ? customState.dueDate.toISOString().split("T")[0]
        : undefined,
    });

    trackEvent("objective_added_to_canvas", {
      source: "custom",
      timeframe: customState.timeframe,
      objective_title: customState.title,
      method: "custom_dialog",
    });

    handleDialogChange(false);
  }, [
    customObjectiveLimitReached,
    customState,
    profileId,
    isMapLocked,
    createUserObjective,
    handleDialogChange,
    trackEvent,
  ]);

  const handleQuickAddRecommended = useCallback(
    (objective: GeneratedObjective, timeframe: CanvasStage = "now") => {
      if (!profileId || isMapLocked) return;

      const alreadyAssigned = userObjectives.some((obj) => obj.title === objective.title);
      if (alreadyAssigned) {
        toast.error("Este objetivo ya está en tu canvas");
        return;
      }

      createUserObjective.mutate({
        userId: profileId,
        title: objective.title,
        summary: objective.summary,
        type: objective.type,
        timeframe,
        steps: objective.steps.map((step, idx) => ({
          id: `step-${Date.now()}-${idx}`,
          title: step.title,
          completed: false,
        })),
      });

      trackEvent("objective_added_to_canvas", {
        source: "recommended",
        timeframe,
        objective_title: objective.title,
        domain: objective.domainKey,
        method: "quick_add_mobile",
      });
    },
    [profileId, isMapLocked, userObjectives, createUserObjective, trackEvent]
  );

  const handleDismissRecommended = useCallback(
    async (objectiveKey: string) => {
      if (isDismissing) return;
      await dismissObjective(objectiveKey);
    },
    [isDismissing, dismissObjective]
  );

  if ((subscriptionLoading || profileLoading || isLoadingData) && !isDemoMode) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Sparkles className="h-6 w-6 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Armando tu Career Path...</p>
        </div>
      </div>
    );
  }

  if (isFullyLoaded && !hasAccess) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <PaywallCard
          title="Desbloquea tu Plan de Carrera"
          feature="progreso personalizado"
        />
      </div>
    );
  }

  return (
    <>
      <Seo
        title="Career Path — ProductPrepa"
        description="Construí y visualizá tu Career Path personalizado con tus objetivos prioritarios."
        canonical="/progreso"
        keywords="career path PM, objetivos carrera, roadmap producto, desarrollo profesional, metas PM"
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 animate-fade-in">
        <div ref={exportRef} className="container py-10 space-y-8">
          <CareerPathHeader
            totalObjectives={canvasObjectives.length}
            completedCount={completedObjectives.length}
            completionRate={completionRate}
            isMapLocked={isMapLocked}
            isExportingPdf={isExportingPdf}
            onSave={() => setIsLockDialogOpen(true)}
            onExport={handleExportPdf}
          />

          {isMapLocked && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Career Path Guardado</AlertTitle>
              <AlertDescription>
                Tu mapa ha sido guardado. Podés seguir completando los pasos de tus objetivos.
                Para agregar o mover objetivos, contactanos.
              </AlertDescription>
            </Alert>
          )}

          <DndContext
            sensors={sensors}
            collisionDetection={dndContextProps.collisionDetection}
            modifiers={dndContextProps.modifiers}
            measuring={dndContextProps.measuring}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
          >
            <section>
              <div className="relative">
                <div className="absolute inset-x-10 -top-10 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
                <div className="relative rounded-3xl border bg-card/70 backdrop-blur-sm shadow-xl overflow-hidden career-path-canvas-shell">
                  <div className="grid md:grid-cols-3 gap-0 md:gap-0">
                    {STAGES.map((stage) => (
                      <CanvasStageColumn
                        key={stage.key}
                        stage={stage}
                        objectives={objectivesByStage[stage.key]}
                        draggingId={draggingId}
                        overId={overId}
                        toggleStep={toggleStep}
                        onDeleteCustom={handleDeleteCustom}
                        isMapLocked={isMapLocked}
                        showEmptyState={canvasObjectives.length === 0 && stage.key === "now"}
                        recentlyDroppedId={recentlyDroppedId}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <DragOverlay
              dropAnimation={{
                duration: 250,
                easing: "cubic-bezier(0.18, 0.67, 0.6, 1.22)",
              }}
            >
              {activeOverlayData ? <DragOverlayCard data={activeOverlayData} /> : null}
            </DragOverlay>

            {!isMapLocked && (
              <section className="space-y-6 print:hidden">
                <div className="flex flex-col gap-4">
                  <div>
                    <h2 className="text-xl md:text-2xl font-semibold">Objetivos disponibles</h2>
                    <p className="text-sm text-muted-foreground">
                      Arrastrá cualquier objetivo hacia el canvas para integrarlo a tu camino
                      profesional.
                    </p>
                  </div>

                  <AddCustomObjectiveDialog
                    open={isDialogOpen}
                    onOpenChange={handleDialogChange}
                    state={customState}
                    onStateChange={setCustomState}
                    onSubmit={addCustomObjective}
                    isMapLocked={isMapLocked}
                    limitReached={customObjectiveLimitReached}
                    remainingSlots={remainingCustomSlots}
                  />
                </div>

                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <RecommendedObjectivesColumn
                    title="✨ Recomendados para ti"
                    description="Objetivos personalizados basados en tu autoevaluación."
                    objectives={recommendedObjectives}
                    draggingId={draggingId}
                    onQuickAdd={handleQuickAddRecommended}
                    onDismiss={handleDismissRecommended}
                    isMapLocked={isMapLocked}
                    isDismissing={isDismissing}
                  />
                  <ObjectiveAvailableColumn
                    title="👨‍🏫 Derivados de mentorías"
                    description="Objetivos acordados junto a tu mentor."
                    objectives={mentorObjectives}
                    draggingId={draggingId}
                    locked
                  />
                  <ObjectiveAvailableColumn
                    title="✍️ Personalizados"
                    description="Define metas propias. Puedes crear hasta tres objetivos adicionales."
                    objectives={customObjectives}
                    draggingId={draggingId}
                    onDelete={handleDeleteCustom}
                  />
                </div>
              </section>
            )}
          </DndContext>
        </div>
      </div>

      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás listo para guardar tu Career Path?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Una vez guardado, tu mapa quedará finalizado.</p>
              <p className="font-medium">
                Si deseas editarlo nuevamente, deberás contactarte con nosotros.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleLockCareerPath}>
              Sí, guardar mi Career Path
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
