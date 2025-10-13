import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, GripVertical, Crown } from 'lucide-react';
import { ProgressObjective } from '@/hooks/useProgressObjectives';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ProgressObjectiveCardProps {
  objective: ProgressObjective;
  onEdit: (objective: ProgressObjective) => void;
  onDelete: (id: string) => void;
}

export function ProgressObjectiveCard({ objective, onEdit, onDelete }: ProgressObjectiveCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: objective.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const completedSteps = objective.steps.filter(s => s.completed).length;
  const totalSteps = objective.steps.length;

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <div
        {...attributes}
        {...listeners}
        className="absolute left-2 top-2 cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
      >
        <GripVertical className="h-5 w-5" />
      </div>

      <CardHeader className="pl-10">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <CardTitle className="text-lg">{objective.title}</CardTitle>
              {objective.access_level === 'premium' && (
                <Badge variant="default" className="gap-1">
                  <Crown className="h-3 w-3" />
                  Premium
                </Badge>
              )}
            </div>
            <CardDescription className="mt-1">{objective.summary}</CardDescription>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(objective)}
            >
              <Edit className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(objective.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline">{objective.type}</Badge>
          {objective.level && (
            <Badge variant="secondary">
              Nivel {objective.level.current} → {objective.level.target}
            </Badge>
          )}
        </div>

        <div className="text-sm text-muted-foreground">
          {totalSteps} pasos ({completedSteps} completados)
        </div>

        {objective.steps.length > 0 && (
          <div className="space-y-1 text-sm">
            {objective.steps.slice(0, 3).map((step) => (
              <div key={step.id} className="flex items-start gap-2">
                <div className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${step.completed ? 'bg-primary' : 'bg-muted'}`} />
                <span className={step.completed ? 'line-through text-muted-foreground' : ''}>
                  {step.title}
                </span>
              </div>
            ))}
            {objective.steps.length > 3 && (
              <div className="text-xs text-muted-foreground pl-4">
                +{objective.steps.length - 3} más...
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
