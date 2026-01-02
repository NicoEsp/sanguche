import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, ArrowRight, Sparkles, CheckCircle } from "lucide-react";
import { Seo } from "@/components/Seo";
import { CourseCard } from "@/components/courses";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCourses } from "@/hooks/useCourses";
import { useCourseAccess } from "@/hooks/useCourseAccess";
import { Mixpanel } from "@/lib/mixpanel";
import sanguche from "@/assets/sanguche-build.png";

const getPlanMessage = (plan: string | null) => {
  switch (plan) {
    case 'curso_estrategia':
      return {
        planName: 'Curso: Estrategia de Producto para principiantes',
        prefix: 'con la compra de',
        singular: true
      };
    case 'cursos_all':
      return {
        planName: 'Todos los Cursos',
        prefix: 'con la compra de',
        singular: false
      };
    case 'repremium':
      return {
        planName: 'Todos los Cursos incluido',
        prefix: 'Acceso a',
        suffix: 'con tu plan RePremium',
        singular: false
      };
    default:
      return {
        planName: 'tu plan',
        prefix: 'con',
        singular: false
      };
  }
};

export default function Courses() {
  const { data: courses, isLoading: coursesLoading } = useCourses();
  const { hasAccess, isLoading: accessLoading, plan } = useCourseAccess();

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
      <>
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
      </>
    );
  }

  const planMessage = getPlanMessage(plan);

  return (
    <>
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
        {(!courses || courses.length === 0) && (
          hasAccess ? (
            // Special screen for buyers
            <div className="text-center py-16 space-y-6">
              <img 
                src={sanguche} 
                alt="Cocinando tu Sanguche" 
                className="mx-auto h-48 w-auto object-contain"
              />
              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-foreground">
                  ¡Ya tienes acceso!
                </h2>
                <p className="text-lg text-muted-foreground max-w-lg mx-auto">
                  Estamos terminando de cocinar tu Sanguche especial 🥪
                </p>
              </div>
              
              <Badge className="bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20 px-4 py-2">
                <CheckCircle className="h-4 w-4 mr-2" />
                Acceso garantizado
              </Badge>
              
              <p className="text-muted-foreground max-w-md mx-auto">
                {planMessage.prefix} <span className="font-medium text-foreground">{planMessage.planName}</span>
                {planMessage.suffix && ` ${planMessage.suffix}`}.
              </p>
              
              <p className="text-sm text-muted-foreground">
                Te notificaremos cuando {planMessage.singular ? 'esté listo' : 'estén listos'}.
              </p>

              <Link to="/starter-pack">
                <Button variant="outline" className="mt-4">
                  Explorar Starter Pack
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            // Generic empty state for non-buyers
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
          )
        )}

        {/* Courses grid */}
        {courses && courses.length > 0 && (
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
    </>
  );
}
