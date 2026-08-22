import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, BookOpen, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { CoursePublic } from '@/seo/contentSeo';

/**
 * Lo que ve un visitante no logueado en /cursos/:slug: título, descripción,
 * qué se lleva y el temario, sin videos ni links a lecciones.
 *
 * Es a propósito una función pura de `course`, sin hooks ni browser globals:
 * la renderiza el cliente (CourseDetail) y también el build
 * (scripts/prerender/render.tsx vía renderToStaticMarkup, donde no existen
 * window ni document). Lo único que necesita del entorno es un Router en
 * contexto por los <Link>: BrowserRouter en el cliente, StaticRouter en build.
 */
export function CoursePublicView({ course }: { course: CoursePublic }) {
  return (
    <div className="container max-w-4xl py-8 space-y-6">
      <Link
        to="/cursos-info"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Volver a cursos
      </Link>

      <div className="space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{course.title}</h1>
        {course.description && (
          <p className="text-lg text-muted-foreground">{course.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          {course.duration_minutes != null && course.duration_minutes > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {course.duration_minutes} min
            </span>
          )}
          {course.lessons.length > 0 && (
            <span className="flex items-center gap-1">
              <BookOpen className="h-4 w-4" />
              {course.lessons.length} lecciones
            </span>
          )}
        </div>
      </div>

      {course.thumbnail_url && (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-muted">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {course.outcome && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <h2 className="font-semibold text-foreground mb-2">Al finalizar este curso podrás:</h2>
            <p className="text-muted-foreground">{course.outcome}</p>
          </CardContent>
        </Card>
      )}

      {course.lessons.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Contenido del curso</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="space-y-2">
              {course.lessons.map((lesson, index) => (
                <div
                  key={lesson.id}
                  className="flex items-center gap-3 p-2 rounded-lg text-muted-foreground"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    {index + 1}
                  </span>
                  <span className="text-sm">{lesson.title}</span>
                  {lesson.duration_minutes != null && lesson.duration_minutes > 0 && (
                    <span className="ml-auto text-xs text-muted-foreground/60">
                      {lesson.duration_minutes} min
                    </span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardContent className="p-8 text-center space-y-4">
          <h2 className="text-xl font-bold text-foreground">Registrate gratis para acceder</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Creá tu cuenta gratuita para acceder a este curso y todas las herramientas de
            ProductPrepa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Registrarse gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/planes">Ver planes</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
