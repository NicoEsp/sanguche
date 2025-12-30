import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Seo } from "@/components/Seo";
import { CourseCard, CoursePaywall } from "@/components/courses";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/useCourses";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import { Mixpanel } from "@/lib/mixpanel";

export default function Courses() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { hasAccess, isLoading: accessLoading } = useCourseAccess();

  const isLoading = coursesLoading || accessLoading;

  // Track page view only when not loading
  useEffect(() => {
    if (!isLoading) {
      Mixpanel.track("course_view", { page: "catalog" });
    }
  }, [isLoading]);

  // Full skeleton during loading to prevent layout flashes
  if (isLoading) {
    return (
      <AppLayout>
        <Seo
          title="Cursos - ProductPrepa"
          description="Aprende habilidades de producto con cursos cortos y prácticos."
          canonical="/cursos"
        />
        <div className="container max-w-6xl py-8 space-y-8">
          <div className="space-y-4">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-6 w-96 max-w-full" />
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-video rounded-lg" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Seo
        title="Cursos - ProductPrepa"
        description="Aprende habilidades de producto con cursos cortos y prácticos. Videos de menos de 10 minutos con ejercicios aplicables."
        canonical="/cursos"
      />

      <div className="container max-w-6xl py-8 space-y-8">
        {/* Hero section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-5 w-5" />
            <span className="text-sm font-medium">Nuevo</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Cursos de Producto
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Videos cortos y prácticos para desarrollar tus habilidades de producto.
            Cada curso incluye ejercicios para aplicar lo aprendido.
          </p>
        </div>

        {/* Empty state - no courses */}
        {!isLoading && (!courses || courses.length === 0) && (
          <div className="text-center py-16 space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-muted flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Próximamente
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Estamos preparando cursos increíbles para ti. 
              Serás notificado cuando estén disponibles.
            </p>
            <Link to="/planes">
              <Button variant="outline" className="mt-4">
                Ver planes disponibles
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}

        {/* Courses grid */}
        {!isLoading && courses && courses.length > 0 && (
          <>
            {!hasAccess && (
              <div className="bg-muted/30 border border-border/50 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <BookOpen className="h-5 w-5 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Desbloquea todos los cursos con un plan que incluya acceso a cursos.
                  </p>
                </div>
                <Link to="/planes">
                  <Button size="sm">Ver planes</Button>
                </Link>
              </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  hasAccess={hasAccess}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
