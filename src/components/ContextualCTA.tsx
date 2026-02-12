import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

interface ContextualCTAProps {
  skillName: string;
  ctaPath: string;
  onCtaClick?: () => void;
}

export function ContextualCTA({ skillName, ctaPath, onCtaClick }: ContextualCTAProps) {
  return (
    <Link
      to={ctaPath}
      onClick={onCtaClick}
      className="inline-flex items-center gap-1 mt-2 px-3 py-1.5 text-xs font-medium rounded-md border border-[#667eea] text-[#667eea] hover:bg-[#667eea] hover:text-white transition-colors"
      aria-label={`Mejorar en ${skillName}`}
    >
      Mejorar esta área
      <ArrowRight className="h-3 w-3" />
    </Link>
  );
}
