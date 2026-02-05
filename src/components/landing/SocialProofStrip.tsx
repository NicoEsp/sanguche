import { Users, Star, Award } from 'lucide-react';

export function SocialProofStrip() {
  return (
    <section className="border-y bg-muted/30">
      <div className="container py-4">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span><strong>+450</strong> PMs registrados</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <span><strong>+350</strong> evaluaciones completadas</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            <span><strong>+40 horas</strong> de mentoría dedicadas</span>
          </div>
        </div>
      </div>
    </section>
  );
}
