import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function WhatIsProductPrepa() {
  return (
    <section className="py-12 md:py-16">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center gap-8">
          {/* Logo */}
          <div className="shrink-0">
            <img 
              src="/assets/sanguche.png" 
              alt="Product Prepa" 
              className="w-24 h-24 md:w-32 md:h-32"
            />
          </div>
          
          {/* Content */}
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold text-foreground mb-3">
              ¿Qué es Product Prepa?
            </h2>
            <p className="text-muted-foreground mb-4">
              Product Prepa es una plataforma de desarrollo profesional para Product Managers 
              en Latinoamérica. Te ayudamos a identificar tus fortalezas, cerrar brechas de 
              habilidades y acelerar tu carrera con mentoría personalizada.
            </p>
            <Link 
              to="/" 
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium"
            >
              Ver cómo funciona
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
