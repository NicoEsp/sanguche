import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useMyExercises, useUpdateExercise } from "@/hooks/useUserExercises";
import { useState, memo } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { FileText, Calendar, Link as LinkIcon, Send, Save, CheckCircle2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusLabels = {
  assigned: "Asignado",
  in_progress: "En Progreso",
  submitted: "Enviado",
  reviewed: "Revisado"
};

const typeLabels = {
  case_study: "Caso de estudio",
  practical: "Ejercicio práctico",
  theoretical: "Teórico"
};

export const UserExercises = memo(function UserExercises() {
  const { data: exercises, isLoading } = useMyExercises();
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState("");
  const updateExercise = useUpdateExercise();

  const pendingExercises = exercises?.filter(e => 
    e.status === 'assigned' || e.status === 'in_progress'
  ) || [];
  
  const completedExercises = exercises?.filter(e => 
    e.status === 'submitted' || e.status === 'reviewed'
  ) || [];

  const selectedExercise = exercises?.find(e => e.id === selectedExerciseId);

  const handleSaveDraft = async () => {
    if (!selectedExerciseId) return;
    
    await updateExercise.mutateAsync({
      id: selectedExerciseId,
      submission_text: submissionText,
      status: 'in_progress'
    });
  };

  const handleSubmit = async () => {
    if (!selectedExerciseId) return;
    
    await updateExercise.mutateAsync({
      id: selectedExerciseId,
      submission_text: submissionText,
      submission_date: new Date().toISOString(),
      status: 'submitted'
    });
    
    setSelectedExerciseId(null);
    setSubmissionText("");
  };

  const handleViewExercise = (exerciseId: string) => {
    const exercise = exercises?.find(e => e.id === exerciseId);
    if (exercise) {
      setSelectedExerciseId(exerciseId);
      setSubmissionText(exercise.submission_text || '');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (selectedExerciseId && selectedExercise) {
    const isReadOnly = selectedExercise.status === 'submitted' || selectedExercise.status === 'reviewed';
    
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl">{selectedExercise.exercise_title}</CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  <span>{typeLabels[selectedExercise.exercise_type]}</span>
                </div>
                {selectedExercise.due_date && (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Vence: {format(new Date(selectedExercise.due_date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                  </div>
                )}
              </div>
            </div>
            <Badge>{statusLabels[selectedExercise.status]}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {selectedExercise.exercise_description && (
            <div className="space-y-2">
              <Label>Descripción</Label>
              <div className="rounded-lg border p-4 bg-muted/30 whitespace-pre-wrap">
                {selectedExercise.exercise_description}
              </div>
            </div>
          )}

          {selectedExercise.attachment_url && (
            <div className="space-y-2">
              <Label>Material de apoyo</Label>
              <a 
                href={selectedExercise.attachment_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-primary hover:underline"
              >
                <LinkIcon className="h-4 w-4" />
                Descargar material
              </a>
            </div>
          )}

          <div className="border-t pt-6 space-y-4">
            <div className="flex items-center justify-between">
              <Label htmlFor="submission">Tu respuesta</Label>
              {selectedExercise.submission_date && (
                <span className="text-xs text-muted-foreground">
                  Enviado el {format(new Date(selectedExercise.submission_date), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              )}
            </div>
            <Textarea
              id="submission"
              value={submissionText}
              onChange={(e) => setSubmissionText(e.target.value)}
              placeholder="Escribe tu respuesta aquí..."
              rows={10}
              disabled={isReadOnly}
              className={isReadOnly ? "bg-muted/30" : ""}
            />
          </div>

          {selectedExercise.status === 'reviewed' && selectedExercise.admin_feedback && (
            <div className="space-y-2 bg-primary/5 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center gap-2 text-primary">
                <CheckCircle2 className="h-5 w-5" />
                <Label>Feedback del mentor</Label>
              </div>
              <div className="whitespace-pre-wrap text-sm">
                {selectedExercise.admin_feedback}
              </div>
            </div>
          )}

          <div className="flex justify-between gap-2 pt-4">
            <Button variant="outline" onClick={() => setSelectedExerciseId(null)}>
              Volver
            </Button>
            {!isReadOnly && (
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={handleSaveDraft}
                  disabled={updateExercise.isPending}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Borrador
                </Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={updateExercise.isPending || !submissionText.trim()}
                >
                  <Send className="h-4 w-4 mr-2" />
                  Enviar Respuesta
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>💼 Mis Ejercicios</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">
              Pendientes ({pendingExercises.length})
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completados ({completedExercises.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingExercises.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No tienes ejercicios pendientes
              </div>
            ) : (
              pendingExercises.map(exercise => (
                <div key={exercise.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{exercise.exercise_title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{typeLabels[exercise.exercise_type]}</span>
                        {exercise.due_date && (
                          <span>Vence: {format(new Date(exercise.due_date), "d 'de' MMM", { locale: es })}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={exercise.status === 'in_progress' ? 'default' : 'secondary'}>
                      {statusLabels[exercise.status]}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewExercise(exercise.id)}
                  >
                    Ver detalles
                  </Button>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4 mt-4">
            {completedExercises.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                Aún no has completado ningún ejercicio
              </div>
            ) : (
              completedExercises.map(exercise => (
                <div key={exercise.id} className="border rounded-lg p-4 space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-medium">{exercise.exercise_title}</h4>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span>{typeLabels[exercise.exercise_type]}</span>
                        {exercise.submission_date && (
                          <span>Enviado: {format(new Date(exercise.submission_date), "d 'de' MMM", { locale: es })}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={exercise.status === 'reviewed' ? 'default' : 'outline'}>
                      {statusLabels[exercise.status]}
                    </Badge>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleViewExercise(exercise.id)}
                  >
                    Ver detalles
                  </Button>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
});
