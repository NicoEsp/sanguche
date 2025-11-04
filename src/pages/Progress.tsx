import { memo, useCallback, useMemo, useRef, useState } from "react";
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
import { cn } from "@/lib/utils";
import { useSubscription } from "@/hooks/useSubscription";
import { PaywallCard } from "@/components/PaywallCard";
import { Seo } from "@/components/Seo";
import { Calendar, CheckCircle2, FileText, Loader2, Lock, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { CanvasStage, ProgressObjective } from "@/types/progress";
import { useProgressObjectives } from "@/hooks/useProgressObjectives";
import { useUserProgressObjectives, useCreateUserObjective, useUpdateUserObjective, useDeleteUserObjective } from "@/hooks/useUserProgressObjectives";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable, PointerSensor, KeyboardSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { UserProgressObjective } from "@/hooks/useUserProgressObjectives";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
  dueDate?: string;
  stepsText: string;
}
const initialCustomState: AddCustomObjectiveState = {
  title: "",
  summary: "",
  type: "Habilidad técnica",
  timeframe: "soon",
  dueDate: "",
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
  const { hasActivePremium, loading } = useSubscription({ skip: isDemoMode });
  const { profile } = useUserProfile();
  const profileId = profile?.id;
  const queryClient = useQueryClient();
  
  // Fetch data from DB
  const { data: suggestedObjectives = [], isLoading: loadingSuggested } = useProgressObjectives();
  const { data: userObjectives = [], isLoading: loadingUser } = useUserProgressObjectives(profileId);
  
  // Mutations
  const createUserObjective = useCreateUserObjective();
  const updateUserObjective = useUpdateUserObjective();
  const deleteUserObjective = useDeleteUserObjective();
  
  // UI state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customState, setCustomState] = useState<AddCustomObjectiveState>(initialCustomState);
  const [isLockDialogOpen, setIsLockDialogOpen] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);
  
  // Check if map is locked
  const isMapLocked = userObjectives.length > 0 && userObjectives.every(obj => obj.is_locked);
  
  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );
  
  const premiumReady = hasActivePremium && !loading;
  const isLoadingData = loadingSuggested || loadingUser;
  
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
  
  // Filtrar objetivos sugeridos que ya están en el canvas
  const availableSuggestedObjectives = useMemo(() => {
    return suggestedObjectives.filter(suggested => 
      !userObjectives.some(user => user.objective_id === suggested.id)
    );
  }, [suggestedObjectives, userObjectives]);
  
  // Canvas objectives (mentor + custom)
  const canvasObjectives = useMemo(() => [...mentorObjectives, ...customObjectives], [mentorObjectives, customObjectives]);
  const objectivesByStage = useMemo<StageObjectivesMap>(() => {
    return canvasObjectives.reduce<StageObjectivesMap>((acc, objective) => {
      acc[objective.timeframe].push(objective);
      return acc;
    }, {
      now: [],
      soon: [],
      later: []
    });
  }, [canvasObjectives]);
  const { completedObjectives, completionRate } = useMemo(() => {
    const completed = canvasObjectives.filter(obj => isCompleted(obj));
    const rate = canvasObjectives.length ? Math.round((completed.length / canvasObjectives.length) * 100) : 0;
    return { completedObjectives: completed, completionRate: rate };
  }, [canvasObjectives]);
  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setDraggingId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setDraggingId(null);

    if (!over || !profileId || isMapLocked) return;

    const draggedId = active.id as string;
    const targetTimeframe = over.id as CanvasStage;

    // Check if it's a suggested objective
    const suggestedObj = suggestedObjectives.find(obj => obj.id === draggedId);
    if (suggestedObj) {
      // Check for duplicate
      const alreadyAssigned = userObjectives.some(obj => obj.objective_id === suggestedObj.id);
      if (alreadyAssigned) {
        toast.error('Este objetivo ya está en tu canvas');
        return;
      }

      // Create custom objective from suggested
      createUserObjective.mutate({
        userId: profileId,
        title: suggestedObj.title,
        summary: suggestedObj.summary,
        type: suggestedObj.type,
        timeframe: targetTimeframe,
        steps: suggestedObj.steps ?? [],
        dueDate: getObjectiveDueDate(suggestedObj),
        objectiveId: suggestedObj.id,
      });
      return;
    }

    // Check if it's a custom objective
    const customObj = customObjectives.find(obj => obj.id === draggedId);
    if (customObj && customObj.timeframe !== targetTimeframe) {
      // Update timeframe
      updateUserObjective.mutate({
        id: customObj.id,
        userId: profileId,
        updates: { timeframe: targetTimeframe },
      });
      return;
    }

    // Mentor objectives cannot be dragged (handled by disabled prop)
  }, [profileId, isMapLocked, suggestedObjectives, userObjectives, createUserObjective, customObjectives, updateUserObjective]);
  const toggleStep = useCallback((objective: UserProgressObjective, stepId: string) => {
    if (!profileId) return;

    const updatedSteps = objective.steps.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );
    const allCompleted = updatedSteps.every(step => step.completed);

    updateUserObjective.mutate({
      id: objective.id,
      userId: profileId,
      updates: {
        steps: updatedSteps,
        status: allCompleted ? 'completed' : 'in-progress',
      },
    });
  }, [profileId, updateUserObjective]);

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
      console.error('Error locking objectives:', error);
      toast.error('Error al guardar tu Career Path');
    }
  });
  
  const handleLockCareerPath = useCallback(() => {
    if (!profileId) return;
    lockUserObjectives.mutate(profileId);
    setIsLockDialogOpen(false);
  }, [lockUserObjectives, profileId]);

  const handleExportPdf = useCallback(() => {
    const exportNode = exportRef.current;

    if (!exportNode) {
      toast.error('No pudimos preparar tu Career Path para exportarlo.');
      return;
    }

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
      console.error('Error exporting Career Path as PDF:', error);
      document.getElementById('career-path-print-root')?.remove();
      document.getElementById('career-path-print-styles')?.remove();
      toast.error('No pudimos exportar tu Career Path. Intentá nuevamente.');
      setIsExportingPdf(false);
    }
  }, []);
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
      dueDate: customState.dueDate || undefined,
    });

    handleDialogChange(false);
  }, [customObjectiveLimitReached, customState, profileId, isMapLocked, createUserObjective, handleDialogChange]);
  if ((loading || isLoadingData) && !isDemoMode) {
    return <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <Sparkles className="h-6 w-6 mx-auto animate-pulse text-primary" />
          <p className="text-muted-foreground">Armando tu Career Path...</p>
        </div>
      </div>;
  }
  if (!premiumReady && !isDemoMode) {
    return <PaywallCard feature="el tablero de Progreso" />;
  }
  return <>
      <Seo 
        title="Progreso — ProductPrepa" 
        description="Construí y visualizá tu Career Path personalizado con tus objetivos prioritarios." 
        canonical="/progreso" 
      />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
        <div ref={exportRef} className="container py-10 space-y-8">
          <header className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="w-fit text-primary border-primary/40 bg-primary/5">
                    Premium exclusivo
                  </Badge>
                  <Badge variant="outline" className="w-fit text-cyan-600 border-cyan-500/40 bg-cyan-500/10">
                    Beta
                  </Badge>
                </div>
                
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
                    <Sparkles className="h-5 w-5 text-primary flex-shrink-0" />
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
                    <ProgressBar value={completionRate} className="h-2" />
                  </div>
                </div>
              </div>

              <p className="text-sm md:text-base text-muted-foreground">
                Arrastra objetivos sugeridos por ProductPrepa o creados en mentorías con NicoProducto para dar forma a tu Career Path. Agrúpalos por horizonte temporal y hacé seguimiento del avance paso a paso.
              </p>
            </div>
          </header>

          {/* Locked banner */}
          {isMapLocked && (
            <Alert className="bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
              <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle>Career Path Guardado</AlertTitle>
              <AlertDescription>
                Tu mapa ha sido guardado. Podés seguir completando los pasos de tus objetivos. Para agregar o mover objetivos, contactanos.
              </AlertDescription>
            </Alert>
          )}

          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <section>
              <div className="relative">
                <div className="absolute inset-x-10 -top-10 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
                <div className="relative rounded-3xl border bg-card/70 backdrop-blur-sm shadow-xl overflow-hidden">
                  <div className="grid md:grid-cols-3 gap-0 md:gap-0">
                    {STAGES.map(stage => <CanvasStageColumn key={stage.key} stage={stage} objectives={objectivesByStage[stage.key]} draggingId={draggingId} toggleStep={toggleStep} onDeleteCustom={handleDeleteCustom} isMapLocked={isMapLocked} />)}
                  </div>
                </div>
              </div>
            </section>

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
                    <DialogTrigger asChild>
                      <Button
                        disabled={customObjectiveLimitReached || isMapLocked}
                        className="w-full sm:w-auto"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Objetivo personalizado
                      </Button>
                    </DialogTrigger>
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
                        <Label htmlFor="dueDate">Fecha estimada</Label>
                        <Input
                          id="dueDate"
                          type="date"
                          value={customState.dueDate}
                          onChange={event => setCustomState(prev => ({
                            ...prev,
                            dueDate: event.target.value,
                          }))}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label>Checklist (uno por línea)</Label>
                        <Textarea
                          value={customState.stepsText}
                          onChange={event => setCustomState(prev => ({
                            ...prev,
                            stepsText: event.target.value,
                          }))}
                          placeholder={`Ejemplo:\n[✓] Leer libro “Continuous Discovery Habits”\n[ ] Aplicar template de Opportunity Solution Tree`}
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
              <ObjectiveAvailableColumn title="💡 Sugeridos por ProductPrepa" description="Tomamos tus áreas de mejora para proponerte objetivos concretos." objectives={availableSuggestedObjectives} draggingId={draggingId} />
              <ObjectiveAvailableColumn title="👨‍🏫 Derivados de mentorías" description="Objetivos acordados junto a tu mentor." objectives={mentorObjectives} draggingId={draggingId} locked />
              <ObjectiveAvailableColumn title="✍️ Personalizados" description="Define metas propias. Puedes crear hasta tres objetivos adicionales." objectives={customObjectives} draggingId={draggingId} onDelete={handleDeleteCustom} />
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

// Canvas Stage Column with droppable
interface CanvasStageColumnProps {
  stage: StageConfig;
  objectives: UserProgressObjective[];
  draggingId: string | null;
  toggleStep: (obj: UserProgressObjective, stepId: string) => void;
  onDeleteCustom: (id: string) => void;
  isMapLocked: boolean;
}

const CanvasStageColumn = memo(function CanvasStageColumn({ stage, objectives, draggingId, toggleStep, onDeleteCustom, isMapLocked }: CanvasStageColumnProps) {
  const { setNodeRef } = useDroppable({ id: stage.key });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative p-4 md:p-6 lg:p-8",
        "min-h-[400px] md:min-h-[500px]",
        "grid grid-rows-[auto_1fr]",
        "border-t md:border-t-0 md:border-l",
        "transition-colors duration-200",
        draggingId && "border-primary/60 bg-primary/5",
        stage.key === "now" && "md:border-l-0 border-t-0",
        `bg-gradient-to-b ${stage.gradient}`
      )}
    >
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
        <div className="grid grid-cols-1 gap-4 auto-rows-fr">
          {objectives.length === 0 && (
            <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground text-sm">
              Arrastrá objetivos aquí para planificar tu camino.
            </div>
          )}

          {objectives.map(objective => (
            <CanvasObjectiveCard
              key={objective.id}
              objective={objective}
              toggleStep={toggleStep}
              onDeleteCustom={onDeleteCustom}
              isMapLocked={isMapLocked}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
});

interface CanvasObjectiveCardProps {
  objective: UserProgressObjective;
  toggleStep: (obj: UserProgressObjective, stepId: string) => void;
  onDeleteCustom: (id: string) => void;
  isMapLocked: boolean;
}

const CanvasObjectiveCard = memo(function CanvasObjectiveCard({ objective, toggleStep, onDeleteCustom, isMapLocked }: CanvasObjectiveCardProps) {
  const isMentor = objective.source === 'mentor';
  const complete = isCompleted(objective);
  const completedSteps = objective.steps.filter(step => step.completed).length;

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: objective.id,
    disabled: isMentor || isMapLocked,
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
        "relative rounded-2xl border bg-background/80 backdrop-blur p-3 md:p-5 shadow-sm",
        "transition-all duration-200",
        "h-full flex flex-col",
        complete && "border-emerald-400/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]",
        isDragging && "opacity-50",
        !isMentor && !isMapLocked && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs">
          {objective.type}
        </Badge>
        {isMentor ? (
          <Badge variant="secondary" className="text-xs flex items-center gap-1">
            <Lock className="h-3 w-3" /> Mentoría
          </Badge>
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

      <div className="space-y-1 mb-3">
        <h3 className="font-semibold text-base md:text-lg leading-tight">
          {objective.title}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {objective.summary}
        </p>
      </div>

      <div className="flex items-center justify-between gap-2 flex-wrap">
        {objective.due_date && (
          <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {formatDueDate(objective.due_date)}
          </div>
        )}
        {!isMentor && !isMapLocked && (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 md:h-8 md:w-8 text-muted-foreground ml-auto"
            onClick={() => onDeleteCustom(objective.id)}
            title="Eliminar objetivo"
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

        {objective.steps.length > 0 && (
          <div className="mt-5 space-y-3">
            <p className="text-sm font-medium">Checklist de avance</p>
            <div className="space-y-2">
              {objective.steps.map(step => (
                <label
                  key={step.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border px-3 py-2 text-sm",
                    "transition-colors",
                    step.completed ? "bg-emerald-500/10 border-emerald-400/50" : "hover:bg-muted/60",
                    "cursor-pointer"
                  )}
                >
                  <Checkbox
                    checked={step.completed}
                    onCheckedChange={() => toggleStep(objective, step.id)}
                    className="mt-0.5"
                  />
                  <span className={cn(step.completed && "line-through text-muted-foreground")}>
                    {step.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
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
}

const ObjectiveAvailableColumn = memo(function ObjectiveAvailableColumn({ title, description, objectives, draggingId, locked, onDelete }: ObjectiveAvailableColumnProps) {
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
}

const DraggableObjectiveCard = memo(function DraggableObjectiveCard({ objective, draggingId, locked, onDelete }: DraggableObjectiveCardProps) {
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
        "group border rounded-xl p-4 bg-background/80 hover:border-primary/50 transition-colors shadow-sm",
        draggingId === objective.id && "border-primary bg-primary/10",
        isDragging && "opacity-50",
        !locked && "cursor-grab active:cursor-grabbing"
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium leading-tight">{objective.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mt-1">
            {objective.summary}
          </p>
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
    </div>
  );
});