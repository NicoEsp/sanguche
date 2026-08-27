import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { usePricing } from '@/hooks/usePricing';

interface PremiumCTACardProps {
  ctaPath: string;
  onCtaClick?: () => void;
}

export function PremiumCTACard({ ctaPath, onCtaClick }: PremiumCTACardProps) {
  // El precio sale de LemonSqueezy (via pricing-config), no de un literal:
  // un aumento no debería dejar esta card mintiendo hasta que alguien la edite.
  // Se espera a que resuelva: usePricing devuelve el fallback mientras carga, y
  // mostrarlo sería cantar un precio que puede no ser el vigente.
  const { premium, loading: pricingLoading } = usePricing();

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#f093fb] to-[#f5576c] p-6 sm:p-8 shadow-lg animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-white" />
        <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
          Premium
        </span>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
        Probá Premium un mes. Si no te sirve, lo cancelás.
      </h3>
      <p className="text-white/85 text-sm sm:text-base mb-6">
        Mentoría 1:1, Career Path personalizado y recursos dedicados por{' '}
        {pricingLoading ? '...' : `${premium.formatted}/mes`} (pesos argentinos). Sin permanencia.
      </p>

      <Button
        asChild
        size="lg"
        className="w-full sm:w-auto bg-white text-[#f5576c] hover:bg-white/90 font-semibold"
        onClick={onCtaClick}
      >
        <Link to={ctaPath}>
          Probar Premium
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
