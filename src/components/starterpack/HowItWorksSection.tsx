import { ClipboardCheck, FolderOpen, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const steps = [
  {
    number: 1,
    icon: ClipboardCheck,
    title: 'Hacé tu autoevaluación',
    description: 'Descubrí tu nivel actual en las 11 competencias clave de Producto en solo 5 minutos.',
  },
  {
    number: 2,
    icon: FolderOpen,
    title: 'Accedé a los recursos',
    description: 'Descargá guías, templates y frameworks curados para tu perfil.',
  },
  {
    number: 3,
    icon: BookOpen,
    title: 'Seguí la ruta de aprendizaje',
    description: 'Accedé a recursos seleccionados según tu perfil: Build (IC) o Lead (manager).',
  },
  {
    number: 4,
    icon: TrendingUp,
    title: 'Construí tu Career Path',
    description: 'Con Premium, recibí mentoría personalizada y objetivos adaptados a tu carrera.',
  },
];

export function HowItWorksSection() {
  const { isAuthenticated } = useAuth();

  // Redirect to auth with return URL if not authenticated
  const ctaLink = isAuthenticated ? '/autoevaluacion' : '/auth?redirect=/autoevaluacion';

  return (
    <section id="como-funciona" className="py-12 md:py-20 bg-muted/30 scroll-mt-16">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Un camino claro para crecer como Product Builder
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {steps.map((step) => (
            <div key={step.number} className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <step.icon className="w-8 h-8 text-primary" />
              </div>
              <div className="text-sm font-medium text-primary mb-2">
                Paso {step.number}
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-sm text-muted-foreground">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="text-center">
          <Button asChild>
            <Link to={ctaLink}>Comenzar ahora</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
