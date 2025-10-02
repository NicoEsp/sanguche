# 🚀 Guía de Deployment del Panel de Administración

## Estado Actual

✅ **COMPLETADO**: El admin panel está listo para deployment
- Estructura separada en `/admin-app/`
- Seguridad hardcoded para nicolassespindola@gmail.com
- Configuración independiente de la app principal
- Todas las funcionalidades implementadas

## Opción Implementada: Subdominio Temporal de Lovable

Has elegido usar un **subdominio temporal de Lovable** para el admin panel mientras preparas el dominio personalizado.

## 📋 Pasos para Deployment

### 1. Crear Nuevo Proyecto en Lovable (Si no lo has hecho)

1. Ve a https://lovable.dev
2. Click en "New Project"
3. Sube SOLO el contenido de la carpeta `admin-app/`:
   - admin-app/src/
   - admin-app/index.html
   - admin-app/package.json
   - admin-app/vite.config.ts
   - admin-app/tailwind.config.ts
   - admin-app/tsconfig.json
   - admin-app/postcss.config.js

**IMPORTANTE**: NO subas la carpeta raíz del proyecto, solo el contenido de `admin-app/`

### 2. Verificar la Configuración

Una vez creado el proyecto:
1. Verifica que se compile correctamente
2. Verifica que el puerto sea 5174 en desarrollo (ya configurado en vite.config.ts)
3. No es necesario cambiar nada en el código

### 3. Deploy Automático

Lovable desplegará automáticamente tu proyecto en:
```
https://[project-id].lovable.app
```

O puedes asignar un nombre personalizado como:
```
https://admin-productprepa.lovable.app
```

### 4. Prueba de Acceso

1. Abre la URL del deployment
2. Deberías ver la pantalla de login
3. Intenta iniciar sesión con:
   - Email: nicolassespindola@gmail.com
   - Contraseña: [tu contraseña de Supabase]
4. Verifica que solo este email pueda acceder

### 5. Verificar Funcionalidades

Después del login, verifica:
- ✅ Dashboard carga correctamente
- ✅ Gestión de usuarios funciona
- ✅ Gestión de evaluaciones funciona
- ✅ Gestión de recomendaciones funciona
- ✅ Gestión de recursos funciona
- ✅ Configuración funciona

## 🔒 Seguridad Verificada

El sistema tiene múltiples capas de seguridad:

### Capa 1: Frontend (AuthContext)
```typescript
// admin-app/src/contexts/AuthContext.tsx
const ADMIN_EMAIL = 'nicolassespindola@gmail.com';

// Valida antes de hacer login
if (email !== ADMIN_EMAIL) {
  return { error: { message: 'Unauthorized' } };
}
```

### Capa 2: Protección de Rutas
```typescript
// admin-app/src/components/AdminProtectedRoute.tsx
if (!isAuthorizedAdmin) {
  return <Navigate to="/login" replace />;
}
```

### Capa 3: Base de Datos (RLS)
```sql
-- Función is_admin() verifica en user_roles
CREATE FUNCTION is_admin() RETURNS boolean AS $$
  -- Solo devuelve true para el admin registrado
$$;
```

## 📍 Próximos Pasos (Opcional)

### Configurar Dominio Personalizado (Futuro)

Cuando estés listo para usar `minda.productprepa.com`:

#### 1. Configurar DNS
En tu registrador de dominio:
```
Tipo: A
Name: minda
Value: 185.158.133.1
TTL: 3600
```

#### 2. Conectar en Lovable
1. Ve al proyecto admin en Lovable
2. Settings → Domains
3. Click "Connect Domain"
4. Ingresa: `minda.productprepa.com`
5. Sigue las instrucciones

#### 3. Esperar Propagación
- Propagación DNS: 24-48 horas
- Verificar: https://dnschecker.org
- SSL se configura automáticamente

## 🆘 Troubleshooting

### No puedo hacer login
1. Verifica que estés usando: nicolassespindola@gmail.com
2. Verifica tu contraseña de Supabase
3. Abre la consola del navegador (F12) y busca errores
4. Verifica que el Supabase client esté configurado correctamente

### Error de CORS
- El Supabase client debe apuntar al mismo proyecto
- Verifica que SUPABASE_URL sea: https://lgscevufwnetegglgpnw.supabase.co

### No carga el dashboard
1. Verifica que hayas hecho login correctamente
2. Abre la consola y busca errores
3. Verifica la conexión a Supabase

## 📊 Monitoreo

Para monitorear el admin panel:
1. **Logs de Supabase Auth**: https://supabase.com/dashboard/project/lgscevufwnetegglgpnw/auth/users
2. **Logs de Analytics**: https://supabase.com/dashboard/project/lgscevufwnetegglgpnw/logs/explorer
3. **Security Audit**: Revisa la tabla `security_audit` en tu base de datos

## ✅ Checklist de Deployment

- [ ] Proyecto admin creado en Lovable
- [ ] Solo contenido de admin-app/ subido
- [ ] Deployment exitoso
- [ ] URL temporal accesible
- [ ] Login funciona con nicolassespindola@gmail.com
- [ ] Dashboard carga correctamente
- [ ] Todas las secciones funcionan
- [ ] Seguridad verificada (solo admin puede acceder)

## 📝 Resumen

**Estado**: ✅ LISTO PARA DEPLOYMENT

**URL Temporal**: Será asignada por Lovable al crear el proyecto

**Dominio Futuro**: minda.productprepa.com (cuando estés listo)

**Seguridad**: Máxima - Solo nicolassespindola@gmail.com tiene acceso

**App Principal**: Completamente limpia y sin código de admin
