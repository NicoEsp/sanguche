import { PlayCircle, CheckCircle2, Lock, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LessonWithProgress } from "@/types/courses";

interface LessonItemProps {
  lesson: LessonWithProgress;
  index: number;
  isActive: boolean;
  hasAccess: boolean;
  onClick: () => void;
}

export function LessonItem({ lesson, index, isActive, hasAccess, onClick }: LessonItemProps) {
  const isCompleted = lesson.isCompleted;
  const canPlay = hasAccess;

  return (
    <button
      onClick={onClick}
      disabled={!canPlay}
      className={cn(
        "w-full flex items-center gap-4 p-4 rounded-lg text-left transition-all duration-200",
        isActive
          ? "bg-primary/10 border border-primary/30"
          : "hover:bg-muted/50 border border-transparent",
        !canPlay && "opacity-60 cursor-not-allowed"
      )}
    >
      {/* Index/Status indicator */}
      <div
        className={cn(
          "flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
          isCompleted
            ? "bg-green-500/20 text-green-600"
            : isActive
            ? "bg-primary text-primary-foreground"
            : !canPlay
            ? "bg-muted text-muted-foreground"
            : "bg-muted/50 text-muted-foreground"
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="h-5 w-5" />
        ) : !canPlay ? (
          <Lock className="h-4 w-4" />
        ) : (
          <span>{index + 1}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h4
          className={cn(
            "font-medium truncate",
            isActive ? "text-primary" : "text-foreground"
          )}
        >
          {lesson.title}
        </h4>
        {lesson.description && (
          <p className="text-sm text-muted-foreground truncate mt-0.5">
            {lesson.description}
          </p>
        )}
      </div>

      {/* Duration & Play icon */}
      <div className="flex items-center gap-3 flex-shrink-0 text-muted-foreground">
        {lesson.duration_minutes && (
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-3.5 w-3.5" />
            <span>{lesson.duration_minutes} min</span>
          </div>
        )}
        {canPlay && (
          <PlayCircle
            className={cn(
              "h-5 w-5 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          />
        )}
      </div>
    </button>
  );
}
