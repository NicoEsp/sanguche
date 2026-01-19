import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Trash2, Edit, Plus, Lock, Unlock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUserProgressObjectives, useCreateUserObjective, useUpdateUserObjective, useDeleteUserObjective } from "@/hooks/useUserProgressObjectives";
import { ProgressObjective, ObjectiveStep } from "@/types/progress";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";


interface AdminMentoriaProgressProps {
  userId: string;
}

interface ObjectiveFormState {
  id?: string;
  title: string;
  summary: string;
  type: string;
  source: "mentor" | "custom";
  timeframe: "now" | "soon" | "later";
  dueDate?: Date;
  checklist: string;
  mentorNotes: string;
}

const emptyForm: ObjectiveFormState = {
  title: "",
  summary: "",
  type: "skill",
  source: "custom",
  timeframe: "now",
  dueDate: undefined,
  checklist: "",
  mentorNotes: "",
};

export function AdminMentoriaProgress({ userId }: AdminMentoriaProgressProps) {
  const [activeTab, setActiveTab] = useState<"list" | "timeline">("list");
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formState, setFormState] = useState<ObjectiveFormState>(emptyForm);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [objectiveToDelete, setObjectiveToDelete] = useState<string | null>(null);
  const [unlockDialogOpen, setUnlockDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { data: objectives = [], isLoading } = useUserProgressObjectives(userId);
  const createMutation = useCreateUserObjective();
  const updateMutation = useUpdateUserObjective();
  const deleteMutation = useDeleteUserObjective();

  // Check if Career Path is locked
  const isCareerPathLocked = objectives.length > 0 && objectives.every(obj => obj.is_locked);
  const lockedAt = objectives.find(obj => obj.locked_at)?.locked_at;

  // Mutation to unlock Career Path
  const unlockMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('user_progress_objectives')
        .update({ is_locked: false, locked_at: null })
        .eq('user_id', userId)
        .eq('is_locked', true);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress-objectives', userId] });
      toast.success('Career Path reabierto exitosamente');
      setUnlockDialogOpen(false);
    },
    onError: () => {
      toast.error('Error al reabrir el Career Path');
    }
  });

  const openCreateDialog = () => {
    setFormState(emptyForm);
    setDialogOpen(true);
  };

  const openEditDialog = (obj: ProgressObjective) => {
    setFormState({
      id: obj.id,
      title: obj.title,
      summary: obj.summary,
      type: obj.type,
      source: obj.source,
      timeframe: obj.timeframe,
      dueDate: obj.dueDate ? new Date(obj.dueDate) : undefined,
      checklist: obj.steps.map((s) => s.title).join("\n"),
      mentorNotes: obj.mentorNotes || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formState.title || !formState.summary) {
      toast.error("Título y resumen son obligatorios");
      return;
    }

    const steps: ObjectiveStep[] = formState.checklist
      .split("\n")
      .filter((line) => line.trim())
      .map((line, idx) => ({
        id: `step-${idx}`,
        title: line.trim(),
        completed: false,
      }));

    if (formState.id) {
      // Update - use snake_case for DB fields and don't reset status
      await updateMutation.mutateAsync({
        id: formState.id,
        userId,
        updates: {
          title: formState.title,
          summary: formState.summary,
          type: formState.type,
          source: formState.source,
          timeframe: formState.timeframe,
          steps,
          mentor_notes: formState.mentorNotes || null,
          due_date: formState.dueDate ? formState.dueDate.toISOString().split('T')[0] : null,
        },
      });
      toast.success("Objetivo actualizado");
    } else {
      // Create new objective
      await createMutation.mutateAsync({
        userId,
        title: formState.title,
        summary: formState.summary,
        type: formState.type,
        timeframe: formState.timeframe,
        steps,
        dueDate: formState.dueDate ? formState.dueDate.toISOString().split('T')[0] : undefined,
      });
      toast.success("Objetivo creado");
    }

    setDialogOpen(false);
    setFormState(emptyForm);
  };

  const handleDelete = async () => {
    if (objectiveToDelete) {
      await deleteMutation.mutateAsync({ id: objectiveToDelete, userId });
      toast.success("Objetivo eliminado");
      setDeleteDialogOpen(false);
      setObjectiveToDelete(null);
    }
  };

  const toggleStep = async (objectiveId: string, stepId: string) => {
    const objective = objectives.find((o) => o.id === objectiveId);
    if (!objective) return;

    const updatedSteps = objective.steps.map((step) =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    );

    await updateMutation.mutateAsync({
      id: objectiveId,
      userId,
      updates: { steps: updatedSteps },
    });
  };

  const formatDate = (date?: string) => {
    if (!date) return "Sin fecha";
    return format(new Date(date), "dd/MM/yyyy");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      "not-started": "outline",
      "in-progress": "secondary",
      completed: "default",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getTimeframeBadge = (timeframe: string) => {
    const colors: Record<string, string> = {
      now: "bg-red-500 text-white",
      soon: "bg-yellow-500 text-white",
      later: "bg-green-500 text-white",
    };
    return (
      <Badge className={colors[timeframe] || ""}>
        {timeframe === "now" ? "En foco" : timeframe === "soon" ? "Próximo paso" : "Visión"}
      </Badge>
    );
  };

  const objectivesByTimeframe = {
    now: objectives.filter((o) => o.timeframe === "now"),
    soon: objectives.filter((o) => o.timeframe === "soon"),
    later: objectives.filter((o) => o.timeframe === "later"),
  };

  const confirmDelete = (id: string) => {
    setObjectiveToDelete(id);
    setDeleteDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-6">Cargando objetivos...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Locked Career Path Banner */}
      {isCareerPathLocked && (
        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-center gap-3">
            <Lock className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">Career Path Cerrado</p>
              {lockedAt && (
                <p className="text-sm text-amber-600">
                  Cerrado el {format(new Date(lockedAt), "dd/MM/yyyy 'a las' HH:mm", { locale: es })}
                </p>
              )}
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setUnlockDialogOpen(true)}
            className="border-amber-300 text-amber-700 hover:bg-amber-100"
          >
            <Unlock className="h-4 w-4 mr-2" />
            Reabrir Career Path
          </Button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Objetivos</h2>
          <p className="text-muted-foreground">
            Crea objetivos personalizados para este usuario
          </p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Objetivo Custom
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
        <TabsList>
          <TabsTrigger value="list">Lista Detallada</TabsTrigger>
          <TabsTrigger value="timeline">Vista Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-4 mt-6">
          {objectives.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No hay objetivos asignados aún</p>
              </CardContent>
            </Card>
          ) : (
            objectives.map((obj) => (
              <Card key={obj.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg">{obj.title}</CardTitle>
                      <CardDescription>{obj.summary}</CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(obj)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => confirmDelete(obj.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-2">
                    {getTimeframeBadge(obj.timeframe)}
                    {getStatusBadge(obj.status)}
                    <Badge variant="outline">{obj.type}</Badge>
                    <Badge variant="outline">{obj.source}</Badge>
                  </div>

                  {obj.dueDate && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Fecha límite: {formatDate(obj.dueDate)}</span>
                    </div>
                  )}

                  {obj.steps.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Checklist:</p>
                      {obj.steps.map((step) => (
                        <div key={step.id} className="flex items-center gap-2">
                          <Checkbox
                            checked={step.completed}
                            onCheckedChange={() => toggleStep(obj.id, step.id)}
                          />
                          <span
                            className={
                              step.completed
                                ? "line-through text-muted-foreground"
                                : ""
                            }
                          >
                            {step.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {obj.mentor_notes && (
                    <div className="border-l-4 border-primary pl-4">
                      <p className="text-sm font-medium">Notas del Mentor:</p>
                      <p className="text-sm text-muted-foreground">
                        {obj.mentor_notes}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="timeline" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* En foco */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-red-600">
                🔥 En foco ({objectivesByTimeframe.now.length})
              </h3>
              {objectivesByTimeframe.now.map((obj) => (
                <Card key={obj.id} className="border-red-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{obj.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(obj)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => confirmDelete(obj.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {obj.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 flex-wrap">
                      {getStatusBadge(obj.status)}
                      <Badge variant="outline" className="text-xs">
                        {obj.source}
                      </Badge>
                    </div>
                    {obj.dueDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(obj.dueDate)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {objectivesByTimeframe.now.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    Sin objetivos
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Próximo paso */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-yellow-600">
                ⏭️ Próximo paso ({objectivesByTimeframe.soon.length})
              </h3>
              {objectivesByTimeframe.soon.map((obj) => (
                <Card key={obj.id} className="border-yellow-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{obj.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(obj)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => confirmDelete(obj.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {obj.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 flex-wrap">
                      {getStatusBadge(obj.status)}
                      <Badge variant="outline" className="text-xs">
                        {obj.source}
                      </Badge>
                    </div>
                    {obj.dueDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(obj.dueDate)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {objectivesByTimeframe.soon.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    Sin objetivos
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Visión */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-600">
                🔭 Visión ({objectivesByTimeframe.later.length})
              </h3>
              {objectivesByTimeframe.later.map((obj) => (
                <Card key={obj.id} className="border-green-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-base">{obj.title}</CardTitle>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditDialog(obj)}>
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => confirmDelete(obj.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <CardDescription className="text-xs">
                      {obj.summary}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex gap-1 flex-wrap">
                      {getStatusBadge(obj.status)}
                      <Badge variant="outline" className="text-xs">
                        {obj.source}
                      </Badge>
                    </div>
                    {obj.dueDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDate(obj.dueDate)}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {objectivesByTimeframe.later.length === 0 && (
                <Card>
                  <CardContent className="p-4 text-center text-sm text-muted-foreground">
                    Sin objetivos
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de crear/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {formState.id ? "Editar Objetivo" : "Nuevo Objetivo Custom"}
            </DialogTitle>
            <DialogDescription>
              {formState.id
                ? "Modifica los detalles del objetivo"
                : "Crea un nuevo objetivo personalizado para el usuario"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={formState.title}
                onChange={(e) =>
                  setFormState({ ...formState, title: e.target.value })
                }
                placeholder="Ej: Mejorar habilidades de liderazgo"
              />
            </div>

            <div>
              <Label htmlFor="summary">Resumen</Label>
              <Textarea
                id="summary"
                value={formState.summary}
                onChange={(e) =>
                  setFormState({ ...formState, summary: e.target.value })
                }
                placeholder="Breve descripción del objetivo"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={formState.type}
                  onValueChange={(value) =>
                    setFormState({ ...formState, type: value })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="skill">Habilidad</SelectItem>
                    <SelectItem value="project">Proyecto</SelectItem>
                    <SelectItem value="learning">Aprendizaje</SelectItem>
                    <SelectItem value="milestone">Hito</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="timeframe">Horizonte</Label>
                <Select
                  value={formState.timeframe}
                  onValueChange={(value: any) =>
                    setFormState({ ...formState, timeframe: value })
                  }
                >
                  <SelectTrigger id="timeframe">
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

            <div className="space-y-2">
              <Label>Fecha límite (opcional)</Label>
              <div className="flex flex-col gap-2">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formState.dueDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formState.dueDate 
                        ? format(formState.dueDate, "PPP", { locale: es }) 
                        : "Seleccionar fecha..."
                      }
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formState.dueDate}
                      onSelect={(date) => setFormState({ ...formState, dueDate: date })}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                {formState.dueDate && (
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setFormState({ ...formState, dueDate: undefined })}
                    className="text-xs w-fit"
                  >
                    Quitar fecha
                  </Button>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="checklist">Checklist (una por línea)</Label>
              <Textarea
                id="checklist"
                value={formState.checklist}
                onChange={(e) =>
                  setFormState({ ...formState, checklist: e.target.value })
                }
                placeholder="Tarea 1&#10;Tarea 2&#10;Tarea 3"
                rows={5}
              />
            </div>

            <div>
              <Label htmlFor="notes">Notas del Mentor</Label>
              <Textarea
                id="notes"
                value={formState.mentorNotes}
                onChange={(e) =>
                  setFormState({ ...formState, mentorNotes: e.target.value })
                }
                placeholder="Consejos, observaciones, próximos pasos..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              {formState.id ? "Guardar Cambios" : "Crear Objetivo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de confirmación de eliminación */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar objetivo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmación de reabrir Career Path */}
      <AlertDialog open={unlockDialogOpen} onOpenChange={setUnlockDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reabrir Career Path?</AlertDialogTitle>
            <AlertDialogDescription>
              Esto permitirá al usuario volver a editar y modificar sus objetivos. 
              Los objetivos actuales se mantendrán pero ya no estarán bloqueados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => unlockMutation.mutate()}
              disabled={unlockMutation.isPending}
            >
              {unlockMutation.isPending ? "Reabriendo..." : "Reabrir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
