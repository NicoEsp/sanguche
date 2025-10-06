import { useMemo, useState } from "react";
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
import { Calendar, CheckCircle2, Lock, Plus, Sparkles, Trash2 } from "lucide-react";
import { CanvasStage, ProgressObjective } from "@/types/progress";
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
  label: "Próximo paso",
  description: "Metas para los próximos 60-90 días",
  gradient: "from-amber-200/40 via-amber-100/40 to-transparent"
}, {
  key: "later",
  label: "Visión",
  description: "Hitos estratégicos para tu carrera a largo plazo",
  gradient: "from-emerald-200/40 via-emerald-100/30 to-transparent"
}];
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
const isCompleted = (objective: ProgressObjective) => {
  if (objective.steps.length > 0) {
    return objective.steps.every(step => step.completed);
  }
  return objective.status === "completed";
};
const buildInitialObjectives = (): ProgressObjective[] => [{
  id: "s-1",
  title: "Discovery continuo",
  summary: "Establece un sistema recurrente de investigación con usuarios finales.",
  type: "Proceso",
  source: "suggested",
  steps: [{
    id: "s-1-1",
    title: "Revisar framework de product discovery",
    completed: true
  }, {
    id: "s-1-2",
    title: "Planificar entrevistas quincenales",
    completed: false
  }, {
    id: "s-1-3",
    title: "Documentar aprendizajes en Notion",
    completed: false
  }],
  level: {
    current: 2,
    target: 4,
    label: "Confianza"
  },
  dueDate: new Date().toISOString(),
  status: "in-progress",
  timeframe: "now"
}, {
  id: "s-2",
  title: "Profundizar en métricas North Star",
  summary: "Define una métrica guía compartida con el equipo de producto y negocio.",
  type: "Estrategia",
  source: "suggested",
  steps: [{
    id: "s-2-1",
    title: "Mapear métricas actuales",
    completed: false
  }, {
    id: "s-2-2",
    title: "Identificar leading indicators",
    completed: false
  }, {
    id: "s-2-3",
    title: "Alinear definición con stakeholders",
    completed: false
  }],
  level: {
    current: 1,
    target: 3,
    label: "Dominio"
  },
  dueDate: undefined,
  status: "not-started",
  timeframe: "soon"
}, {
  id: "m-1",
  title: "Liderar workshop con stakeholders",
  summary: "Facilita una sesión de co-creación para priorizar soluciones.",
  type: "Soft skill",
  source: "mentor",
  steps: [{
    id: "m-1-1",
    title: "Diseñar agenda colaborativa",
    completed: false
  }, {
    id: "m-1-2",
    title: "Preparar dinámicas de decisión",
    completed: false
  }, {
    id: "m-1-3",
    title: "Documentar próximos pasos",
    completed: false
  }],
  mentorNotes: "Recuerda apoyarte en ejemplos concretos y reservar 10 minutos finales para definir owners.",
  status: "in-progress",
  dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).toISOString(),
  timeframe: "soon"
}, {
  id: "m-2",
  title: "Mentorear a PM junior",
  summary: "Acompaña semanalmente a un PM en formación para reforzar liderazgo.",
  type: "Liderazgo",
  source: "mentor",
  steps: [{
    id: "m-2-1",
    title: "Definir objetivos de acompañamiento",
    completed: false
  }, {
    id: "m-2-2",
    title: "Establecer ritual de feedback",
    completed: false
  }],
  mentorNotes: "Este objetivo surgió en la última mentoría. No editable por el usuario.",
  status: "not-started",
  timeframe: "later"
}];
const MAX_CUSTOM_OBJECTIVES = 3;
export default function Progress() {
  const location = useLocation();
  const isDemoMode = import.meta.env.DEV && new URLSearchParams(location.search).has("demo");
  const {
    hasActivePremium,
    loading
  } = useSubscription({
    skip: isDemoMode
  });
  const [objectives, setObjectives] = useState<ProgressObjective[]>(buildInitialObjectives);
  const [canvas, setCanvas] = useState<Record<CanvasStage, string[]>>({
    now: ["s-1"],
    soon: ["s-2", "m-1"],
    later: ["m-2"]
  });
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customState, setCustomState] = useState<AddCustomObjectiveState>(initialCustomState);
  const premiumReady = hasActivePremium && !loading;
  const availableCustomCount = objectives.filter(obj => obj.source === "custom").length;
  const objectivesInCanvas = useMemo(() => {
    return STAGES.flatMap(stage => canvas[stage.key].map(id => objectives.find(obj => obj.id === id)).filter(Boolean) as ProgressObjective[]);
  }, [canvas, objectives]);
  const completedObjectives = objectivesInCanvas.filter(objective => isCompleted(objective));
  const completionRate = objectivesInCanvas.length ? Math.round(completedObjectives.length / objectivesInCanvas.length * 100) : 0;
  const handleDragStart = (id: string) => (event: React.DragEvent<HTMLDivElement>) => {
    setDraggingId(id);
    event.dataTransfer.setData("text/objective-id", id);
    event.dataTransfer.effectAllowed = "move";
  };
  const handleDragEnd = () => setDraggingId(null);
  const handleDrop = (stage: CanvasStage) => (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const id = event.dataTransfer.getData("text/objective-id");
    if (!id) return;
    setCanvas(prev => {
      const alreadyInStage = prev[stage].includes(id);
      if (alreadyInStage) return prev;
      const next = {
        ...prev
      };
      // Remove from other stages first
      STAGES.forEach(({
        key
      }) => {
        if (key === stage) return;
        if (next[key].includes(id)) {
          next[key] = next[key].filter(value => value !== id);
        }
      });
      next[stage] = [...next[stage], id];
      return next;
    });
    setDraggingId(null);
  };
  const allowDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };
  const toggleStep = (objectiveId: string, stepId: string) => {
    setObjectives(prev => prev.map(objective => {
      if (objective.id !== objectiveId) return objective;
      const updatedSteps = objective.steps.map(step => step.id === stepId ? {
        ...step,
        completed: !step.completed
      } : step);
      const allCompleted = updatedSteps.every(step => step.completed);
      return {
        ...objective,
        steps: updatedSteps,
        status: allCompleted ? "completed" : "in-progress"
      };
    }));
  };
  const removeFromCanvas = (stage: CanvasStage, id: string) => {
    setCanvas(prev => ({
      ...prev,
      [stage]: prev[stage].filter(value => value !== id)
    }));
  };
  const deleteCustomObjective = (id: string) => {
    setObjectives(prev => prev.filter(objective => objective.id !== id));
    setCanvas(prev => ({
      now: prev.now.filter(value => value !== id),
      soon: prev.soon.filter(value => value !== id),
      later: prev.later.filter(value => value !== id)
    }));
  };
  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setCustomState(initialCustomState);
    }
  };
  const addCustomObjective = () => {
    if (availableCustomCount >= MAX_CUSTOM_OBJECTIVES || !customState.title.trim()) {
      return;
    }
    const steps = customState.stepsText.split("\n").map(line => line.trim()).filter(Boolean).map((line, index) => ({
      id: `c-${Date.now()}-${index}`,
      title: line,
      completed: false
    }));
    const newObjective: ProgressObjective = {
      id: `c-${Date.now()}`,
      title: customState.title,
      summary: customState.summary,
      type: customState.type,
      source: "custom",
      steps,
      status: "not-started",
      dueDate: customState.dueDate || undefined,
      timeframe: customState.timeframe
    };
    setObjectives(prev => [...prev, newObjective]);
    setCanvas(prev => ({
      ...prev,
      [customState.timeframe]: [...prev[customState.timeframe], newObjective.id]
    }));
    handleDialogChange(false);
  };
  const objectiveById = (id: string) => objectives.find(objective => objective.id === id);
  if (loading && !isDemoMode) {
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
      <Seo title="Progreso — ProductPrepa" description="Construí y visualizá tu Career Path personalizado con tus objetivos prioritarios." canonical="/progreso" />
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40">
        <div className="container py-10 space-y-8">
          <header className="space-y-3 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="w-fit text-primary border-primary/40 bg-primary/5">
                Premium exclusivo
              </Badge>
              <Badge variant="outline" className="w-fit text-cyan-600 border-cyan-500/40 bg-cyan-500/10">
                Beta
              </Badge>
            </div>
                <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                  Tu mapa de progreso profesional
                </h1>
                <p className="text-muted-foreground max-w-2xl">Arrastra objetivos sugeridos por ProductPrepa o creados en mentorías con NicoProducto para dar forma a tu Career Path. Agrúpalos por horizonte temporal y hacé seguimiento del avance paso a paso.</p>
              </div>
              <div className="bg-card border shadow-sm rounded-xl px-6 py-4 flex flex-col gap-3 min-w-[260px]">
                <div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    <span className="text-sm text-muted-foreground">Objetivos completados</span>
                  </div>
                  <p className="text-3xl font-semibold">
                    {completedObjectives.length}
                    <span className="text-base text-muted-foreground">/{objectivesInCanvas.length}</span>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Avance total</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <ProgressBar value={completionRate} className="h-2" />
                </div>
              </div>
            </div>
          </header>

          <section>
            <div className="relative">
              <div className="absolute inset-x-10 -top-10 h-40 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
              <div className="relative rounded-3xl border bg-card/70 backdrop-blur-sm shadow-xl overflow-hidden">
                <div className="grid md:grid-cols-3">
                  {STAGES.map(stage => <div key={stage.key} onDragOver={allowDrop} onDrop={handleDrop(stage.key)} className={cn("relative p-6 md:p-8 border-t md:border-t-0 md:border-l", "transition-colors duration-200", draggingId && "border-primary/60 bg-primary/5", stage.key === "now" && "md:border-l-0 border-t-0", `bg-gradient-to-b ${stage.gradient}`)}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-xl font-semibold flex items-center gap-2">
                            {stage.label}
                          </h2>
                          <p className="text-sm text-muted-foreground max-w-[240px]">
                            {stage.description}
                          </p>
                        </div>
                        <Badge variant="secondary" className="bg-background/70 backdrop-blur border">
                          {canvas[stage.key].length} objetivos
                        </Badge>
                      </div>

                      <div className="mt-6 space-y-6">
                        {canvas[stage.key].length === 0 && <div className="border border-dashed rounded-xl p-6 text-center text-muted-foreground text-sm">
                            Arrastrá objetivos aquí para planificar tu camino.
                          </div>}

                        {canvas[stage.key].map((id, index) => {
                      const objective = objectiveById(id);
                      if (!objective) return null;
                      const complete = isCompleted(objective);
                      return <div key={id} className={cn("relative rounded-2xl border bg-background/80 backdrop-blur p-5 shadow-sm", "transition-all duration-200", complete && "border-emerald-400/60 shadow-[0_0_0_1px_rgba(16,185,129,0.25)]")}>
                              <div className="flex items-start justify-between gap-4">
                                <div>
                                  <div className="flex items-center gap-2 mb-1">
                                    <Badge variant="outline" className="bg-primary/10 border-primary/30 text-primary text-xs">
                                      {objective.type}
                                    </Badge>
                                    {objective.source === "mentor" ? <Badge variant="secondary" className="text-xs flex items-center gap-1">
                                        <Lock className="h-3 w-3" /> Mentoría
                                      </Badge> : <Badge variant="secondary" className="text-xs">{objective.source === "custom" ? "Personal" : "Sugerido"}</Badge>}
                                  </div>
                                  <h3 className="font-semibold text-lg leading-tight">{objective.title}</h3>
                                  <p className="text-sm text-muted-foreground leading-relaxed">
                                    {objective.summary}
                                  </p>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  {complete ? <Badge className="bg-emerald-500/90 text-white">
                                      <CheckCircle2 className="h-3.5 w-3.5 mr-1" /> Completado
                                    </Badge> : <Badge variant="outline" className="text-xs">
                                      {objective.steps.filter(step => step.completed).length}/{objective.steps.length} pasos
                                    </Badge>}

                                  {objective.dueDate && <div className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                                      <Calendar className="h-3.5 w-3.5" />
                                      {formatDueDate(objective.dueDate)}
                                    </div>}

                                  {objective.source !== "mentor" && <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground" onClick={() => removeFromCanvas(stage.key, id)} title="Quitar del canvas">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>}
                                </div>
                              </div>

                              {objective.level && <div className="mt-4 bg-muted/60 rounded-lg px-4 py-2 text-xs flex items-center justify-between text-muted-foreground">
                                  <span>{objective.level.label ?? "Nivel"}</span>
                                  <span>
                                    {objective.level.current} → {objective.level.target}
                                  </span>
                                </div>}

                              {objective.mentorNotes && <div className="mt-4 border-l-2 border-primary/40 pl-4 text-xs text-muted-foreground italic">
                                  {objective.mentorNotes}
                                </div>}

                              {objective.steps.length > 0 && <div className="mt-5 space-y-3">
                                  <p className="text-sm font-medium">Checklist de avance</p>
                                  <div className="space-y-2">
                                    {objective.steps.map(step => <label key={step.id} className={cn("flex items-start gap-3 rounded-lg border px-3 py-2 text-sm", "transition-colors", step.completed ? "bg-emerald-500/10 border-emerald-400/50" : "hover:bg-muted/60", objective.source === "mentor" && "cursor-default")}>
                                        <Checkbox checked={step.completed} onCheckedChange={() => toggleStep(objective.id, step.id)} disabled={objective.source === "mentor" && step.completed} className="mt-0.5" />
                                        <span className={cn(step.completed && "line-through text-muted-foreground")}>{step.title}</span>
                                      </label>)}
                                  </div>
                                </div>}

                              {index < canvas[stage.key].length - 1 && <div className="absolute left-1/2 bottom-0 translate-y-1/2 -translate-x-1/2 w-px h-8 bg-gradient-to-b from-transparent via-primary/20 to-transparent" />}
                            </div>;
                    })}
                      </div>
                    </div>)}
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold">Objetivos disponibles</h2>
                <p className="text-sm text-muted-foreground">
                  Arrastrá cualquier objetivo hacia el canvas para integrarlo a tu camino profesional.
                </p>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
                <DialogTrigger asChild>
                  <Button disabled={availableCustomCount >= MAX_CUSTOM_OBJECTIVES}>
                    <Plus className="h-4 w-4 mr-2" />
                    Objetivo personalizado
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-xl">
                  <DialogHeader>
                    <DialogTitle>Crea un objetivo personalizado</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Título</Label>
                      <Input id="title" value={customState.title} onChange={event => setCustomState(prev => ({
                      ...prev,
                      title: event.target.value
                    }))} placeholder="Ej: Liderar discovery en nueva vertical" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="summary">Descripción</Label>
                      <Textarea id="summary" value={customState.summary} onChange={event => setCustomState(prev => ({
                      ...prev,
                      summary: event.target.value
                    }))} placeholder="Describe por qué este objetivo es relevante para tu plan." />
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Tipo</Label>
                        <Input value={customState.type} onChange={event => setCustomState(prev => ({
                        ...prev,
                        type: event.target.value
                      }))} />
                      </div>
                      <div className="grid gap-2">
                        <Label>Horizonte temporal</Label>
                        <Select value={customState.timeframe} onValueChange={(value: CanvasStage) => setCustomState(prev => ({
                        ...prev,
                        timeframe: value
                      }))}>
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
                      <Input id="dueDate" type="date" value={customState.dueDate} onChange={event => setCustomState(prev => ({
                      ...prev,
                      dueDate: event.target.value
                    }))} />
                    </div>
                    <div className="grid gap-2">
                      <Label>Checklist (uno por línea)</Label>
                      <Textarea value={customState.stepsText} onChange={event => setCustomState(prev => ({
                      ...prev,
                      stepsText: event.target.value
                    }))} placeholder={`Ejemplo:\n[✓] Leer libro “Continuous Discovery Habits”\n[ ] Aplicar template de Opportunity Solution Tree`} className="min-h-[120px]" />
                    </div>
                    <Button className="w-full" onClick={addCustomObjective} disabled={!customState.title.trim()}>
                      Guardar objetivo
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              <ObjectiveColumn title="Sugeridos por ProductPrepa" description="Tomamos tus áreas de mejora para proponerte objetivos concretos." objectives={objectives.filter(objective => objective.source === "suggested")} onDragStart={handleDragStart} onDragEnd={handleDragEnd} draggingId={draggingId} />
              <ObjectiveColumn title="Derivados de mentorías" description="Objetivos acordados junto a tu mentor. Se mantienen bloqueados." objectives={objectives.filter(objective => objective.source === "mentor")} onDragStart={handleDragStart} onDragEnd={handleDragEnd} draggingId={draggingId} locked />
              <ObjectiveColumn title="Personalizados" description="Define metas propias. Puedes crear hasta tres objetivos adicionales." objectives={objectives.filter(objective => objective.source === "custom")} onDragStart={handleDragStart} onDragEnd={handleDragEnd} draggingId={draggingId} onDelete={deleteCustomObjective} />
            </div>
          </section>
        </div>
      </div>
    </>;
}
interface ObjectiveColumnProps {
  title: string;
  description: string;
  objectives: ProgressObjective[];
  locked?: boolean;
  draggingId: string | null;
  onDragStart: (id: string) => (event: React.DragEvent<HTMLDivElement>) => void;
  onDragEnd: () => void;
  onDelete?: (id: string) => void;
}
function ObjectiveColumn({
  title,
  description,
  objectives,
  locked = false,
  draggingId,
  onDragStart,
  onDragEnd,
  onDelete
}: ObjectiveColumnProps) {
  return <Card className="border-dashed h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          {title}
          {locked && <Lock className="h-4 w-4 text-muted-foreground" />}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[360px] pr-4">
          <div className="space-y-4">
            {objectives.map(objective => <div key={objective.id} draggable onDragStart={onDragStart(objective.id)} onDragEnd={onDragEnd} className={cn("group border rounded-xl p-4 bg-background/80 hover:border-primary/50 transition-colors shadow-sm", draggingId === objective.id && "border-primary bg-primary/10")}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium leading-tight">{objective.title}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-1">
                      {objective.summary}
                    </p>
                  </div>
                  {objective.source === "custom" && onDelete && <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onDelete(objective.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>}
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary">{objective.type}</Badge>
                  <Badge variant="outline" className="border-dashed">
                    {objective.steps.filter(step => step.completed).length}/{objective.steps.length} pasos
                  </Badge>
                  {objective.dueDate && <Badge variant="outline">{formatDueDate(objective.dueDate)}</Badge>}
                </div>
              </div>)}

            {objectives.length === 0 && <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                Todavía no tienes objetivos en esta sección.
              </div>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>;
}