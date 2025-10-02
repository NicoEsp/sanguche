# Guía de Acceso al Panel de Administración

## 🔐 Sistema de Seguridad

El panel de administración está **completamente integrado** en la aplicación principal de ProductPrepa con múltiples capas de seguridad:

### Capas de Seguridad Implementadas

1. **Validación Server-Side (RPC Function)**
   - Función `is_admin()` que valúa contra la tabla `user_roles`
   - **Inmune a manipulación de localStorage**
   - No puede ser bypaseada desde el cliente

2. **AdminProtectedRoute Component**
   - Verifica autenticación del usuario
   - Llama a `is_admin()` en el servidor
   - Registra intentos de acceso no autorizados en `security_audit`
   - Revalida permisos al cambiar de focus a la ventana

3. **Row Level Security (RLS)**
   - Políticas RLS en todas las tablas admin
   - Solo usuarios con role 'admin' en `user_roles` pueden acceder

4. **Tabla user_roles Separada**
   - Los roles NO están en perfiles (evita privilege escalation)
   - Schema: `user_roles(user_id, role)` donde role es enum 'admin' | 'moderator' | 'user'

---

## 📍 Acceso al Panel Admin

### URL de Acceso
El panel admin está disponible en:
```
https://productprepa.com/admin
```

### Credenciales de Acceso
```
Email: nicolassespindola@gmail.com
Password: [tu contraseña actual]
```

**IMPORTANTE**: Solo este email tiene acceso administrativo. Cualquier intento de acceso no autorizado es registrado en la tabla `security_audit`.

---

## 🚀 Primer Acceso - Configuración Inicial

Si es tu primera vez accediendo al panel admin, sigue estos pasos:

### 1. Verificar que tu usuario existe en la base de datos
```sql
SELECT id, user_id, name, email 
FROM profiles 
WHERE email = 'nicolassespindola@gmail.com';
```

### 2. Crear el primer admin (Bootstrap)
Usa esta función SQL **una sola vez** para crear el primer admin:

```sql
-- Obtén tu user_id de auth.users
SELECT id FROM auth.users WHERE email = 'nicolassespindola@gmail.com';

-- Ejecuta el bootstrap con tu user_id
SELECT bootstrap_first_admin('<tu-user-id-aqui>');
```

**NOTA**: Esta función solo funciona si NO hay admins existentes. Es un proceso de bootstrap de seguridad.

### 3. Verificar que tienes role admin
```sql
SELECT ur.*, p.name, p.email 
FROM user_roles ur
JOIN profiles p ON ur.user_id = p.id
WHERE p.email = 'nicolassespindola@gmail.com';
```

Deberías ver un registro con `role = 'admin'`.

---

## 🔧 Agregar Más Administradores

Una vez que tengas acceso admin, puedes agregar más administradores desde el panel:

### Opción 1: Desde el Panel Admin UI
1. Ve a `/admin/usuarios`
2. Busca el usuario que quieres hacer admin
3. Click en "Gestionar Roles"
4. Activa el toggle "Admin"

### Opción 2: Via SQL (Solo Admins)
```sql
-- Ejecutar como usuario admin autenticado
SELECT admin_toggle_user_role(
  '<profile-id-del-usuario>',
  'admin'::app_role
);
```

---

## 📊 Rutas del Panel Admin

Una vez autenticado como admin, tendrás acceso a:

| Ruta | Descripción |
|------|-------------|
| `/admin` | Dashboard con analytics generales |
| `/admin/usuarios` | Gestión de usuarios y suscripciones |
| `/admin/evaluaciones` | Revisión de evaluaciones realizadas |
| `/admin/mentoria` | Gestión de recomendaciones personalizadas |
| `/admin/recursos` | Administración de recursos de aprendizaje |
| `/admin/configuracion` | Configuración del sistema |

---

## 🛡️ Seguridad: Qué NO Puede Hacer un Atacante

### ❌ Manipular localStorage
```javascript
// Esto NO funciona:
localStorage.setItem('isAdmin', 'true');
```
El sistema ignora localStorage y valida contra el servidor.

### ❌ Modificar el Token JWT
El token se valida server-side. Modificar el token invalida la sesión.

### ❌ Inyectar SQL en user_roles
La tabla tiene RLS habilitado. Solo funciones SECURITY DEFINER pueden escribir roles.

### ❌ Bypasear AdminProtectedRoute
Aunque modifiquen el componente en el navegador, todas las peticiones al backend son validadas.

---

## 🔍 Monitoreo de Seguridad

Todos los intentos de acceso admin son registrados:

### Ver Intentos de Acceso No Autorizados
```sql
SELECT 
  sa.created_at,
  sa.action,
  sa.user_id,
  p.email,
  sa.ip_address,
  sa.user_agent
FROM security_audit sa
LEFT JOIN profiles p ON sa.user_id = p.id
WHERE sa.action LIKE '%admin%'
  AND sa.action != 'admin_validated'
ORDER BY sa.created_at DESC
LIMIT 50;
```

### Ver Acciones de Admin
```sql
SELECT 
  aal.created_at,
  admin.name as admin_name,
  target.name as target_user_name,
  aal.action_type,
  aal.details
FROM admin_actions_log aal
JOIN profiles admin ON aal.admin_user_id = admin.id
LEFT JOIN profiles target ON aal.target_user_id = target.id
ORDER BY aal.created_at DESC
LIMIT 100;
```

---

## 🆘 Troubleshooting

### "No tienes permisos para acceder"
1. Verifica que estás usando el email correcto: `nicolassespindola@gmail.com`
2. Comprueba que tienes role admin en la DB:
   ```sql
   SELECT * FROM user_roles 
   WHERE user_id = (SELECT id FROM profiles WHERE email = 'nicolassespindola@gmail.com');
   ```
3. Si no aparece, ejecuta `bootstrap_first_admin()` con tu user_id

### "La página se queda cargando"
1. Abre la consola del navegador (F12)
2. Busca errores relacionados con `is_admin()`
3. Verifica tu conexión a Supabase
4. Revisa los logs de Supabase Edge Functions

### "Session expired" o "Token invalid"
1. Cierra sesión completamente
2. Limpia las cookies y localStorage
3. Vuelve a iniciar sesión

---

## 📞 Soporte

Si tienes problemas con el acceso admin:

1. **Revisa los logs de seguridad** en Supabase Dashboard
2. **Verifica la tabla user_roles** con las queries SQL de arriba
3. **Comprueba los console logs** del navegador para ver errores específicos
4. **Revisa la función `is_admin()`** en el SQL Editor de Supabase

---

## ✅ Checklist de Verificación

Antes de reportar un problema, verifica:

- [ ] Estás usando el email correcto: nicolassespindola@gmail.com
- [ ] Tu usuario existe en la tabla `profiles`
- [ ] Tienes un registro en `user_roles` con role='admin'
- [ ] La función `is_admin()` existe en Supabase
- [ ] Las políticas RLS están activas en las tablas admin
- [ ] No hay errores en la consola del navegador
- [ ] Estás accediendo a `/admin` (no `/admin-app` o similar)

---

**Última actualización**: 2025-10-02  
**Versión del sistema**: Unified Admin Panel v1.0
