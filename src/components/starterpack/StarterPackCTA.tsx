import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ClipboardCheck, Crown } from 'lucide-react';

interface StarterPackCTAProps {
  variant?: 'build' | 'lead' | 'default';
}

export function StarterPackCTA({ variant = 'default' }: StarterPackCTAProps) {
  const title = variant === 'build' 
    ? '¿Listo para crecer como IC?'
    : variant === 'lead'
      ? '¿Listo para liderar mejor?'
      : '¿Listo para dar el siguiente paso?';

  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 rounded-2xl p-8 md:p-12 text-center border border-primary/10">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
            {title}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Comenzá con la autoevaluación gratuita y descubrí cómo Product Prepa 
            puede ayudarte a alcanzar tus metas profesionales.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild>
              <Link to="/autoevaluacion">
                <ClipboardCheck className="w-5 h-5 mr-2" />
                Hacer autoevaluación
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/premium">
                <Crown className="w-5 h-5 mr-2" />
                Ver Premium
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
