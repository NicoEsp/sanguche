import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

interface PremiumCTACardProps {
  userLevel: string;
  ctaPath: string;
  onCtaClick?: () => void;
}

export function PremiumCTACard({ userLevel, ctaPath, onCtaClick }: PremiumCTACardProps) {
  const benefits = [
    "Guía de carrera personalizada para tu nivel",
    `Plan de desarrollo adaptado a nivel ${userLevel}`,
    "Recursos curados según tus áreas de mejora",
    "Career Path con objetivos y pasos concretos",
    "Nuevos contenidos y ejercicios cada mes",
  ];

  return (
    <div className="rounded-2xl bg-gradient-to-br from-[#f093fb] to-[#f5576c] p-6 sm:p-8 shadow-lg animate-fade-in">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="h-5 w-5 text-white" />
        <span className="text-white/90 text-sm font-medium uppercase tracking-wide">
          Premium
        </span>
      </div>

      <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">
        Potenciá tu carrera como PM
      </h3>
      <p className="text-white/85 text-sm sm:text-base mb-5">
        Accede a mentoría personalizada y un plan de desarrollo diseñado para tu perfil {userLevel}.
      </p>

      <ul className="space-y-2.5 mb-6">
        {benefits.map((benefit, index) => (
          <li key={index} className="flex items-start gap-2.5">
            <Check className="h-5 w-5 text-white mt-0.5 flex-shrink-0" />
            <span className="text-white text-sm">{benefit}</span>
          </li>
        ))}
      </ul>

      <Button
        asChild
        size="lg"
        className="w-full sm:w-auto bg-white text-[#f5576c] hover:bg-white/90 font-semibold"
        onClick={onCtaClick}
      >
        <Link to={ctaPath}>
          Quiero mejorar como PM
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
