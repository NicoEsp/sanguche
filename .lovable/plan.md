
# Plan: Optimización de Landing Page para Reducir Bounce Rate

## Diagnóstico Actual

**Problema identificado:** Bounce rate del 59% - más de la mitad de los visitantes abandonan sin interactuar.

**Análisis de la landing actual:**
- Hero section con mucho texto inicial
- CTAs principales bien visibles pero pueden mejorarse
- Propuesta de valor diluida en múltiples secciones
- Sin elementos de urgencia o prueba social inmediata
- Mobile experience podría optimizarse

---

## Estrategia de Optimización

### 1. Hero Section - Above the Fold

**Objetivo:** Captar atención en los primeros 3 segundos

| Elemento Actual | Problema | Mejora Propuesta |
|-----------------|----------|------------------|
| Badge largo "Evaluación específica para PM..." | Demasiado texto | Badge corto: "Gratis - 5 minutos" |
| Título genérico | No comunica beneficio inmediato | Título orientado a resultado: "Descubrí tu nivel real como PM" |
| Subtítulo largo (2 líneas) | Información densa | Una línea clara + bullet points |
| Sin prueba social | Falta credibilidad | Agregar: "+450 PMs evaluados" |

**Nuevo Hero propuesto:**
```
Badge: ⚡ Gratis · Solo 5 minutos

Título: Descubrí tu nivel real como Product Manager

Subtítulo: Autoevaluación diseñada por NicoProducto para identificar 
          tus fortalezas y áreas de mejora.

CTA Principal: [Comenzar evaluación gratis →]

Prueba social: ✓ +450 PMs evaluados  ✓ 11 competencias  ✓ Roadmap personalizado
```

### 2. Prueba Social Visible

**Agregar sección compacta debajo del hero:**
- Número de usuarios registrados (+450)
- Contador de evaluaciones completadas (+350)
- Logos de empresas donde trabajan usuarios (si aplica)
- Micro-testimonios en formato compacto

### 3. Sticky CTA Mobile

**Para reducir bounce en mobile (donde es más alto):**
- Botón flotante sticky en la parte inferior
- Aparece después de scroll de 200px
- Texto: "Comenzar gratis" con flecha
- Diseño compacto que no bloquee contenido

### 4. Simplificación de "How It Works"

**Reducir de 4 pasos a 3 más concisos:**
1. Evaluáte (5 min) → Conocé tu nivel actual
2. Descubrí → Áreas de mejora priorizadas  
3. Crecé → Recursos y roadmap personalizado

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Index.tsx` | Hero optimizado, social proof, sticky CTA mobile |
| `src/components/sections/HowItWorks.tsx` | Simplificar a 3 pasos |
| `src/components/landing/SocialProofStrip.tsx` | Nuevo componente |
| `src/components/landing/StickyMobileCTA.tsx` | Nuevo componente |

---

## Sección Técnica

### Nuevo Hero Section

```tsx
{/* Badge más conciso */}
<Badge variant="secondary" className="px-4 py-2 text-sm font-medium">
  <Zap className="h-4 w-4 mr-2" />
  Gratis · Solo 5 minutos
</Badge>

{/* Título orientado a resultado */}
<h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6">
  Descubrí tu nivel real como{' '}
  <span className="text-primary">Product Manager</span>
</h1>

{/* Subtítulo simplificado */}
<p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
  Autoevaluación diseñada por{' '}
  <a href="https://linkedin.com/in/nicolas-espindola/" className="text-primary underline">
    NicoProducto
  </a>{' '}
  para identificar tus fortalezas y áreas de mejora.
</p>

{/* CTA único y prominente */}
<Button asChild size="lg" className="text-lg px-10 py-7 font-semibold shadow-lg">
  <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
    Comenzar evaluación gratis
    <ArrowRight className="ml-2 h-5 w-5" />
  </Link>
</Button>

{/* Social proof inmediato */}
<div className="flex flex-wrap items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
  <div className="flex items-center gap-2">
    <Users className="h-4 w-4 text-primary" />
    <span className="font-medium">+450 PMs evaluados</span>
  </div>
  <div className="flex items-center gap-2">
    <Check className="h-4 w-4 text-primary" />
    <span>11 competencias</span>
  </div>
  <div className="flex items-center gap-2">
    <Check className="h-4 w-4 text-primary" />
    <span>Roadmap personalizado</span>
  </div>
</div>
```

### Sticky Mobile CTA Component

```tsx
// src/components/landing/StickyMobileCTA.tsx
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export function StickyMobileCTA({ isAuthenticated }: { isAuthenticated: boolean }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 200);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur border-t md:hidden z-50 animate-slide-up">
      <Button asChild size="lg" className="w-full">
        <Link to={isAuthenticated ? "/autoevaluacion" : "/auth"}>
          Comenzar gratis
          <ArrowRight className="ml-2 h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
```

### HowItWorks Simplificado (3 pasos)

```tsx
const steps = [
  {
    icon: CheckCircle,
    title: "Evaluáte",
    subtitle: "5 minutos",
    description: "Respondé preguntas sobre tus habilidades en 11 competencias de Product Management"
  },
  {
    icon: Target,
    title: "Descubrí",
    description: "Identificá tus fortalezas y las áreas donde más impacto tendrá tu desarrollo"
  },
  {
    icon: TrendingUp,
    title: "Crecé",
    description: "Accedé a recursos curados y un roadmap específico para tu perfil"
  }
];
```

---

## Métricas a Monitorear Post-Implementación

| Métrica | Actual | Objetivo |
|---------|--------|----------|
| Bounce rate | 59% | <45% |
| Tiempo en página | 3:01 | >4:00 |
| Click en CTA hero | - | >15% |
| Scroll a pricing | - | >40% |

---

## Resultado Esperado

1. **Hero más impactante** con propuesta de valor clara en 3 segundos
2. **Prueba social inmediata** que genera confianza
3. **CTA sticky en mobile** que captura usuarios que scrollean
4. **Proceso simplificado** más fácil de entender
5. **Tracking mejorado** para medir cada cambio
