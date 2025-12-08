import { ClipboardCheck, BookOpen, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const steps = [
  {
    number: 1,
    icon: ClipboardCheck,
    title: 'Hacé tu autoevaluación',
    description: 'Descubrí tu nivel actual en las 11 competencias clave de Product Management en solo 5 minutos.',
  },
  {
    number: 2,
    icon: BookOpen,
    title: 'Seguí la ruta de aprendizaje',
    description: 'Accedé a recursos seleccionados según tu perfil: Build (IC) o Lead (manager).',
  },
  {
    number: 3,
    icon: TrendingUp,
    title: 'Medí tu progreso',
    description: 'Con Premium, recibí mentoría personalizada y objetivos adaptados a tu carrera.',
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-12 md:py-20 bg-muted/30">
      <div className="container max-w-5xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            ¿Cómo funciona?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Un camino claro para crecer como Product Manager
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
            <Link to="/autoevaluacion">Comenzar ahora</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
