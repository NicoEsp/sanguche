import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress as ProgressBar } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallCard } from "@/components/PaywallCard";
import { Seo } from "@/components/Seo";
import { CalendarIcon, CheckCircle2, FileText, GripVertical, HelpCircle, Loader2, Lock, Plus, Save, Sparkles, Trash2, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CanvasStage, ProgressObjective } from "@/types/progress";
import { useRecommendedObjectives, GeneratedObjective } from "@/hooks/useRecommendedObjectives";
import { useUserProgressObjectives, useCreateUserObjective, useUpdateUserObjective, useDeleteUserObjective } from "@/hooks/useUserProgressObjectives";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragOverlay, useDraggable, useDroppable } from "@dnd-kit/core";
import { useDragAndDrop } from "@/hooks/useDragAndDrop";
import type { DragOverlayData } from "@/hooks/useDragAndDrop";
import { SortableContext, verticalListSortingStrategy, useSortable, arrayMove, defaultAnimateLayoutChanges } from "@dnd-kit/sortable";
import type { AnimateLayoutChanges } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { UserProgressObjective } from "@/hooks/useUserProgressObjectives";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useMixpanelTracking } from "@/hooks/useMixpanelTracking";

interface StageConfig {
  key: CanvasStage;
  label: string;
  description: string;
  gradient: string;
}
const STAGES: StageConfig[] = [{
  key: "now",
  label: "En foco",
  description: "Acciones inmediatas para impulsar tu crecimiento",
  gradient: "from-primary/20 via-primary/5 to-transparent"
}, {
  key: "soon",
  label: "Próximos pasos",
  description: "Metas para los próximos 60-90 días",
  gradient: "from-amber-200/40 via-amber-100/40 to-transparent"
}, {
  key: "later",
  label: "Visión",
  description: "Hitos estratégicos para tu carrera a largo plazo",
  gradient: "from-emerald-200/40 via-emerald-100/30 to-transparent"
}];

type StageObjectivesMap = Record<CanvasStage, UserProgressObjective[]>;
type AvailableObjective = {
  id: string;
  title: string;
  summary: string;
  type: string;
  steps?: Array<{ id: string; title: string; completed: boolean }>;
  source?: string | null;
  dueDate?: string | null;
  due_date?: string | null;
};

const getObjectiveDueDate = (objective: AvailableObjective) => {
  if ("due_date" in objective) {
    return objective.due_date ?? undefined;
  }
  return objective.dueDate;
};
interface AddCustomObjectiveState {
  title: string;
  summary: string;
  type: string;
  timeframe: CanvasStage;
  dueDate?: Date;
  stepsText: string;
}
const initialCustomState: AddCustomObjectiveState = {
  title: "",
  summary: "",
  type: "Habilidad técnica",
  timeframe: "soon",
  dueDate: undefined,
  stepsText: ""
};
const longDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long"
});
const formatDueDate = (date?: string) => {
  if (!date) return "Sin fecha";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) {
    return "Sin fecha";
  }
  return longDateFormatter.format(parsed);
};
const isCompleted = (objective: ProgressObjective | UserProgressObjective) => {
  if (objective.steps.length > 0) {
    return objective.steps.every(step => step.completed);
  }
  return objective.status === "completed";
};
const MAX_CUSTOM_OBJECTIVES = 3;

export default function Progress() {
  const location = useLocation();
  const isDemoMode = import.meta.env.DEV && new URLSearchParams(location.search).has("demo");
  const { hasActivePremium, loading: subscriptionLoading } = useSubscription({ skip: isDemoMode });
  const { profile, loading: profileLoading } = useUserProfile();
  const profileId = profile?.id;
  const queryClient = useQueryClient();
  const { trackEvent } = useMixpanelTracking();
  const hasTrackedPageView = useRef(false);
  
  // Fetch data from DB
  const { recommendedObjectives, isLoading: loadingRecommended, dismissObjective, isDismissing } = useRecommendedObjectives();
  const { data: userObjectives = [], isLoading: loadingUser } = useUserProgressObjectives(profileId);
  
  // Mutations
  const createUserObjective = useCreateUserObjective();
  const updateUserObjective = useUpdateUserObjective();
  const deleteUserObjective = useDeleteUserObjective();
  
  // UI state (non-DnD)
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customState, setCustomState] = useState<AddCustomObjectiveState>(initialCustomState);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  const isLoadingData = loadingRecommended || loadingUser;
  const isFullyLoaded = !subscriptionLoading && !profileLoading && !isLoadingData;
  const hasAccess = isDemoMode || hasActivePremium;
  
  // Check if map is locked
  const isMapLocked = userObjectives.length > 0 && userObjectives.every(obj => obj.is_locked);
  
  // Separate objectives by source with memoization to keep stable references
  const { mentorObjectives, customObjectives } = useMemo(() => {
    const mentor = userObjectives.filter(obj => obj.source === 'mentor');
    const custom = userObjectives.filter(obj => obj.source === 'custom');
    return { mentorObjectives: mentor, customObjectives: custom };
  }, [userObjectives]);
  const customObjectivesCreatedCount = useMemo(
    () => customObjectives.filter(obj => obj.objective_id === null).length,
    [customObjectives]
  );
  const customObjectiveLimitReached = customObjectivesCreatedCount >= MAX_CUSTOM_OBJECTIVES;
  const remainingCustomSlots = Math.max(0, MAX_CUSTOM_OBJECTIVES - customObjectivesCreatedCount);
  
  // Canvas objectives (mentor + custom)
  const canvasObjectives = useMemo(() => [...mentorObjectives, ...customObjectives], [mentorObjectives, customObjectives]);
  const objectivesByStage = useMemo<StageObjectivesMap>(() => {
    const result = canvasObjectives.reduce<StageObjectivesMap>((acc, objective) => {
      acc[objective.timeframe].push(objective);
      return acc;
    }, {
      now: [],
      soon: [],
      later: []
    });
    // Sort each stage by position
    result.now.sort((a, b) => a.position - b.position);
    result.soon.sort((a, b) => a.position - b.position);
    result.later.sort((a, b) => a.position - b.position);
    return result;
  }, [canvasObjectives]);
  const { completedObjectives, completionRate } = useMemo(() => {
    const completed = canvasObjectives.filter(obj => isCompleted(obj));
    const rate = canvasObjectives.length ? Math.round((completed.length / canvasObjectives.length) * 100) : 0;
    return { completedObjectives: completed, completionRate: rate };
  }, [canvasObjectives]);

  // DnD hook - must be called after all dependencies are defined
  const {
    draggingId,
    activeObjective,
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

  // Track page view once when fully loaded
  useEffect(() => {
    if (isFullyLoaded && hasAccess && !hasTrackedPageView.current) {
      hasTrackedPageView.current = true;
      trackEvent('career_path_page_view', {
        has_objectives: canvasObjectives.length > 0,
        objectives_count: canvasObjectives.length,
        completed_count: completedObjectives.length,
        completion_rate: completionRate,
        is_locked: isMapLocked,
        objectives_by_stage: {
          now: objectivesByStage.now.length,
          soon: objectivesByStage.soon.length,
          later: objectivesByStage.later.length
        }
      });
    }
  }, [isFullyLoaded, hasAccess, trackEvent, canvasObjectives.length, completedObjectives.length, completionRate, isMapLocked, objectivesByStage]);

  const toggleStep = useCallback((objective: UserProgressObjective, stepId: string) => {
    if (!profileId) return;

    const step = objective.steps.find(s => s.id === stepId);
    const isCompletingStep = step && !step.completed;

    const updatedSteps = objective.steps.map(s =>
      s.id === stepId ? { ...s, completed: !s.completed } : s
    );
    const allCompleted = updatedSteps.every(s => s.completed);

    // Track step completion
    if (isCompletingStep) {
      trackEvent('objective_step_completed', {
        objective_title: objective.title,
        step_title: step.title,
        is_objective_completed: allCompleted,
        source: objective.source
      });
    }

    // Optimistic update - update cache immediately for instant feedback
    const previousObjectives = queryClient.getQueryData<UserProgressObjective[]>(['user-progress-objectives', profileId]);
    
    queryClient.setQueryData<UserProgressObjective[]>(
      ['user-progress-objectives', profileId],
      (old) => old?.map(obj => 
        obj.id === objective.id 
          ? { 
              ...obj, 
              steps: updatedSteps,
              status: allCompleted ? 'completed' : 'in-progress',
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
          status: allCompleted ? 'completed' : 'in-progress',
        },
      },
      {
        onError: () => {
          // Revert on error
          queryClient.setQueryData(['user-progress-objectives', profileId], previousObjectives);
          toast.error('Error al actualizar. Intenta nuevamente.');
        },
      }
    );

    // Celebration toast when objective is completed
    if (allCompleted && isCompletingStep) {
      toast.success('🎉 ¡Objetivo completado!', {
        description: `Excelente trabajo con "${objective.title}"`,
      });
    }
  }, [profileId, updateUserObjective, trackEvent, queryClient]);

  const handleDeleteCustom = useCallback((id: string) => {
    if (!profileId || isMapLocked) return;
    deleteUserObjective.mutate({ id, userId: profileId });
  }, [profileId, isMapLocked, deleteUserObjective]);
  
  // Lock all user objectives
  const lockUserObjectives = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from('user_progress_objectives')
        .update({ 
          is_locked: true, 
          locked_at: new Date().toISOString() 
        })
        .eq('user_id', userId)
        .eq('is_locked', false);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress-objectives', profileId] });
      toast.success('Tu Career Path ha sido guardado exitosamente');
    },
    onError: (error: Error) => {
      if (import.meta.env.DEV) {
        console.error('Error locking objectives:', error);
      }
      toast.error('Error al guardar tu Career Path');
    }
  });
  
  const handleLockCareerPath = useCallback(() => {
    if (!profileId) return;
    
    // Track career path saved
    trackEvent('career_path_saved', {
      objectives_count: canvasObjectives.length,
      completion_rate: completionRate,
      objectives_by_stage: {
        now: objectivesByStage.now.length,
        soon: objectivesByStage.soon.length,
        later: objectivesByStage.later.length
      }
    });
    
    lockUserObjectives.mutate(profileId);
    setIsLockDialogOpen(false);
  }, [lockUserObjectives, profileId, trackEvent, canvasObjectives.length, completionRate, objectivesByStage]);

  const handleExportPdf = useCallback(() => {
    const exportNode = exportRef.current;

    if (!exportNode) {
      toast.error('No pudimos preparar tu Career Path para exportarlo.');
      return;
    }

    // Track PDF export
    trackEvent('career_path_pdf_exported', {
      objectives_count: canvasObjectives.length,
      completion_rate: completionRate,
      completed_objectives: completedObjectives.length
    });

    setIsExportingPdf(true);

    try {
      const clonedNode = exportNode.cloneNode(true) as HTMLElement;
      const printRoot = document.createElement('div');
      const styleTag = document.createElement('style');
      const cleanupCallbacks: (() => void)[] = [];
      let cleanedUp = false;

      printRoot.id = 'career-path-print-root';
      printRoot.setAttribute('data-career-path-print', 'true');
      printRoot.style.position = 'fixed';
      printRoot.style.inset = '0';
      printRoot.style.overflow = 'auto';
      printRoot.style.backgroundColor = '#ffffff';
      printRoot.style.padding = '0';
      printRoot.style.width = '100%';
      printRoot.style.minHeight = '100%';
      printRoot.appendChild(clonedNode);

      styleTag.id = 'career-path-print-styles';
      styleTag.textContent = `
        @media screen {
          [data-career-path-print] {
            display: none !important;
          }
        }

        @media print {
          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #0f172a !important;
          }

          #career-path-print-root {
            display: block !important;
            padding: 24px !important;
          }

          body > :not(#career-path-print-root) {
            display: none !important;
          }
        }
      `;

      document.body.appendChild(printRoot);
      document.head.appendChild(styleTag);

      const finalize = () => {
        if (cleanedUp) return;
        cleanedUp = true;

        cleanupCallbacks.forEach(fn => fn());
        printRoot.remove();
        styleTag.remove();
        setIsExportingPdf(false);
        toast.success('Usá la opción "Guardar como PDF" para descargar tu Career Path.');
      };

      const afterPrintHandler = () => finalize();

      if (typeof window.matchMedia === 'function') {
        const mediaQueryList = window.matchMedia('print');

        if (mediaQueryList.addEventListener) {
          const listener = (event: MediaQueryListEvent) => {
            if (!event.matches) {
              finalize();
            }
          };

          mediaQueryList.addEventListener('change', listener);
          cleanupCallbacks.push(() => mediaQueryList.removeEventListener('change', listener));
        } else if (mediaQueryList.addListener) {
          const legacyListener = (event: MediaQueryListEvent) => {
            if (!event.matches) {
              finalize();
            }
          };

          mediaQueryList.addListener(legacyListener);
          cleanupCallbacks.push(() => mediaQueryList.removeListener(legacyListener));
        }
      }

      window.addEventListener('afterprint', afterPrintHandler, { once: true });
      cleanupCallbacks.push(() => window.removeEventListener('afterprint', afterPrintHandler));

      const fallbackTimeout = window.setTimeout(() => finalize(), 60000);
      cleanupCallbacks.push(() => window.clearTimeout(fallbackTimeout));

      requestAnimationFrame(() => {
        window.focus();
        window.print();
      });
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Error exporting Career Path as PDF:', error);
      }
      document.getElementById('career-path-print-root')?.remove();
      document.getElementById('career-path-print-styles')?.remove();
      toast.error('No pudimos exportar tu Career Path. Intentá nuevamente.');
      setIsExportingPdf(false);
    }
  }, [trackEvent, canvasObjectives.length, completionRate, completedObjectives.length]);

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCustomState(initialCustomState);
    }
  }, []);

  const addCustomObjective = useCallback(() => {
    if (customObjectiveLimitReached || !customState.title.trim() || !profileId || isMapLocked) {
      return;
    }

    const steps = customState.stepsText
      .split("\n")
      .map(line => line.trim())
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
      type: customState.type,
      timeframe: customState.timeframe,
      steps,
      dueDate: customState.dueDate ? customState.dueDate.toISOString().split('T')[0] : undefined,
    });

    // Track custom objective created
    trackEvent('objective_added_to_canvas', {
      source: 'custom',
      timeframe: customState.timeframe,
      objective_title: customState.title,
      method: 'custom_dialog'
    });

    handleDialogChange(false);
  }, [customObjectiveLimitReached, customState, profileId, isMapLocked, createUserObjective, handleDialogChange, trackEvent]);

  // Quick add handler for mobile - works with recommended objectives
  const handleQuickAddRecommended = useCallback((objective: GeneratedObjective, timeframe: CanvasStage = 'now') => {
    if (!profileId || isMapLocked) return;
    
    // Check for duplicate by title
    const alreadyAssigned = userObjectives.some(obj => obj.title === objective.title);
    if (alreadyAssigned) {
      toast.error('Este objetivo ya está en tu canvas');
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
    
    trackEvent('objective_added_to_canvas', {
      source: 'recommended',
      timeframe,
      objective_title: objective.title,
      domain: objective.domainKey,
      method: 'quick_add_mobile'
    });
  }, [profileId, isMapLocked, userObjectives, createUserObjective, trackEvent]);

  // Dismiss recommended objective handler
  const handleDismissRecommended = useCallback(async (objectiveKey: string) => {
    if (isDismissing) return;
    await dismissObjective(objectiveKey);
  }, [isDismissing, dismissObjective]);

  // Mostrar loading mientras carga
  if ((subscriptionLoading || profileLoading || isLoadingData) && !isDemoMode) {
    return <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Sparkles className="h-6 w-6 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Armando tu Career Path...</p>
        </div>
      </div>;
  }
  
  // Solo mostrar Paywall cuando datos están cargados y confirmamos que NO es premium
  if (isFullyLoaded && !hasAccess) {
    return <div className="container mx-auto p-6 max-w-4xl">
        <PaywallCard
          title="Desbloquea tu Plan de Carrera"
          feature="progreso personalizado"
        />
      </div>;
  }
  return <>
      <Seo 
        title="Career Path — ProductPrepa" 
        description="Construí y visualizá tu Career Path personalizado con tus objetivos prioritarios." 
        canonical="/progreso" 
        keywords="career path PM, objetivos carrera, roadmap producto, desarrollo profesional, metas PM"
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 animate-fade-in">
        <div ref={exportRef} className="container py-10 space-y-8">
          <header className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <Badge variant="outline" className="w-fit text-primary border-primary/40 bg-primary/5">
                  Premium exclusivo
                </Badge>
                
                <div className="flex items-center justify-between gap-4">
                  <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight">
                    Tu Career Path
                  </h1>

                  <div className="flex items-center gap-3 print:hidden">
                    {/* Botón Guardar - Solo visible si NO está locked */}
                    {!isMapLocked && canvasObjectives.length > 0 && (
                      <Button
                        onClick={() => setIsLockDialogOpen(true)}
                        className="gap-2"
                      >
                        <Save className="h-4 w-4" />
                        Guardar Career Path
                      </Button>
                    )}
                    
                    {/* Botón Exportar PDF - Siempre visible pero disabled si no locked */}
                    {canvasObjectives.length > 0 && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="inline-flex">
                              <Button
                                disabled={!isMapLocked || isExportingPdf}
                                variant="outline"
                                className={cn(
                                  "gap-2",
                                  !isMapLocked && "cursor-not-allowed",
                                  isExportingPdf && "pointer-events-none opacity-80"
                                )}
                                onClick={isMapLocked ? handleExportPdf : undefined}
                              >
                                {isExportingPdf ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Generando PDF...
                                  </>
                                ) : (
                                  <>
                                    <FileText className="h-4 w-4" />
                                    Exportar PDF
                                  </>
                                )}
                              </Button>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            {isMapLocked
                              ? "Descargá tu Career Path en PDF"
                              : "Primero debes guardar tu Career Path para exportarlo"}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                </div>
              </div>

              <div className="bg-card border shadow-sm rounded-xl px-4 py-3 md:px-6 md:py-4">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Completados</p>
                  <p className="text-2xl md:text-3xl font-semibold">
                        {completedObjectives.length}
                        <span className="text-base text-muted-foreground">
                          /{canvasObjectives.length}
                        </span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex-1 max-w-[200px]">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>Avance</span>
                      <span className="font-medium">{completionRate}%</span>
                    </div>
                    <ProgressBar 
                      value={completionRate} 
                      className={cn(
                        "h-2",
                        completionRate === 100 && "[&>div]:bg-emerald-500"
                      )} 
                    />
                  </div>
                  
                  {completionRate === 100 && canvasObjectives.length > 0 && (
                    <Badge className="bg-emerald-500 text-white hidden sm:flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      ¡Completado!
                    </Badge>
                  )}
                </div>
              </div>

              <p className="text-sm md:text-base text-muted-foreground">
                Arrastra objetivos sugeridos por ProductPrepa o creados en mentorías con NicoProducto para dar forma a tu Career Path. Agrúpalos por horizonte temporal y hacé seguimiento del avance paso a paso.
              </p>
            </div>
          </header>

          {/* Locked banner */}
          {isMapLocked && (
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertTitle>Career Path Guardado</AlertTitle>
              <AlertDescription>
                Tu mapa ha sido guardado. Podés seguir completando los pasos de tus objetivos. Para agregar o mover objetivos, contactanos.
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
                <div className="relative rounded-3xl border bg-card/70 backdrop-blur-sm shadow-xl overflow-hidden">
                  <div className="grid md:grid-cols-3 gap-0 md:gap-0">
                    {STAGES.map(stage => (
                      <CanvasStageColumn 
                        key={stage.key} 
                        stage={stage} 
                        objectives={objectivesByStage[stage.key]} 
                        draggingId={draggingId}
                        overId={overId}
                        toggleStep={toggleStep} 
                        onDeleteCustom={handleDeleteCustom} 
                        isMapLocked={isMapLocked}
                        showEmptyState={canvasObjectives.length === 0 && stage.key === 'now'}
                        recentlyDroppedId={recentlyDroppedId}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* DragOverlay — unified preview for all drag sources */}
            <DragOverlay dropAnimation={{
              duration: 250,
              easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
              {activeOverlayData ? (
                <DragOverlayCard data={activeOverlayData} />
              ) : null}
            </DragOverlay>

          {!isMapLocked && (
            <section className="space-y-6">
              <div className="flex flex-col gap-4">
                <div>
                  <h2 className="text-xl md:text-2xl font-semibold">Objetivos disponibles</h2>
                  <p className="text-sm text-muted-foreground">
                    Arrastrá cualquier objetivo hacia el canvas para integrarlo a tu camino profesional.
                  </p>
                </div>
                
                <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-2 sm:gap-3">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="inline-flex w-full sm:w-auto">
                            <DialogTrigger asChild>
                              <Button
                                disabled={customObjectiveLimitReached || isMapLocked}
                                className={cn(
                                  "w-full sm:w-auto",
                                  (customObjectiveLimitReached || isMapLocked) && "cursor-not-allowed"
                                )}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Objetivo personalizado
                              </Button>
                            </DialogTrigger>
                          </span>
                        </TooltipTrigger>
                        {(customObjectiveLimitReached || isMapLocked) && (
                          <TooltipContent>
                            {isMapLocked 
                              ? "Tu Career Path está guardado. Contactanos para editarlo."
                              : `Llegaste al límite de ${MAX_CUSTOM_OBJECTIVES} objetivos personalizados.`
                            }
                          </TooltipContent>
                        )}
                      </Tooltip>
                    </TooltipProvider>
                    {!customObjectiveLimitReached && !isMapLocked && (
                      <p className="text-xs text-muted-foreground sm:text-right">
                        Te quedan {remainingCustomSlots} objetivo{remainingCustomSlots === 1 ? '' : 's'} personalizado{remainingCustomSlots === 1 ? '' : 's'}.
                      </p>
                    )}
                  </div>
                  <DialogContent className="max-w-xl">
                    <DialogHeader>
                      <DialogTitle>Crea un objetivo personalizado</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="grid gap-2">
                        <Label htmlFor="title">Título</Label>
                        <Input
                          id="title"
                          value={customState.title}
                          onChange={event => setCustomState(prev => ({
                            ...prev,
                            title: event.target.value,
                          }))}
                          placeholder="Ej: Liderar discovery en nueva vertical"
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="summary">Descripción</Label>
                        <Textarea
                          id="summary"
                          value={customState.summary}
                          onChange={event => setCustomState(prev => ({
                            ...prev,
                            summary: event.target.value,
                          }))}
                          placeholder="Describe por qué este objetivo es relevante para tu plan."
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Tipo</Label>
                          <Input
                            value={customState.type}
                            onChange={event => setCustomState(prev => ({
                              ...prev,
                              type: event.target.value,
                            }))}
                          />
                        </div>
                        <div className="grid gap-2">
                          <Label>Horizonte temporal</Label>
                          <Select
                            value={customState.timeframe}
                            onValueChange={(value: CanvasStage) =>
                              setCustomState(prev => ({
                                ...prev,
                                timeframe: value,
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="now">En foco</SelectItem>
                              <SelectItem value="soon">Próximo paso</SelectItem>
                              <SelectItem value="later">Visión</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Fecha estimada</Label>
                        <div className="flex flex-col gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !customState.dueDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {customState.dueDate 
                                  ? format(customState.dueDate, "PPP", { locale: es }) 
                                  : "Seleccionar fecha..."
                                }
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={customState.dueDate}
                                onSelect={(date) => setCustomState(prev => ({ ...prev, dueDate: date }))}
                                initialFocus
                                className="pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          {customState.dueDate && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setCustomState(prev => ({ ...prev, dueDate: undefined }))}
                              className="text-xs w-fit"
                            >
                              Quitar fecha
                            </Button>
                          )}
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label>Checklist (uno por línea)</Label>
                        <Textarea
                          value={customState.stepsText}
                          onChange={event => setCustomState(prev => ({
                            ...prev,
                            stepsText: event.target.value,
                          }))}
                          placeholder={`Ejemplo:\n[✓] Leer libro "Continuous Discovery Habits"\n[ ] Aplicar template de Opportunity Solution Tree`}
                          className="min-h-[120px]"
                        />
                      </div>
                      <Button className="w-full" onClick={addCustomObjective} disabled={!customState.title.trim()}>
                        Guardar objetivo
                      </Button>
                    </div>
                    {customObjectiveLimitReached && (
                      <p className="text-xs text-muted-foreground">
                        Llegaste al máximo de objetivos personalizados creados ({MAX_CUSTOM_OBJECTIVES}).
                      </p>
                    )}
                  </DialogContent>
              </Dialog>
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
      
      {/* Lock confirmation dialog */}
      <AlertDialog open={isLockDialogOpen} onOpenChange={setIsLockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Estás listo para guardar tu Career Path?</AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Una vez guardado, tu mapa quedará finalizado.</p>
              <p className="font-medium">Si deseas editarlo nuevamente, deberás contactarte con nosotros.</p>
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
    </>;
}

// Unified DragOverlay card — shows for all drag sources
const DragOverlayCard = memo(function DragOverlayCard({ data }: { data: DragOverlayData }) {
  const sourceLabel = data.source === "recommended"
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

// Canvas Stage Column with droppable and sortable
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

const CanvasStageColumn = memo(function CanvasStageColumn({ stage, objectives, draggingId, overId, toggleStep, onDeleteCustom, isMapLocked, showEmptyState, recentlyDroppedId }: CanvasStageColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.key });
  const objectiveIds = useMemo(() => objectives.map(o => o.id), [objectives]);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative p-4 md:p-6 lg:p-8",
        "min-h-[400px] md:min-h-[500px]",
        "grid grid-rows-[auto_1fr]",
        "border-t md:border-t-0 md:border-l",
        "transition-all duration-200",
        draggingId && "border-primary/60",
        stage.key === "now" && "md:border-l-0 border-t-0",
        `bg-gradient-to-b ${stage.gradient}`
      )}
    >
      {/* Drop zone indicator — visible when dragging over this column */}
      {isOver && draggingId && (
        <div className="absolute inset-2 border-2 border-dashed border-primary/60 rounded-xl bg-primary/5 pointer-events-none z-10 flex items-center justify-center transition-opacity duration-150">
          <div className="bg-primary/20 backdrop-blur-sm rounded-lg px-4 py-2 animate-fade-in">
            <span className="text-sm font-medium text-primary">Soltar en {stage.label}</span>
          </div>
        </div>
      )}

      {/* Subtle highlight when something is being dragged but not over this column */}
      {draggingId && !isOver && objectives.length === 0 && (
        <div className="absolute inset-2 border-2 border-dashed border-muted-foreground/20 rounded-xl pointer-events-none z-10 transition-opacity duration-150" />
      )}

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            {stage.label}
          </h2>
          <p className="text-sm text-muted-foreground max-w-[240px]">
            {stage.description}
          </p>
        </div>
        <Badge variant="secondary" className="bg-background/70 backdrop-blur border">
          {objectives.length}
        </Badge>
      </div>

      <ScrollArea className="h-full pr-2">
        <SortableContext items={objectiveIds} strategy={verticalListSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 auto-rows-auto">
            {/* Enhanced empty state for first-time users */}
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

// Custom animate layout changes for smooth sibling displacement
const animateLayoutChanges: AnimateLayoutChanges = (args) => {
  const { isSorting, wasDragging } = args;
  if (isSorting || wasDragging) {
    return defaultAnimateLayoutChanges(args);
  }
  return true;
};

const SortableCanvasCard = memo(function SortableCanvasCard({ 
  objective, 
  toggleStep, 
  onDeleteCustom, 
  isMapLocked, 
  isRecentlyDropped,
  overId,
  draggingId,
  objectiveIndex,
  allObjectives
}: SortableCanvasCardProps) {
  const isMentor = objective.source === 'mentor';
  const complete = isCompleted(objective);
  const completedSteps = objective.steps.filter(step => step.completed).length;
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
      easing: 'cubic-bezier(0.25, 1, 0.5, 1)',
    },
  });

  // Calculate insertion indicator position
  const isTargetedByDrag = overId === objective.id && draggingId !== objective.id && draggingId !== null;
  const draggedIndex = draggingId ? allObjectives.findIndex(o => o.id === draggingId) : -1;
  const isDragFromSameColumn = draggedIndex !== -1;
  const showIndicator = isTargetedByDrag && isDragFromSameColumn && !isMentor && !isMapLocked;
  // Indicator goes on top if dragged item comes from below, bottom if from above
  const indicatorPosition = draggedIndex > objectiveIndex ? 'top' : 'bottom';

  // Handle blocked element attempt
  const handleBlockedAttempt = useCallback(() => {
    if (!isShaking && (isMentor || isMapLocked)) {
      setIsShaking(true);
      if (isMentor) {
        toast.info('Este objetivo fue asignado por tu mentor y no puede moverse', {
          duration: 2000,
        });
      } else if (isMapLocked) {
        toast.info('El mapa está bloqueado. Contacta a tu mentor para editarlo', {
          duration: 2000,
        });
      }
      setTimeout(() => setIsShaking(false), 400);
    }
  }, [isShaking, isMentor, isMapLocked]);

  // Use CSS.Translate for better performance on vertical movements
  // Disable transition on dragged element so it follows cursor instantly
  const style = {
    transform: CSS.Translate.toString(transform),
    transition: isDragging ? undefined : transition,
  };

  return (
    <div className="relative">
      {/* Top insertion indicator */}
      {showIndicator && indicatorPosition === 'top' && (
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
          "flex flex-col",
          "transform-gpu", // GPU acceleration for smoother animations
          complete && "border-emerald-400/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]",
          isDragging && "opacity-40 scale-[1.02] shadow-lg z-50 ring-2 ring-primary/30",
          !isDragging && "transition-all duration-200 ease-out", // Smooth transition only when not dragging
          isRecentlyDropped && "animate-drop-settle",
          isShaking && "animate-shake",
          (isMentor || isMapLocked) && "cursor-not-allowed"
        )}
      >
      {/* Header con badges + drag handle */}
      <div className="flex flex-wrap items-center gap-2 mb-2 min-h-[28px]">
        {/* Drag handle — only this element triggers drag, keeping checkboxes/buttons clickable */}
        {!isMentor && !isMapLocked && (
          <button
            ref={setActivatorNodeRef}
            {...listeners}
            className="touch-none cursor-grab active:cursor-grabbing -ml-1 p-0.5 rounded hover:bg-muted/60 transition-colors"
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

      {/* Título y descripción - altura mínima para consistencia */}
      <div className="space-y-1 mb-3 min-h-[72px]">
        <h3 className="font-semibold text-base md:text-lg leading-tight line-clamp-2">
          {objective.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {objective.summary}
        </p>
      </div>

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
            className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground ml-auto"
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

        {/* Checklist - siempre al final con mt-auto */}
        {objective.steps.length > 0 && (
          <div className="mt-auto pt-4 space-y-3">
            <p className="text-sm font-medium">Checklist de avance</p>
            <div className="space-y-2">
              {objective.steps.map(step => (
                <div
                  key={step.id}
                  role="button"
                  tabIndex={0}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border text-sm",
                    "px-3 py-2.5 md:px-3 md:py-2",
                    "min-h-[44px] md:min-h-0",
                    "transition-colors touch-manipulation",
                    step.completed ? "bg-emerald-500/10 border-emerald-400/50" : "hover:bg-muted/60 active:bg-muted",
                    "cursor-pointer select-none"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleStep(objective, step.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
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
                  <span className={cn(
                    "flex-1",
                    step.completed && "line-through text-muted-foreground"
                  )}>
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
      
      {/* Bottom insertion indicator */}
      {showIndicator && indicatorPosition === 'bottom' && (
        <div className="absolute -bottom-2 left-2 right-2 h-1 bg-primary rounded-full animate-pulse shadow-sm shadow-primary/30 z-20" />
      )}
    </div>
  );
});

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

const ObjectiveAvailableColumn = memo(function ObjectiveAvailableColumn({ title, description, objectives, draggingId, locked, onDelete, onQuickAdd, isMapLocked }: ObjectiveAvailableColumnProps) {
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
            {objectives.map(objective => (
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

interface DraggableObjectiveCardProps {
  objective: AvailableObjective;
  draggingId: string | null;
  locked?: boolean;
  onDelete?: (id: string) => void;
  onQuickAdd?: (objective: AvailableObjective, timeframe?: CanvasStage) => void;
  isMapLocked?: boolean;
}

const DraggableObjectiveCard = memo(function DraggableObjectiveCard({ objective, draggingId, locked, onDelete, onQuickAdd, isMapLocked }: DraggableObjectiveCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: objective.id,
    disabled: locked,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;
  const dueDate = getObjectiveDueDate(objective);
  const completedSteps = objective.steps?.filter(step => step.completed).length ?? 0;
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
        {objective.source === 'custom' && onDelete && (
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
        {dueDate && (
          <Badge variant="outline">{formatDueDate(dueDate)}</Badge>
        )}
      </div>
      
      {/* Mobile quick add button */}
      {onQuickAdd && !locked && !isMapLocked && (
        <div className="md:hidden mt-3">
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onQuickAdd(objective, 'now');
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

// Recommended Objectives Column with dismiss functionality
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

const RecommendedObjectivesColumn = memo(function RecommendedObjectivesColumn({ 
  title, description, objectives, draggingId, onQuickAdd, onDismiss, isMapLocked, isDismissing 
}: RecommendedObjectivesColumnProps) {
  return (
    <Card className="border-dashed h-full border-primary/30 bg-primary/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[280px] md:h-[360px] lg:h-[400px] pr-4">
          <div className="space-y-4">
            {objectives.map(objective => (
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

interface DraggableRecommendedCardProps {
  objective: GeneratedObjective;
  draggingId: string | null;
  onQuickAdd: (objective: GeneratedObjective, timeframe?: CanvasStage) => void;
  onDismiss: (objectiveKey: string) => void;
  isMapLocked?: boolean;
  isDismissing: boolean;
}

const DraggableRecommendedCard = memo(function DraggableRecommendedCard({ 
  objective, draggingId, onQuickAdd, onDismiss, isMapLocked, isDismissing 
}: DraggableRecommendedCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: objective.key,
    disabled: false,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

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
                    : `Tu puntuación en "${objective.domainLabel}" fue de 3-4. Tienes una base sólida, pero hay oportunidad de llevarla al siguiente nivel.`
                  }
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
      
      {/* Mobile quick add button */}
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
            Agregar a {objective.suggestedTimeframe === 'now' ? 'En Foco' : objective.suggestedTimeframe === 'soon' ? 'Próximos' : 'Visión'}
          </Button>
        </div>
      )}
    </div>
  );
});
