

## Plan: Fix Error 422 en Checkout de Lemon Squeezy

### Diagnóstico

El error viene directamente de la API de Lemon Squeezy:

```json
{
  "detail": "The checkout data.name field must be a string.",
  "source": { "pointer": "/data/attributes/checkout_data/name" }
}
```

**Causa raíz:** En `supabase/functions/lemon-squeezy-checkout/index.ts`, línea 204, el campo `name` se envía como un string vacío `''` cuando el usuario es anónimo. Lemon Squeezy no acepta strings vacíos para este campo.

### Solución

Modificar el objeto `checkout_data` para que solo incluya el campo `name` cuando tenga un valor válido (no vacío).

---

### Cambio en `supabase/functions/lemon-squeezy-checkout/index.ts`

**Líneas 198-212 - Antes:**
```typescript
const checkoutData = {
  data: {
    type: 'checkouts',
    attributes: {
      checkout_data: {
        email: checkoutEmail,
        name: userName,  // ❌ Envía "" para usuarios anónimos
        custom: {
          // ...
        }
      },
      // ...
    }
  }
};
```

**Después:**
```typescript
const checkoutData = {
  data: {
    type: 'checkouts',
    attributes: {
      checkout_data: {
        email: checkoutEmail,
        ...(userName && { name: userName }),  // ✅ Solo incluye si tiene valor
        custom: {
          // ...
        }
      },
      // ...
    }
  }
};
```

---

### Detalle técnico

| Escenario | `userName` | Campo enviado |
|-----------|------------|---------------|
| Usuario autenticado con nombre | `"Nico"` | `name: "Nico"` |
| Usuario autenticado sin nombre | `""` | Campo no incluido |
| Usuario anónimo | `""` | Campo no incluido |

El spread condicional `...(userName && { name: userName })` solo agrega la propiedad `name` al objeto cuando `userName` es truthy (tiene contenido).

---

### Pasos de implementación

1. Modificar línea 204 en `supabase/functions/lemon-squeezy-checkout/index.ts`
2. El edge function se desplegará automáticamente
3. Probar checkout anónimo con un email de prueba

---

### Riesgo

**Muy bajo** - Es un cambio de una línea que solo afecta cómo se construye el payload hacia Lemon Squeezy. No cambia la lógica de negocio ni las validaciones existentes.

