import { Link } from "react-router-dom";
import { Clock, PlayCircle, Lock, CheckCircle2, CalendarClock, Sparkles } from "lucide-react";
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
  const isComingSoon = course.status === "coming_soon";
  const isFree = course.is_free;

  const cardContent = (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border/50 bg-card/50 backdrop-blur-sm h-full">
      {/* Thumbnail - always visible */}
      <div className="relative aspect-video bg-muted overflow-hidden">
        {course.thumbnail_url ? (
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              isComingSoon ? "opacity-80" : "group-hover:scale-105"
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <PlayCircle className="h-16 w-16 text-primary/40" />
          </div>
        )}
        

        {/* Coming soon badge */}
        {isComingSoon && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-amber-500/90 text-white border-0">
              <CalendarClock className="h-3 w-3 mr-1" />
              Próximamente
            </Badge>
          </div>
        )}

        {/* Completed badge */}
        {isCompleted && !isComingSoon && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500/90 text-white border-0">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              Completado
            </Badge>
          </div>
        )}

        {/* Free badge on thumbnail */}
        {isFree && !isComingSoon && !isCompleted && (
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500/90 text-white border-0">
              <Sparkles className="h-3 w-3 mr-1" />
              Gratuito
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="p-5">
        {/* Subscription required badge - above title */}
        {!hasAccess && !isComingSoon && !isFree && (
          <Badge variant="outline" className="mb-2 text-muted-foreground border-muted-foreground/30">
            <Lock className="h-3 w-3 mr-1" />
            Requiere suscripción
          </Badge>
        )}

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
        {hasAccess && progress && progress.totalLessons > 0 && !isComingSoon && (
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
  );

  // If coming soon, don't link anywhere
  if (isComingSoon) {
    return <div className="cursor-default">{cardContent}</div>;
  }

  // If no access and not free, still allow navigation but detail will show paywall
  return <Link to={`/cursos/${course.slug}`}>{cardContent}</Link>;
}
