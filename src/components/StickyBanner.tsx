import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, X } from 'lucide-react';

interface StickyBannerProps {
  priorityAreasCount: number;
  ctaPath: string;
  onCtaClick?: () => void;
}

export function StickyBanner({ priorityAreasCount, ctaPath, onCtaClick }: StickyBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible || isDismissed || priorityAreasCount === 0) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-[#667eea] to-[#764ba2] text-white shadow-lg animate-fade-in"
      role="banner"
      aria-label="Oferta de mejora profesional"
    >
      <div className="container flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3">
        <p className="text-sm sm:text-base font-medium text-center sm:text-left">
          Tienes <strong>{priorityAreasCount} {priorityAreasCount === 1 ? 'área' : 'áreas'}</strong> de mejora prioritarias.
          Accede a tu plan personalizado.
        </p>
        <div className="flex items-center gap-2">
          <Button
            asChild
            size="sm"
            variant="secondary"
            className="bg-white text-[#667eea] hover:bg-white/90 font-semibold whitespace-nowrap"
            onClick={onCtaClick}
          >
            <Link to={ctaPath}>
              Ver plan de mejora
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <button
            onClick={() => setIsDismissed(true)}
            className="text-white/80 hover:text-white p-1"
            aria-label="Cerrar banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
