import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, FileText, Eye } from "lucide-react";
import type { UserExercise } from "@/hooks/useUserExercises";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ExerciseCardProps {
  exercise: UserExercise;
  onViewDetails: (exercise: UserExercise) => void;
}

const statusLabels = {
  assigned: "Asignado",
  in_progress: "En Progreso",
  submitted: "Enviado",
  reviewed: "Revisado"
};

const statusVariants = {
  assigned: "secondary" as const,
  in_progress: "default" as const,
  submitted: "outline" as const,
  reviewed: "default" as const
};

const typeLabels = {
  case_study: "Caso de estudio",
  practical: "Ejercicio práctico",
  theoretical: "Teórico"
};

export function ExerciseCard({ exercise, onViewDetails }: ExerciseCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-base line-clamp-2">{exercise.exercise_title}</CardTitle>
          <Badge variant={statusVariants[exercise.status]}>
            {statusLabels[exercise.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FileText className="h-4 w-4" />
          <span>{typeLabels[exercise.exercise_type]}</span>
        </div>
        
        {exercise.due_date && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>Vence: {format(new Date(exercise.due_date), "d 'de' MMMM", { locale: es })}</span>
          </div>
        )}

        {exercise.submission_date && (
          <div className="text-sm text-muted-foreground">
            Enviado: {format(new Date(exercise.submission_date), "d 'de' MMMM", { locale: es })}
          </div>
        )}

        <Button 
          variant="outline" 
          size="sm" 
          className="w-full mt-2"
          onClick={() => onViewDetails(exercise)}
        >
          <Eye className="h-4 w-4 mr-2" />
          {exercise.status === 'submitted' ? 'Revisar' : 'Ver detalles'}
        </Button>
      </CardContent>
    </Card>
  );
}
