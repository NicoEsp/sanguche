

## Fix: `assessment_abandoned` inflado

### Problema
El evento se dispara incorrectamente en visitas pasivas (restauración de localStorage incrementa `answered`) y por race condition en submit (`fireAbandon` ejecuta antes de que el ref se actualice).

### Cambios en `src/pages/Assessment.tsx`

**1. Agregar 2 refs nuevos (línea ~161, junto a los existentes)**
```typescript
const completedThisSessionRef = useRef(false);
const sessionActiveRef = useRef(false);
```

**2. Modificar `fireAbandon` (línea 168) — agregar guards al inicio**
```typescript
const fireAbandon = () => {
  if (completedThisSessionRef.current) return;   // completó en esta sesión
  if (!sessionActiveRef.current) return;          // nunca interactuó activamente
  if (!isReevaluatingRef.current) return;         // guard existente
  if (answeredRef.current === 0) return;          // guard existente
  // ... resto del tracking igual
};
```

**3. Marcar sesión activa solo con interacción real (línea 273)**
Cambiar el effect que sincroniza `answeredRef`:
```typescript
useEffect(() => {
  answeredRef.current = answered;
  if (answered > 0 && isReevaluating) {
    sessionActiveRef.current = true;
  }
}, [answered, isReevaluating]);
```

**4. Marcar completado en submit exitoso (antes de línea 399)**
```typescript
completedThisSessionRef.current = true;
```
Va **antes** de `setIsReevaluating(false)` para eliminar la race condition.

### Resultado
| Escenario | Antes | Después |
|---|---|---|
| Visita pasiva sin tocar nada | Dispara | No dispara |
| Completar y navegar fuera | A veces dispara | No dispara |
| Responder preguntas y cerrar tab | Dispara | Dispara |
| Responder preguntas y navegar | Dispara | Dispara |

