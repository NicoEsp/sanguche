

## Plan: Implementar Login con Google OAuth

### Parte 1: Configuración Manual (Debes hacer esto primero)

---

#### Paso 1: Crear proyecto en Google Cloud Console

1. Ir a [Google Cloud Console](https://console.cloud.google.com/)
2. En el menú superior, hacer clic en el selector de proyecto
3. Hacer clic en **"Nuevo Proyecto"**
4. Nombre sugerido: `ProductPrepa Auth`
5. Hacer clic en **"Crear"**

---

#### Paso 2: Configurar la Pantalla de Consentimiento OAuth

1. En el menú lateral, ir a **APIs & Services → OAuth consent screen**
2. Seleccionar **"External"** como tipo de usuario
3. Hacer clic en **"Create"**
4. Completar los campos obligatorios:
   - **App name**: `ProductPrepa`
   - **User support email**: Tu email
   - **Developer contact email**: Tu email
5. Hacer clic en **"Save and Continue"**
6. En **Scopes**, hacer clic en "Add or Remove Scopes" y agregar:
   - `openid`
   - `.../auth/userinfo.email`
   - `.../auth/userinfo.profile`
7. Hacer clic en **"Save and Continue"** hasta terminar

---

#### Paso 3: Crear Credenciales OAuth

1. En el menú lateral, ir a **APIs & Services → Credentials**
2. Hacer clic en **"+ Create Credentials"** → **"OAuth Client ID"**
3. Seleccionar **"Web application"** como tipo
4. Nombre: `ProductPrepa Web`
5. En **Authorized JavaScript origins**, agregar:
   ```
   https://productprepa.com
   https://sanguche.lovable.app
   http://localhost:8080
   ```
6. En **Authorized redirect URIs**, agregar:
   ```
   https://lgscevufwnetegglgpnw.supabase.co/auth/v1/callback
   ```
7. Hacer clic en **"Create"**
8. **IMPORTANTE**: Copiar el **Client ID** y **Client Secret** que aparecen

---

#### Paso 4: Configurar Google en Supabase

1. Ir al [Dashboard de Supabase - Providers](https://supabase.com/dashboard/project/lgscevufwnetegglgpnw/auth/providers)
2. Buscar **Google** en la lista
3. Activar el toggle para habilitarlo
4. Pegar el **Client ID** de Google
5. Pegar el **Client Secret** de Google
6. Hacer clic en **"Save"**

---

### Parte 2: Cambios en el Código

Una vez configurado Google en Supabase, implementaré los siguientes cambios:

---

#### 2.1 Crear `GoogleAuthButton.tsx`

Nuevo archivo con el botón estilizado de Google que incluye:
- Logo SVG oficial de Google con colores correctos
- Estado de loading
- Prop para personalizar el texto del botón

---

#### 2.2 Actualizar `AuthContext.tsx`

Agregar la función `signInWithGoogle` al contexto:

```typescript
// Nuevo método en el interface
signInWithGoogle: () => Promise<{ error: any }>;

// Implementación
const signInWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });
  
  if (error) {
    toast({
      title: "Error con Google",
      description: "No se pudo iniciar sesión con Google.",
      variant: "destructive",
    });
  }
  
  return { error };
};
```

---

#### 2.3 Actualizar `LoginForm.tsx`

Agregar el botón de Google arriba del formulario de email:

```tsx
<GoogleAuthButton 
  onClick={onGoogleSignIn} 
  isLoading={isLoading} 
/>

<div className="relative my-4">
  <Separator />
  <span className="bg-background px-2 text-muted-foreground">
    o continúa con email
  </span>
</div>

{/* Form de email existente */}
```

---

#### 2.4 Actualizar `SignUpForm.tsx`

Misma estructura que LoginForm: botón de Google + separador + form de email.

---

#### 2.5 Actualizar `Auth.tsx`

Conectar el handler de Google con tracking de Mixpanel:

```typescript
const { signInWithGoogle } = useAuth();

const handleGoogleSignIn = async () => {
  trackEvent('google_signin_started');
  await signInWithGoogle();
};
```

Y pasar `onGoogleSignIn={handleGoogleSignIn}` a los forms.

---

#### 2.6 Actualizar `index.ts`

Exportar el nuevo componente GoogleAuthButton.

---

### Resumen de archivos

| Archivo | Acción |
|---------|--------|
| `src/components/auth/GoogleAuthButton.tsx` | Crear |
| `src/components/auth/index.ts` | Modificar |
| `src/contexts/AuthContext.tsx` | Modificar |
| `src/components/auth/LoginForm.tsx` | Modificar |
| `src/components/auth/SignUpForm.tsx` | Modificar |
| `src/pages/Auth.tsx` | Modificar |

---

### Notas Importantes

- **Tracking**: Se agregará evento `google_signin_started` a Mixpanel
- **Perfiles automáticos**: El trigger `handle_new_user` ya existente creará automáticamente el perfil para usuarios de Google
- **Redirect**: Después de autenticar, el usuario volverá a la home y será redirigido según su estado (assessment, subscription, etc.)

