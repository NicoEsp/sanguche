import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock, CheckCircle2, PlayCircle, CalendarClock } from "lucide-react";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  LessonItem,
  VideoPlayer,
  CourseExercise,
  CourseCTA,
  CoursePaywall,
} from "@/components/courses";
import { LessonNotes } from "@/components/courses/LessonNotes";
import { useCourse } from "@/hooks/useCourse";
import { useCourseProgress } from "@/hooks/useCourseProgress";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import { Mixpanel } from "@/lib/mixpanel";

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: course, isLoading: courseLoading } = useCourse(slug || "");
  const { hasAccess, isLoading: accessLoading } = useCourseAccess(slug);
  const { lessonsWithProgress, progressStats, isLoading: progressLoading } = useCourseProgress(
    course?.id || "",
    course?.lessons || []
  );

  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);

  const isLoading = courseLoading || accessLoading;

  // Set first incomplete lesson as active by default
  useEffect(() => {
    if (lessonsWithProgress.length > 0 && !activeLessonId) {
      const firstIncomplete = lessonsWithProgress.find((l) => !l.isCompleted);
      setActiveLessonId(firstIncomplete?.id || lessonsWithProgress[0].id);
    }
  }, [lessonsWithProgress, activeLessonId]);

  // Track page view
  useEffect(() => {
    if (course) {
      Mixpanel.track("course_view", {
        page: "detail",
        course_slug: course.slug,
        course_title: course.title,
      });
    }
  }, [course]);

  // Track course completion
  useEffect(() => {
    if (progressStats.isCompleted && course) {
      Mixpanel.track("course_complete", {
        course_slug: course.slug,
        course_title: course.title,
      });
    }
  }, [progressStats.isCompleted, course]);

  const activeLesson = lessonsWithProgress.find((l) => l.id === activeLessonId);

  // Handle lesson completion
  const handleLessonComplete = () => {
    // Move to next lesson if available
    const currentIndex = lessonsWithProgress.findIndex((l) => l.id === activeLessonId);
    if (currentIndex < lessonsWithProgress.length - 1) {
      setActiveLessonId(lessonsWithProgress[currentIndex + 1].id);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="container max-w-6xl py-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="aspect-video rounded-xl" />
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </div>
          <div className="space-y-4">
            <Skeleton className="h-48 rounded-lg" />
            <Skeleton className="h-48 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  // Not found
  if (!course) {
    return (
      <div className="container max-w-6xl py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Curso no encontrado</h1>
        <Link to="/cursos">
          <Button>Volver a cursos</Button>
        </Link>
      </div>
    );
  }

  // No access - show paywall
  if (!hasAccess) {
    return (
      <>
        <Seo title={`${course.title} - ProductPrepa`} description={course.description || ""} />
        <CoursePaywall courseTitle={course.title} />
      </>
    );
  }

  // Coming soon - show preview without lessons
  if (course.status === "coming_soon") {
    return (
      <>
        <Seo
          title={`${course.title} - ProductPrepa`}
          description={course.description || ""}
          canonical={`/cursos/${course.slug}`}
        />

        <div className="container max-w-4xl py-8 space-y-6">
          {/* Back button */}
          <Link
            to="/cursos"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a cursos
          </Link>

          {/* Coming soon header */}
          <div className="text-center space-y-4 py-8">
            <Badge className="bg-amber-500/90 text-white border-0 text-sm px-4 py-1">
              <CalendarClock className="h-4 w-4 mr-2" />
              Próximamente
            </Badge>
            
            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
              {course.title}
            </h1>
            
            {course.description && (
              <p className="text-muted-foreground max-w-2xl mx-auto">
                {course.description}
              </p>
            )}
          </div>

          {/* Thumbnail */}
          {course.thumbnail_url && (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
              <img
                src={course.thumbnail_url}
                alt={course.title}
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
          )}

          {/* Info card */}
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-6 text-center space-y-4">
              <CalendarClock className="h-12 w-12 text-amber-500 mx-auto" />
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  Este curso estará disponible próximamente
                </h3>
                <p className="text-muted-foreground">
                  Estamos preparando el contenido. Te notificaremos cuando esté listo.
                </p>
              </div>
              
              {/* Outcome preview */}
              {course.outcome && (
                <div className="pt-4 border-t border-border/50">
                  <h4 className="font-medium text-foreground mb-2">
                    Al finalizar este curso podrás:
                  </h4>
                  <p className="text-muted-foreground">{course.outcome}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Back to courses */}
          <div className="text-center pt-4">
            <Link to="/cursos">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ver otros cursos
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Seo
        title={`${course.title} - ProductPrepa`}
        description={course.description || ""}
        canonical={`/cursos/${course.slug}`}
      />

      <div className="container max-w-6xl py-8 space-y-6">
        {/* Back button */}
        <Link
          to="/cursos"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a cursos
        </Link>

        {/* Course header */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">
            {course.title}
          </h1>
          
          {/* Progress bar */}
          {progressStats.totalLessons > 0 && (
            <div className="flex items-center gap-4">
              <Progress value={progressStats.progressPercentage} className="flex-1 h-2" />
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {progressStats.completedLessons} de {progressStats.totalLessons} completadas
              </span>
              {progressStats.isCompleted && (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              )}
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Video player */}
          <div className="lg:col-span-2 space-y-6">
            {activeLesson ? (
              <>
                <VideoPlayer
                  lesson={activeLesson}
                  courseSlug={course.slug}
                  isCompleted={activeLesson.isCompleted}
                  onComplete={handleLessonComplete}
                />
                <LessonNotes lessonId={activeLesson.id} />
              </>
            ) : (
              <div className="aspect-video bg-muted rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <PlayCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Selecciona una lección para comenzar
                  </p>
                </div>
              </div>
            )}

            {/* Outcome */}
            {course.outcome && (
              <Card className="bg-muted/30 border-border/50">
                <CardContent className="p-4">
                  <h3 className="font-medium text-foreground mb-1">
                    Al finalizar este curso podrás:
                  </h3>
                  <p className="text-muted-foreground">{course.outcome}</p>
                </CardContent>
              </Card>
            )}

            {/* Exercises */}
            {course.exercises && course.exercises.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">
                  Ejercicios prácticos
                </h3>
                {course.exercises.map((exercise) => (
                  <CourseExercise key={exercise.id} exercise={exercise} />
                ))}
              </div>
            )}

            {/* CTAs */}
            <div className="space-y-4">
              <CourseCTA variant="mentoria" />
            </div>
          </div>

          {/* Sidebar - Lessons list */}
          <div className="space-y-4">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <span>Lecciones</span>
                  {course.duration_minutes && (
                    <span className="text-sm font-normal text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.duration_minutes} min
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                <div className="space-y-1">
                  {lessonsWithProgress.map((lesson, index) => (
                    <LessonItem
                      key={lesson.id}
                      lesson={lesson}
                      index={index}
                      isActive={lesson.id === activeLessonId}
                      hasAccess={hasAccess}
                      onClick={() => setActiveLessonId(lesson.id)}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
