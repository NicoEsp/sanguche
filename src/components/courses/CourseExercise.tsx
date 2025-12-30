import { FileText, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { CourseExercise as CourseExerciseType } from "@/types/courses";

interface CourseExerciseProps {
  exercise: CourseExerciseType;
}

export function CourseExercise({ exercise }: CourseExerciseProps) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-lg">Ejercicio práctico</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-foreground mb-2">{exercise.title}</h4>
          {exercise.description && (
            <p className="text-sm text-muted-foreground">{exercise.description}</p>
          )}
        </div>

        {exercise.instructions && (
          <div className="bg-background/50 rounded-lg p-4 border border-border/50">
            <h5 className="text-sm font-medium text-foreground mb-2">Instrucciones:</h5>
            <div className="text-sm text-muted-foreground whitespace-pre-wrap">
              {exercise.instructions}
            </div>
          </div>
        )}

        <Button variant="outline" className="w-full">
          <ExternalLink className="h-4 w-4 mr-2" />
          Abrir ejercicio
        </Button>
      </CardContent>
    </Card>
  );
}
