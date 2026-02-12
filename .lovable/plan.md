

## Plan: Fix auth loading infinito cuando refresh_token falla

### Problema

En `src/contexts/AuthContext.tsx` (linea 169), `supabase.auth.getSession()` intenta refrescar el token. Si esa llamada HTTP cuelga o tarda demasiado, `setIsLoading(false)` nunca se ejecuta y la app queda atrapada en la pantalla de "Cargando...".

### Solucion

Agregar un **timeout de seguridad** en el `useEffect` de inicializacion de auth (lineas 132-190). Si despues de 8 segundos `isLoading` sigue en `true`, forzar `setIsLoading(false)` para desbloquear la UI y tratar al usuario como no autenticado.

### Cambio tecnico

**Archivo:** `src/contexts/AuthContext.tsx`

Dentro del `useEffect` que contiene `onAuthStateChange` y `getSession` (linea 132), agregar un timer de fallback:

```typescript
useEffect(() => {
  // Safety timeout: if auth takes too long, unblock the UI
  const safetyTimeout = setTimeout(() => {
    setIsLoading((current) => {
      if (current) {
        console.warn('[AuthContext] Auth initialization timed out, unblocking UI');
        return false;
      }
      return current;
    });
  }, 8000);

  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    // ... existing code unchanged
  );

  supabase.auth.getSession().then(({ data: { session } }) => {
    // ... existing code unchanged
  });

  return () => {
    clearTimeout(safetyTimeout);
    subscription.unsubscribe();
  };
}, [toast, queryClient]);
```

### Comportamiento esperado

- Si auth resuelve normalmente (< 8s): funciona igual que antes, el timeout se limpia
- Si auth cuelga: despues de 8s la UI se desbloquea, el usuario ve la landing/login en vez de "Cargando..." infinito
- Si el token estaba corrupto: el usuario simplemente no esta logueado y puede re-autenticarse

### Alcance

Un solo archivo modificado, una sola adicion de ~10 lineas. Sin riesgo para el flujo normal de auth.
