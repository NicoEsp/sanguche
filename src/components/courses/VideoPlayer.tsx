import { useEffect, useRef, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUpdateLessonProgress } from "@/hooks/useCourseProgress";
import { Mixpanel } from "@/lib/mixpanel";
import type { CourseLesson } from "@/types/courses";

interface VideoPlayerProps {
  lesson: CourseLesson;
  courseSlug: string;
  isCompleted: boolean;
  onComplete: () => void;
}

export function VideoPlayer({ lesson, courseSlug, isCompleted, onComplete }: VideoPlayerProps) {
  const [hasStarted, setHasStarted] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const updateProgress = useUpdateLessonProgress();

  // Track video start
  useEffect(() => {
    if (!hasStarted) return;
    
    Mixpanel.track("video_start", {
      course_slug: courseSlug,
      lesson_id: lesson.id,
      lesson_title: lesson.title,
    });
  }, [hasStarted, courseSlug, lesson.id, lesson.title]);

  const handleMarkComplete = async () => {
    try {
      await updateProgress.mutateAsync({
        lessonId: lesson.id,
        completed: true,
      });
      
      Mixpanel.track("video_complete", {
        course_slug: courseSlug,
        lesson_id: lesson.id,
        lesson_title: lesson.title,
      });
      
      onComplete();
    } catch (error) {
      console.error("Error marking lesson complete:", error);
    }
  };

  // Parse video URL for embed
  const getEmbedUrl = (url: string): string => {
    // YouTube
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]+)/
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}?autoplay=0&rel=0`;
    }

    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) {
      return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
    }

    // Loom
    const loomMatch = url.match(/loom\.com\/share\/([a-zA-Z0-9]+)/);
    if (loomMatch) {
      return `https://www.loom.com/embed/${loomMatch[1]}`;
    }

    // Return as-is if already an embed URL or unknown format
    return url;
  };

  return (
    <div className="space-y-4">
      {/* Video container */}
      <div className="relative aspect-video bg-black rounded-xl overflow-hidden shadow-lg">
        <iframe
          ref={iframeRef}
          src={getEmbedUrl(lesson.video_url)}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setHasStarted(true)}
        />
      </div>

      {/* Lesson info & actions */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground">{lesson.title}</h2>
          {lesson.description && (
            <p className="text-muted-foreground mt-1">{lesson.description}</p>
          )}
        </div>

        {!isCompleted ? (
          <Button
            onClick={handleMarkComplete}
            disabled={updateProgress.isPending}
            className="flex-shrink-0"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Marcar completado
          </Button>
        ) : (
          <div className="flex items-center gap-2 text-green-600 bg-green-500/10 px-4 py-2 rounded-lg">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">Completado</span>
          </div>
        )}
      </div>
    </div>
  );
}
