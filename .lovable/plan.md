

# Plan: Optimización de tiempos de carga del sitio

## Diagnóstico

Identifiqué estos cuellos de botella en el flujo de carga actual:

```text
main.tsx: await ensureLatestVersion() ──► fetch /version.json (BLOQUEA render)
    │
    ▼
AuthContext: getSession() + onAuthStateChange ──► spinner hasta resolver
    │
    ▼
AppLayout: isLoading=true ──► skeleton hasta que auth resuelve
    │
    ▼
useHomeRedirect: espera auth + assessment + subscription ──► 3 queries en waterfall
    │
    ▼
Página visible
```

**Problemas principales:**

1. **`ensureLatestVersion` bloquea el render inicial** en `main.tsx` con un `await` antes de montar React. En conexiones lentas o mobile, esto agrega 500ms-2s de pantalla blanca.

2. **Waterfall de queries en useHomeRedirect**: espera auth → luego assessment (profile + assessment query) → luego subscription (profile + subscription query). Son 2 queries secuenciales que cada una hace su propio fetch de profile, totalizando ~4 round trips.

3. **AuthContext muestra spinner bloqueante** mientras `getSession()` resuelve, impidiendo que usuarios no autenticados vean la landing inmediatamente.

4. **Google Fonts carga en `<head>` sin `font-display: swap`** implícito (aunque `display=swap` está en la URL, el `<link>` bloquea el render del CSS).

5. **No hay prefetch de chunks críticos**: la landing (`Index.tsx`) se carga lazy sin preload hint.

## Cambios propuestos

### 1. No bloquear render con version check
**Archivo:** `src/main.tsx`

Renderizar React inmediatamente y ejecutar el version check en paralelo (no await). Si hay una versión nueva, recargar después. Elimina la pantalla blanca inicial.

### 2. Optimizar AuthContext para no-auth fast path
**Archivo:** `src/contexts/AuthContext.tsx`

Antes de que `getSession()` resuelva, si no hay token en localStorage (`sb-*-auth-token`), setear `isLoading=false` inmediatamente. Esto permite que usuarios no autenticados (la mayoría del tráfico orgánico) vean la landing sin esperar la respuesta de Supabase Auth.

### 3. Prefetch de la landing page chunk
**Archivo:** `src/App.tsx`

Agregar `<link rel="modulepreload">` o usar la función de Vite para precargar el chunk de `Index.tsx` dado que es la página más visitada.

### 4. Consolidar queries de useHomeRedirect con composite data
**Archivo:** `src/hooks/useHomeRedirect.ts`

Usar `useProfileCompositeData` (que ya existe y hace 1 solo query) en lugar de llamar `useAssessmentData` + `useSubscription` por separado. El composite data ya tiene `assessmentsCount` y `subscription`, que es todo lo que useHomeRedirect necesita para decidir el destino.

### 5. Preconnect a Supabase
**Archivo:** `index.html`

Agregar `<link rel="preconnect" href="https://lgscevufwnetegglgpnw.supabase.co">` para establecer la conexión TCP/TLS antes de que el JS la necesite.

### 6. Font loading optimization
**Archivo:** `index.html`

Agregar `<link rel="preload">` para la fuente Inter con `as="style"` y usar `fetchpriority="high"` para el CSS de Google Fonts.

## Lo que NO se toca

- Lazy loading de páginas (ya está bien)
- QueryClient config (staleTime/gcTime ya están optimizados)
- Realtime channels (necesarios para la funcionalidad)
- Mixpanel (ya carga lazy)

## Impacto esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| Tiempo a primer contenido visible (no-auth) | ~2-3s | ~0.5-1s |
| Tiempo a landing interactiva (no-auth) | ~3-4s | ~1-1.5s |
| Redirect para usuarios auth | ~3-4s | ~2s |

