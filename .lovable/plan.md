

## Plan: Optimización de Flujo Post-Login y Redirección por Origen

### Resumen

Este plan aborda cuatro objetivos principales:
1. **Optimizar el flujo post-login** reduciendo tiempos de carga con skeleton loading y paralelización
2. **Cambiar el modo por defecto en `/auth`** de login a registro
3. **Destacar los enlaces de cambio de modo** como botones en lugar de text links
4. **Preservar la ruta de origen** para que usuarios que llegan desde `/preguntas` vuelvan ahí después del registro

---

### Parte 1: Preservar Ruta de Origen (Nueva)

#### 1.1 Problema identificado

Cuando un usuario no autenticado intenta acceder a `/preguntas`:
1. `ProtectedRoute` guarda la ubicación en `state={{ from: location }}`
2. Redirige a `/auth`
3. **Pero** cuando el usuario se registra, el `signUp` usa un redirect fijo:
   ```typescript
   const redirectUrl = `${window.location.origin}/?new_user=true`;
   ```
4. Después de verificar email, llega a `/` y `useHomeRedirect` lo lleva a `/autoevaluacion`

#### 1.2 Solución

Modificar el flujo para incluir la ruta de origen:

**Archivo: `src/pages/Auth.tsx`**

Leer el state de location para obtener la ruta de origen:

```typescript
import { useLocation } from 'react-router-dom';

// En el componente:
const location = useLocation();
const fromPath = location.state?.from?.pathname || null;
```

Pasar la ruta de origen al signUp:

```typescript
const handleSignUp = async (data: SignUpFormData) => {
  trackEvent('signup_started', { email: data.email });
  const { error } = await signUp(data.email, data.password, data.name, fromPath);
  // ...
};
```

**Archivo: `src/contexts/AuthContext.tsx`**

Modificar `signUp` para aceptar la ruta de origen:

```typescript
const signUp = async (email: string, password: string, name?: string, returnTo?: string) => {
  setIsLoading(true);
  try {
    // Incluir returnTo en el redirect URL
    let redirectUrl = `${window.location.origin}/?new_user=true`;
    if (returnTo) {
      redirectUrl += `&returnTo=${encodeURIComponent(returnTo)}`;
    }
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: name ? { name } : undefined
      }
    });
    // ...
  }
};
```

Igual para `signInWithGoogle`:

```typescript
const signInWithGoogle = async (returnTo?: string) => {
  let redirectUrl = window.location.origin;
  if (returnTo) {
    redirectUrl += `?returnTo=${encodeURIComponent(returnTo)}`;
  }
  
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: redirectUrl },
  });
  // ...
};
```

**Archivo: `src/hooks/useHomeRedirect.ts`**

Procesar el parámetro `returnTo` para redirigir al origen:

```typescript
useEffect(() => {
  // ... código existente ...
  
  // Verificar si hay ruta de retorno específica
  const returnTo = searchParams.get('returnTo');
  
  // Limpiar parámetros
  if (searchParams.has('new_user') || searchParams.has('returnTo')) {
    searchParams.delete('new_user');
    searchParams.delete('returnTo');
    setSearchParams(searchParams, { replace: true });
  }
  
  // Determinar destino
  let destination: string;
  
  // Si hay returnTo, usarlo como destino
  if (returnTo) {
    destination = decodeURIComponent(returnTo);
  } else if (!hasAssessment) {
    destination = '/autoevaluacion';
  } else if (hasActivePremium) {
    destination = '/progreso';
  } else {
    destination = '/mejoras';
  }
  
  // Navegar después del fade-out
  setTimeout(() => {
    navigate(destination, { replace: true });
  }, FADE_DURATION);
  
}, [/* deps */]);
```

---

### Parte 2: Optimización del Flujo Post-Login

#### 2.1 Reducir delay de fade-out

**Archivo: `src/hooks/useHomeRedirect.ts`**

Cambiar la constante FADE_DURATION de 300ms a 150ms.

#### 2.2 Implementar Skeleton Loading

**Archivo: `src/components/LoadingScreen.tsx`**

Agregar prop `variant` que permite mostrar skeleton loading:

```typescript
interface LoadingScreenProps {
  isFading?: boolean;
  variant?: 'spinner' | 'skeleton';
}
```

El skeleton incluirá:
- Header skeleton (logo + nav)
- Grid de 3 cards skeleton

**Archivo: `src/pages/Index.tsx`**

Usar variante skeleton:

```typescript
if (isRedirecting) {
  return <LoadingScreen isFading={isFading} variant="skeleton" />;
}
```

#### 2.3 Paralelizar llamadas

**Archivo: `src/contexts/AuthContext.tsx`**

Ejecutar `ensure_user_defaults` y prefetch en paralelo:

```typescript
if (currentUser) {
  Promise.allSettled([
    supabase.rpc('ensure_user_defaults'),
    queryClient.prefetchQuery({
      queryKey: ['user-composite-data', currentUser.id],
      // ...
    }),
  ]);
}
```

---

### Parte 3: Cambiar Modo por Defecto en Auth

**Archivo: `src/pages/Auth.tsx`**

Cambiar el estado inicial de `mode`:

```typescript
const [mode, setMode] = useState<AuthMode>('signup'); // Era 'login'
```

---

### Parte 4: Destacar Enlaces de Cambio de Modo

**Archivo: `src/pages/Auth.tsx`**

Cambiar los botones de `variant="link"` a `variant="outline"` con `w-full`:

```typescript
{mode === 'signup' && (
  <Button
    variant="outline"
    className="w-full"
    onClick={() => setMode('login')}
  >
    ¿Ya tienes cuenta? Inicia sesión
  </Button>
)}

{mode === 'login' && (
  <>
    <Button
      variant="outline"
      className="w-full"
      onClick={() => setMode('signup')}
    >
      ¿No tienes cuenta? Regístrate
    </Button>
    <Button
      variant="ghost"
      className="text-sm block mx-auto"
      onClick={() => setMode('reset')}
    >
      ¿Olvidaste tu contraseña?
    </Button>
  </>
)}
```

---

### Resumen de Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/hooks/useHomeRedirect.ts` | Reducir fade + procesar `returnTo` |
| `src/components/LoadingScreen.tsx` | Agregar variante skeleton |
| `src/pages/Index.tsx` | Usar variante skeleton |
| `src/contexts/AuthContext.tsx` | Paralelizar + pasar `returnTo` en signUp/signInWithGoogle |
| `src/pages/Auth.tsx` | Modo default = signup + botones destacados + pasar `fromPath` |

---

### Flujo Final Esperado

Usuario llega a `/preguntas` sin autenticar:

```text
/preguntas → (no auth) → /auth?state={from: "/preguntas"}
     ↓
Registro con email + verificación
     ↓
Click en email → /?new_user=true&returnTo=/preguntas
     ↓
useHomeRedirect detecta returnTo
     ↓
Redirige a /preguntas ✓
```

