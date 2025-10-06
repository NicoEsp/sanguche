import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Edit, Trash2, Lock } from 'lucide-react';
import type { UserProgressObjective } from '@/hooks/useUserProgressObjectives';

interface ObjectiveColumnProps {
  title: string;
  objectives: UserProgressObjective[];
  emptyMessage: string;
  onObjectiveClick?: (objective: UserProgressObjective) => void;
  onEdit?: (objective: UserProgressObjective) => void;
  onDelete?: (objective: UserProgressObjective) => void;
  showActions?: boolean;
  adminView?: boolean;
}

export function ObjectiveColumn({
  title,
  objectives,
  emptyMessage,
  onObjectiveClick,
  onEdit,
  onDelete,
  showActions = false,
  adminView = false,
}: ObjectiveColumnProps) {
  const getSourceBadge = (source: string) => {
    switch (source) {
      case 'mentor':
        return (
          <Badge variant="default" className="text-xs">
            👨‍🏫 Mentor
          </Badge>
        );
      case 'custom':
        return (
          <Badge variant="secondary" className="text-xs">
            ✍️ Personalizado
          </Badge>
        );
      default:
        return null;
    }
  };

  const calculateProgress = (objective: UserProgressObjective) => {
    const steps = objective.steps as any[];
    if (!steps || steps.length === 0) return 0;
    const completed = steps.filter(step => step.completed).length;
    return Math.round((completed / steps.length) * 100);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{title}</h3>
        <Badge variant="outline" className="text-xs">
          {objectives.length}
        </Badge>
      </div>

      <div className="space-y-3">
        {objectives.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          </Card>
        ) : (
          objectives.map(objective => (
            <Card
              key={objective.id}
              className={`p-4 space-y-3 ${
                onObjectiveClick ? 'cursor-pointer hover:border-primary transition-colors' : ''
              }`}
              onClick={() => onObjectiveClick?.(objective)}
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-sm">{objective.title}</h4>
                      {objective.source === 'mentor' && (
                        <Lock className="h-3 w-3 text-muted-foreground" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {objective.summary}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {getSourceBadge(objective.source)}
                  </div>
                </div>

                {objective.mentor_notes && (
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-2">
                    <p className="text-xs font-medium text-primary mb-1">
                      📝 Notas del mentor:
                    </p>
                    <p className="text-xs text-muted-foreground">{objective.mentor_notes}</p>
                  </div>
                )}

                {objective.due_date && (
                  <div className="text-xs text-muted-foreground">
                    📅 Fecha límite:{' '}
                    {new Date(objective.due_date).toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </div>
                )}

                <div className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Progreso</span>
                    <span className="font-medium">{calculateProgress(objective)}%</span>
                  </div>
                  <Progress value={calculateProgress(objective)} className="h-2" />
                </div>

                {showActions && adminView && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit?.(objective);
                      }}
                      className="flex-1"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete?.(objective);
                      }}
                      className="flex-1 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Eliminar
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
