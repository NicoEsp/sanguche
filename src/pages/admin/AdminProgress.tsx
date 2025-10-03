import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { CanvasStage, ObjectiveSource, ProgressObjective } from "@/types/progress";
import { cn } from "@/lib/utils";
import { Calendar, Edit2, Plus, Trash2 } from "lucide-react";

interface ManagedObjective extends ProgressObjective {
  owner: string;
}

const mockUsers = [
  { id: "1", name: "Carolina R.", role: "Product Manager" },
  { id: "2", name: "Diego M.", role: "Product Designer" },
  { id: "3", name: "Lucía B.", role: "Product Ops" },
];

const initialObjectives: ManagedObjective[] = [
  {
    id: "admin-1",
    title: "Mejorar rituales de discovery",
    summary: "Implementar sesiones quincenales de user interviews con template compartido.",
    type: "Proceso",
    source: "mentor",
    steps: [
      { id: "admin-1-1", title: "Diseñar cuestionario base", completed: true },
      { id: "admin-1-2", title: "Coordinar con usuarios beta", completed: false },
      { id: "admin-1-3", title: "Documentar aprendizajes en Notion", completed: false },
    ],
    status: "in-progress",
    timeframe: "soon",
    mentorNotes: "Revisar avances en próxima mentoría.",
    owner: "1",
  },
  {
    id: "admin-2",
    title: "Preparar caso de negocio",
    summary: "Crear documento de value proposition para la nueva feature de growth.",
    type: "Estrategia",
    source: "mentor",
    steps: [
      { id: "admin-2-1", title: "Relevar benchmarks", completed: false },
      { id: "admin-2-2", title: "Definir narrativa", completed: false },
    ],
    status: "not-started",
    timeframe: "now",
    mentorNotes: "Compartir borrador antes del 15/04.",
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10).toISOString(),
    owner: "1",
  },
  {
    id: "admin-3",
    title: "Escalar onboarding interno",
    summary: "Documentar playbook de onboarding para PMs nuevos.",
    type: "Operaciones",
    source: "mentor",
    steps: [
      { id: "admin-3-1", title: "Mapear proceso actual", completed: false },
      { id: "admin-3-2", title: "Identificar gaps", completed: false },
      { id: "admin-3-3", title: "Diseñar plan de mejora", completed: false },
    ],
    status: "not-started",
    timeframe: "later",
    owner: "2",
  },
];

interface ObjectiveFormState {
  id?: string;
  title: string;
  summary: string;
  type: string;
  source: ObjectiveSource;
  timeframe: CanvasStage;
  dueDate?: string;
  steps: string;
  mentorNotes?: string;
}

const emptyForm: ObjectiveFormState = {
  title: "",
  summary: "",
  type: "Proceso",
  source: "mentor",
  timeframe: "soon",
  dueDate: "",
  steps: "",
  mentorNotes: "",
};

const shortDateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "short",
});

const formatDate = (value?: string) => {
  if (!value) return "Sin fecha";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Sin fecha";
  }
  return shortDateFormatter.format(parsed);
};

export default function AdminProgress() {
  const [selectedUser, setSelectedUser] = useState<string>(mockUsers[0]?.id ?? "");
  const [objectives, setObjectives] = useState<ManagedObjective[]>(initialObjectives);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formState, setFormState] = useState<ObjectiveFormState>(emptyForm);

  const objectivesForUser = useMemo(
    () => objectives.filter((objective) => objective.owner === selectedUser),
    [objectives, selectedUser]
  );

  const openCreateDialog = () => {
    setFormState(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (objective: ManagedObjective) => {
    setFormState({
      id: objective.id,
      title: objective.title,
      summary: objective.summary,
      type: objective.type,
      source: objective.source,
      timeframe: objective.timeframe,
      dueDate: objective.dueDate?.slice(0, 10) ?? "",
      steps: objective.steps.map((step) => step.title).join("\n"),
      mentorNotes: objective.mentorNotes ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = () => {
    const steps = formState.steps
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line, index) => ({
        id: `${formState.id ?? "new"}-${index}-${Date.now()}`,
        title: line,
        completed: false,
      }));

    const base: ManagedObjective = {
      id: formState.id ?? `objective-${Date.now()}`,
      title: formState.title,
      summary: formState.summary,
      type: formState.type,
      source: formState.source,
      steps,
      status: formState.source === "mentor" ? "in-progress" : "not-started",
      timeframe: formState.timeframe,
      dueDate: formState.dueDate ? new Date(formState.dueDate).toISOString() : undefined,
      mentorNotes: formState.mentorNotes,
      owner: selectedUser,
    };

    setObjectives((prev) => {
      const exists = prev.find((objective) => objective.id === base.id);
      if (exists) {
        return prev.map((objective) => (objective.id === base.id ? base : objective));
      }
      return [...prev, base];
    });

    setDialogOpen(false);
  };

  const handleDelete = (id: string) => {
    setObjectives((prev) => prev.filter((objective) => objective.id !== id));
  };

  const toggleStep = (id: string, stepId: string) => {
    setObjectives((prev) =>
      prev.map((objective) => {
        if (objective.id !== id) return objective;
        return {
          ...objective,
          steps: objective.steps.map((step) =>
            step.id === stepId ? { ...step, completed: !step.completed } : step
          ),
        };
      })
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Gestión de objetivos</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Luego de cada mentoría, agrega, edita o cierra objetivos personalizados para las personas del plan Premium.
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <Select value={selectedUser} onValueChange={setSelectedUser}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Selecciona un usuario" />
            </SelectTrigger>
            <SelectContent>
              {mockUsers.map((user) => (
                <SelectItem key={user.id} value={user.id}>
                  {user.name} — {user.role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={openCreateDialog}>
            <Plus className="h-4 w-4 mr-2" /> Nuevo objetivo
          </Button>
        </div>
      </div>

      <Tabs defaultValue="panel">
        <TabsList className="w-full md:w-auto">
          <TabsTrigger value="panel" className="flex-1 md:flex-none">
            Objetivos activos
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex-1 md:flex-none">
            Vista por horizonte
          </TabsTrigger>
        </TabsList>

        <TabsContent value="panel" className="mt-6">
          <ScrollArea className="max-h-[520px] pr-4">
            <div className="grid gap-4">
              {objectivesForUser.map((objective) => (
                <Card key={objective.id} className="border shadow-sm">
                  <CardHeader className="flex flex-row items-start justify-between gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="uppercase tracking-wide">
                          {objective.type}
                        </Badge>
                        <Badge variant="secondary" className="capitalize">
                          {objective.timeframe === "now"
                            ? "En foco"
                            : objective.timeframe === "soon"
                            ? "Próximo paso"
                            : "Visión"}
                        </Badge>
                        {objective.dueDate && (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(objective.dueDate)}
                          </span>
                        )}
                      </div>
                      <CardTitle className="text-lg leading-tight">{objective.title}</CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {objective.summary}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon" onClick={() => openEditDialog(objective)}>
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button variant="destructive" size="icon" onClick={() => handleDelete(objective.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {objective.mentorNotes && (
                      <div className="bg-muted/60 border rounded-lg px-4 py-3 text-sm text-muted-foreground">
                        {objective.mentorNotes}
                      </div>
                    )}

                    <div className="space-y-2">
                      <p className="text-sm font-medium">Checklist</p>
                      <div className="grid gap-2">
                        {objective.steps.map((step) => (
                          <label
                            key={step.id}
                            className={cn(
                              "flex items-start gap-3 rounded-lg border px-3 py-2 text-sm",
                              step.completed ? "bg-emerald-500/10 border-emerald-500/40" : "hover:bg-muted/50"
                            )}
                          >
                            <Checkbox
                              checked={step.completed}
                              onCheckedChange={() => toggleStep(objective.id, step.id)}
                              className="mt-0.5"
                            />
                            <span className={cn(step.completed && "line-through text-muted-foreground")}>{step.title}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {objectivesForUser.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center text-muted-foreground">
                    Todavía no registraste objetivos para esta persona.
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="grid md:grid-cols-3 gap-4">
            {["now", "soon", "later"].map((stage) => {
              const objectivesForStage = objectivesForUser.filter((objective) => objective.timeframe === stage);
              return (
                <Card key={stage} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">
                      {stage === "now" ? "En foco" : stage === "soon" ? "Próximo paso" : "Visión"}
                    </CardTitle>
                    <CardDescription>
                      {stage === "now"
                        ? "Objetivos prioritarios para la próxima semana"
                        : stage === "soon"
                        ? "Metas del trimestre"
                        : "Desarrollos estratégicos"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {objectivesForStage.map((objective) => (
                      <div key={objective.id} className="rounded-xl border bg-background/60 p-4 space-y-2">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium leading-tight">{objective.title}</p>
                            <p className="text-xs text-muted-foreground">{objective.summary}</p>
                          </div>
                          {objective.dueDate && (
                            <Badge variant="outline">{formatDate(objective.dueDate)}</Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {objective.steps.filter((step) => step.completed).length} / {objective.steps.length} pasos
                        </div>
                      </div>
                    ))}

                    {objectivesForStage.length === 0 && (
                      <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground">
                        Sin objetivos en este horizonte.
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {formState.id ? "Editar objetivo" : "Agregar objetivo"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formState.title}
                onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="summary">Descripción</Label>
              <Textarea
                id="summary"
                value={formState.summary}
                onChange={(event) => setFormState((prev) => ({ ...prev, summary: event.target.value }))}
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Tipo</Label>
                <Input
                  value={formState.type}
                  onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value }))}
                />
              </div>
              <div className="grid gap-2">
                <Label>Origen</Label>
                <Select
                  value={formState.source}
                  onValueChange={(value: ObjectiveSource) =>
                    setFormState((prev) => ({ ...prev, source: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mentor">Mentoría</SelectItem>
                    <SelectItem value="suggested">Sugerido por sistema</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Horizonte</Label>
                <Select
                  value={formState.timeframe}
                  onValueChange={(value: CanvasStage) =>
                    setFormState((prev) => ({ ...prev, timeframe: value }))
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
              <div className="grid gap-2">
                <Label htmlFor="dueDate">Fecha límite</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formState.dueDate}
                  onChange={(event) => setFormState((prev) => ({ ...prev, dueDate: event.target.value }))}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Checklist (uno por línea)</Label>
              <Textarea
                value={formState.steps}
                onChange={(event) => setFormState((prev) => ({ ...prev, steps: event.target.value }))}
                className="min-h-[120px]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="notes">Notas o instrucciones</Label>
              <Textarea
                id="notes"
                value={formState.mentorNotes}
                onChange={(event) => setFormState((prev) => ({ ...prev, mentorNotes: event.target.value }))}
                placeholder="Agrega recordatorios, contexto o recursos sugeridos"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={!formState.title.trim()}>
              Guardar cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
