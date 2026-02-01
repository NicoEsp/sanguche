

## Plan: EmailCaptureDialog Dinámico + Sistema de Upgrades

### Resumen

Implementaremos dos mejoras clave para mejorar la experiencia de compra:

1. **EmailCaptureDialog Dinámico**: El diálogo mostrará mensajes contextuales según el producto que el usuario está comprando (curso vs suscripción Premium)

2. **Sistema de Upgrades para Usuarios**: Lógica frontend para permitir upgrades desde:
   - `curso_estrategia` → `cursos_all` o `repremium`
   - `premium` → `repremium`

---

### Parte 1: EmailCaptureDialog Dinámico

#### Problema Actual
El `EmailCaptureDialog` muestra el mismo mensaje para todos los productos:
> "Al completar tu pago, te enviaremos acceso inmediato a tu cuenta **Premium** con todos los beneficios incluidos."

Esto es confuso cuando un usuario está comprando `curso_estrategia` o `cursos_all`.

#### Solución

| Plan | Título | Descripción |
|------|--------|-------------|
| `premium` | "Ingresa tu email para suscribirte" | "Al completar tu pago, tendrás acceso a tu mentoría Premium con sesión mensual 1:1." |
| `repremium` | "Ingresa tu email para suscribirte" | "Al completar tu pago, tendrás acceso a RePremium con 2 sesiones mensuales y todos los cursos." |
| `curso_estrategia` | "Ingresa tu email para comprar" | "Al completar tu pago, tendrás acceso de por vida al curso Estrategia de Producto." |
| `cursos_all` | "Ingresa tu email para comprar" | "Al completar tu pago, tendrás acceso de por vida a todos los cursos actuales y futuros." |

El mensaje de seguridad también se adaptará:
- Suscripciones: "🔒 Pago seguro. Cancela cuando quieras."
- Cursos: "🔒 Pago único y seguro. Acceso de por vida."

---

### Parte 2: Sistema de Upgrades Frontend

#### Paths de Upgrade Soportados

```
curso_estrategia → cursos_all    (de 1 curso a todos)
curso_estrategia → repremium     (de 1 curso a mentoría + cursos)
premium → repremium              (de 1 sesión a 2 + cursos)
```

#### Cambios en UI

**En `/planes`:**
- Si usuario tiene `curso_estrategia`: mostrar CTA "Upgrade a Cursos All" y "Upgrade a RePremium"
- Si usuario tiene `premium`: mostrar CTA "Upgrade a RePremium" en la tarjeta de RePremium

**En `/cursos-info`:**
- Si usuario tiene `curso_estrategia`: mostrar botón "Acceder al curso" + opción de upgrade a cursos_all

**En `/perfil`:**
- Agregar sección "Mejorar plan" con opciones de upgrade disponibles

---

### Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/EmailCaptureDialog.tsx` | Agregar prop `plan` y mensajes dinámicos |
| `src/components/LemonSqueezyCheckout.tsx` | Pasar `plan` al EmailCaptureDialog |
| `src/pages/Planes.tsx` | Lógica de upgrade: mostrar opciones según plan actual |
| `src/components/ui/badge.tsx` | (Opcional) Nuevo variant "upgrade" |

---

### Sección Técnica

#### 1. EmailCaptureDialog.tsx - Props y Contenido Dinámico

```typescript
interface EmailCaptureDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEmailSubmit: (email: string) => void;
  isLoading: boolean;
  plan?: 'premium' | 'repremium' | 'curso_estrategia' | 'cursos_all';
}

const getDialogContent = (plan: string) => {
  switch (plan) {
    case 'curso_estrategia':
      return {
        title: "Ingresa tu email para comprar",
        description: "Al completar tu pago, tendrás acceso de por vida al curso Estrategia de Producto.",
        securityNote: "🔒 Pago único y seguro. Acceso de por vida."
      };
    case 'cursos_all':
      return {
        title: "Ingresa tu email para comprar",
        description: "Al completar tu pago, tendrás acceso de por vida a todos los cursos actuales y futuros.",
        securityNote: "🔒 Pago único y seguro. Acceso de por vida."
      };
    case 'repremium':
      return {
        title: "Ingresa tu email para suscribirte",
        description: "Al completar tu pago, tendrás acceso a RePremium con 2 sesiones mensuales 1:1 y todos los cursos.",
        securityNote: "🔒 Pago seguro procesado por Lemon Squeezy. Cancela cuando quieras."
      };
    default: // premium
      return {
        title: "Ingresa tu email para suscribirte",
        description: "Al completar tu pago, tendrás acceso a tu mentoría Premium con sesión mensual 1:1.",
        securityNote: "🔒 Pago seguro procesado por Lemon Squeezy. Cancela cuando quieras."
      };
  }
};
```

#### 2. LemonSqueezyCheckout.tsx - Pasar plan al dialog

```typescript
<EmailCaptureDialog
  open={showEmailDialog}
  onOpenChange={setShowEmailDialog}
  onEmailSubmit={handleEmailSubmit}
  isLoading={loading}
  plan={plan}  // Nueva prop
/>
```

#### 3. Planes.tsx - Lógica de Upgrade

```typescript
// Para usuarios con curso_estrategia: mostrar upgrade a cursos_all
{hasCursoEstrategia && !hasCursosAll && !hasActiveRePremium && (
  <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
    <p className="text-sm mb-2">¿Querés acceso a todos los cursos?</p>
    <LemonSqueezyCheckout 
      plan="cursos_all" 
      buttonText="Upgrade a Todos los Cursos"
      variant="outline"
    />
  </div>
)}

// Para usuarios con premium: mostrar upgrade a repremium
{hasActivePremium && !hasActiveRePremium && (
  <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
    <p className="text-sm mb-2">¿Querés más sesiones y acceso a cursos?</p>
    <LemonSqueezyCheckout 
      plan="repremium" 
      buttonText="Upgrade a RePremium"
      variant="default"
    />
  </div>
)}
```

#### 4. Webhook - El backend ya soporta upgrades

El webhook actual usa `upsert` con `onConflict: 'user_id'`, lo que significa que automáticamente sobrescribe la suscripción anterior cuando el usuario compra un plan nuevo:

```typescript
// En lemon-squeezy-webhook/index.ts (líneas 291-308)
await supabase
  .from('user_subscriptions')
  .upsert({
    user_id: userId,
    plan: planConfig.plan,  // El nuevo plan
    status: 'active',
    // ... otros campos
  }, { 
    onConflict: 'user_id',  // Sobrescribe el plan anterior
    ignoreDuplicates: false 
  });
```

Esto significa que cuando un usuario con `curso_estrategia` compra `cursos_all`, automáticamente se actualiza su plan. El frontend solo necesita mostrar las opciones correctas.

---

### Consideraciones de Negocio

1. **No hay prorratas automáticas**: Lemon Squeezy no calcula automáticamente la diferencia de precio. El usuario paga el precio completo del nuevo plan.

2. **Suscripciones vs One-time**: 
   - Si un usuario tiene `curso_estrategia` (one-time) y compra `repremium` (subscription), su acceso cambia completamente al modelo de suscripción
   - Si cancela `repremium`, perdería el acceso al curso también (porque el plan se sobrescribió)

3. **Posible mejora futura**: Implementar lógica para mantener acceso a compras one-time anteriores (requiere cambios en modelo de datos)

---

### Resultado Final

1. Usuarios anónimos verán mensajes contextuales al comprar cualquier producto
2. Usuarios con planes inferiores verán CTAs claros para hacer upgrade
3. El flujo de upgrade funciona out-of-the-box porque el webhook ya usa upsert

