import { Users, Star, Award } from 'lucide-react';
import { useSocialProofMetrics } from '@/hooks/useSocialProofMetrics';

export function SocialProofStrip() {
  const { data: metrics } = useSocialProofMetrics();

  // Round down to nearest 50 for cleaner display
  const displayUsers = metrics ? Math.floor(metrics.totalUsers / 50) * 50 : 450;
  const displayAssessments = metrics ? Math.floor(metrics.totalAssessments / 50) * 50 : 350;

  return (
    <section className="border-y bg-muted/30">
      <div className="container py-4">
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span><strong>+{displayUsers}</strong> PMs registrados</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-amber-500" />
            <span><strong>+{displayAssessments}</strong> evaluaciones completadas</span>
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
