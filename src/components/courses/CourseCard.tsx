import { Link } from "react-router-dom";
import { Clock, PlayCircle, Lock, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { Course, CourseProgress } from "@/types/courses";

interface CourseCardProps {
  course: Course;
  hasAccess: boolean;
  progress?: CourseProgress;
}

export function CourseCard({ course, hasAccess, progress }: CourseCardProps) {
  const isCompleted = progress?.isCompleted;

  return (
    <Link to={`/cursos/${course.slug}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm h-full">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted overflow-hidden">
          {course.thumbnail_url ? (
            <img
              src={course.thumbnail_url}
              alt={course.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
              <PlayCircle className="h-16 w-16 text-primary/40" />
            </div>
          )}
          
          {/* Overlay for locked courses */}
          {!hasAccess && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Lock className="h-8 w-8" />
                <span className="text-sm font-medium">Requiere suscripción</span>
              </div>
            </div>
          )}

          {/* Completed badge */}
          {isCompleted && (
            <div className="absolute top-3 right-3">
              <Badge className="bg-green-500/90 text-white border-0">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Completado
              </Badge>
            </div>
          )}
        </div>

        <CardContent className="p-5">
          {/* Title */}
          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">
            {course.title}
          </h3>

          {/* Description */}
          {course.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
              {course.description}
            </p>
          )}

          {/* Meta info */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            {course.duration_minutes && (
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>{course.duration_minutes} min</span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {hasAccess && progress && progress.totalLessons > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress.completedLessons} de {progress.totalLessons} lecciones</span>
                <span>{progress.progressPercentage}%</span>
              </div>
              <Progress value={progress.progressPercentage} className="h-1.5" />
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
