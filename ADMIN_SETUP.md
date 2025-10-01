# 🔐 Asignación de Roles Admin - Máxima Seguridad

## ✅ Sistema JWT-Based Admin (Sin endpoints expuestos)

Este proyecto utiliza JWT metadata para roles de administrador, garantizando máxima seguridad:

- ✅ **Cero endpoints expuestos** para asignación de admin
- ✅ **JWT firmado criptográficamente** por Supabase (imposible de forjar)
- ✅ **Solo asignable desde Supabase Dashboard** via SQL Editor
- ✅ **Audit log automático** de todas las asignaciones

---

## 📋 Cómo Asignar Rol Admin

### Opción 1: Usando la función SQL helper (Recomendado)

1. Ir a **Supabase Dashboard** → **SQL Editor**
2. Ejecutar la siguiente query reemplazando el email:

```sql
SELECT public.set_admin_role('usuario@empresa.com');
```

3. El rol admin será asignado automáticamente en el JWT metadata
4. El usuario necesitará cerrar sesión y volver a iniciar para que el JWT se actualice

### Opción 2: Manual via SQL directo

```sql
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{role}',
  '"admin"'::jsonb
)
WHERE email = 'usuario@empresa.com';
```

---

## 🔓 Cómo Remover Rol Admin

```sql
SELECT public.remove_admin_role('usuario@empresa.com');
```

O manualmente:

```sql
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data - 'role'
WHERE email = 'usuario@empresa.com';
```

---

## 🔍 Verificar Usuarios Admin

```sql
SELECT 
  id,
  email,
  raw_user_meta_data->>'role' as role
FROM auth.users
WHERE raw_user_meta_data->>'role' = 'admin';
```

---

## 🛡️ Seguridad del Sistema

### ¿Por qué es seguro?

1. **JWT firmado por Supabase**: Solo Supabase puede firmar JWTs válidos
2. **Sin manipulación client-side**: El JWT es inmutable en el cliente
3. **Sin endpoints expuestos**: No existe ninguna API para asignar roles
   - ⚠️ **CRÍTICO**: Endpoint `/rpc/is_admin` devuelve 404 (función eliminada)
   - ⚠️ **CRÍTICO**: Función `is_admin(uuid)` eliminada de la base de datos
4. **Audit trail**: Todas las asignaciones quedan registradas en `security_audit`
5. **Migración automática**: Los roles existentes en `user_roles` fueron migrados automáticamente
6. **Validación JWT pura**: Todas las RLS policies usan `is_admin_jwt()` que lee del JWT metadata

### ¿Qué pasó con los endpoints anteriores?

- ✅ `validate-admin-session` Edge Function → **ELIMINADO**
- ✅ `useServerAdminValidation` hook → **ELIMINADO**
- ✅ `useAdminAuth` hook → **ELIMINADO**
- ✅ Validación server-side cada 90 segundos → **ELIMINADO**
- ✅ Función `is_admin(uuid)` → **ELIMINADA** (endpoint RPC roto)
- ✅ Tabla `user_roles` → **VACÍA Y DEPRECADA** (roles en JWT metadata)
- ✅ Todas las RLS policies → **MIGRADAS A JWT** (usan `is_admin_jwt()`)

Ahora la validación es instantánea y sin requests adicionales al servidor.

---

## 📊 Audit Log

Todas las asignaciones de admin quedan registradas en la tabla `security_audit`:

```sql
SELECT 
  user_id,
  action,
  created_at,
  ip_address,
  user_agent
FROM public.security_audit
WHERE action IN ('admin_role_assigned_via_jwt', 'admin_role_removed_via_jwt')
ORDER BY created_at DESC;
```

---

## ⚠️ IMPORTANTE: Actualización de JWT

Después de asignar o remover el rol admin, el usuario debe:

1. **Cerrar sesión** en la aplicación
2. **Iniciar sesión nuevamente** para obtener el nuevo JWT

El JWT se actualiza automáticamente solo cuando:
- El usuario inicia sesión
- El JWT expira y se refresca automáticamente (cada 60 minutos)

---

## 🧪 Testing

Para verificar que el sistema funciona correctamente:

1. Asignar rol admin a un usuario de prueba
2. Hacer que ese usuario cierre e inicie sesión
3. Verificar que puede acceder a `/admin`
4. Intentar acceder desde un usuario free → Debería ver "Acceso Denegado"

---

## 🔒 ¿Puedo hacer bypass con DevTools?

**NO**. Aunque intentes modificar el estado en DevTools:

```javascript
// ❌ Esto NO funcionará
localStorage.setItem('isAdmin', 'true')
```

El JWT está firmado criptográficamente por Supabase. Incluso si modificas el estado local, todas las operaciones de base de datos verifican el JWT real, y las RLS policies rechazan el acceso.

### 🔍 Verificación del Endpoint Eliminado

Puedes verificar que el endpoint RPC está realmente eliminado:

```bash
# Este request debe devolver 404
curl https://lgscevufwnetegglgpnw.supabase.co/rest/v1/rpc/is_admin
```

**Respuesta esperada:** Error 404 - La función `is_admin` no existe

**Métodos que NO funcionan para hacer bypass:**
- ❌ Modificar `localStorage` manualmente
- ❌ Editar el JWT en DevTools (rompe la firma)
- ❌ Interceptar y modificar network requests
- ❌ Llamar a `/rpc/is_admin` (devuelve 404 - función eliminada)
- ❌ Manipular el código frontend (backend valida con `is_admin_jwt()`)
- ❌ Insertar en tabla `user_roles` (vacía, deprecada, y no se usa)

---

## 📚 Recursos Adicionales

- **Funciones SQL**: Ver `supabase/migrations/` para las funciones `set_admin_role` y `remove_admin_role`
- **Código Frontend**: Ver `src/contexts/AuthContext.tsx` para la lectura del JWT
- **RLS Policies**: Ver `user_roles` table para las políticas de seguridad
