

# Plan: Agregar Opción de Upgrade a RePremium en Perfil

## Resumen

Añadir CTAs de upgrade en la sección "Plan y Suscripción" de la página de perfil para usuarios que pueden mejorar su plan:
- `premium` → `repremium`
- `curso_estrategia` → `cursos_all` o `repremium`
- `cursos_all` → `repremium`

---

## Ubicación del Cambio

Dentro de la Card "Plan y Suscripción" (líneas 237-358), después de los badges de estado y antes del botón de cancelar suscripción, agregaremos una sección condicional de upgrade.

---

## Lógica de Upgrade

| Plan actual | Opciones de upgrade disponibles |
|-------------|--------------------------------|
| `free` | Mantener botón "Ver planes" existente |
| `premium` | Upgrade a RePremium |
| `curso_estrategia` | Upgrade a Cursos All o RePremium |
| `cursos_all` | Upgrade a RePremium |
| `repremium` | Ninguna (ya tiene el plan máximo) |

---

## Diseño Visual

```
┌─────────────────────────────────────────────────────────────┐
│  ⬆️ Mejorar tu plan                                         │
│                                                             │
│  [Si es premium]                                            │
│  Obtené 2 sesiones mensuales y acceso a todos los cursos    │
│  con RePremium.                                             │
│  [Upgrade a RePremium →]                                    │
│                                                             │
│  [Si es curso_estrategia]                                   │
│  Accedé a todos los cursos actuales y futuros.              │
│  [Upgrade a Cursos All →]  [Upgrade a RePremium →]          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/Profile.tsx` | Agregar import de LemonSqueezyCheckout, ArrowUpRight. Agregar sección de upgrade dentro de la Card de suscripción |

---

## Sección Técnica

### Imports a agregar

```tsx
import { LemonSqueezyCheckout } from '@/components/LemonSqueezyCheckout';
import { ArrowUpRight } from 'lucide-react';
```

### Helper para detectar opciones de upgrade

```tsx
const getUpgradeOptions = () => {
  const plan = subscription?.plan;
  const isActive = subscription?.status === 'active';
  
  if (!isActive || plan === 'repremium' || plan === 'free') return null;
  
  if (plan === 'premium') {
    return {
      title: "Mejorar tu plan",
      description: "Obtené 2 sesiones mensuales 1:1 y acceso completo a todos los cursos con RePremium.",
      options: [{ plan: 'repremium' as const, label: 'Upgrade a RePremium' }]
    };
  }
  
  if (plan === 'curso_estrategia') {
    return {
      title: "Mejorar tu acceso",
      description: "Expandí tu acceso a más cursos o sumá mentoría personalizada.",
      options: [
        { plan: 'cursos_all' as const, label: 'Todos los Cursos' },
        { plan: 'repremium' as const, label: 'RePremium' }
      ]
    };
  }
  
  if (plan === 'cursos_all') {
    return {
      title: "Sumá mentoría",
      description: "¿Querés acompañamiento personalizado? Upgrade a RePremium incluye 2 sesiones mensuales 1:1.",
      options: [{ plan: 'repremium' as const, label: 'Upgrade a RePremium' }]
    };
  }
  
  return null;
};
```

### UI de upgrade (después de línea 302, antes del botón de cancelar)

```tsx
{/* Upgrade Section */}
{(() => {
  const upgradeInfo = getUpgradeOptions();
  if (!upgradeInfo) return null;
  
  return (
    <div className="p-4 bg-gradient-to-r from-amber-50 to-amber-100/50 dark:from-amber-950/20 dark:to-amber-900/10 rounded-lg border border-amber-200 dark:border-amber-800">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 bg-amber-200 dark:bg-amber-800 rounded-full flex items-center justify-center">
          <ArrowUpRight className="w-4 h-4 text-amber-700 dark:text-amber-300" />
        </div>
        <div className="flex-1 space-y-3">
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">{upgradeInfo.title}</p>
            <p className="text-sm text-amber-700 dark:text-amber-300">{upgradeInfo.description}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {upgradeInfo.options.map((option) => (
              <LemonSqueezyCheckout 
                key={option.plan}
                plan={option.plan} 
                buttonText={option.label}
                variant="default"
                size="sm"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
})()}
```

---

## Resultado

1. Usuarios `premium` verán un CTA para upgrade a `repremium`
2. Usuarios con `curso_estrategia` verán opciones para `cursos_all` y `repremium`
3. Usuarios con `cursos_all` verán opción para `repremium`
4. Usuarios `free` mantienen el botón "Ver planes" existente
5. Usuarios `repremium` no ven nada (ya tienen el plan máximo)

El diseño usa colores ámbar para destacar la oportunidad de upgrade sin ser invasivo.

