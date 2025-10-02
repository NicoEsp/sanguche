# 🔑 Acceso al Panel de Administración

## URL Temporal Actual

El panel de administración está disponible en el subdominio temporal de Lovable:

```
https://[tu-project-id].lovable.app
```

## Credenciales de Acceso

- **Email**: nicolassespindola@gmail.com
- **Contraseña**: [tu contraseña de Supabase]

## Cómo Acceder

1. Abre la URL temporal en tu navegador
2. Ingresa el email: nicolassespindola@gmail.com
3. Ingresa tu contraseña de Supabase
4. Haz clic en "Iniciar Sesión"

## Seguridad

✅ Solo el email `nicolassespindola@gmail.com` tiene acceso
✅ Validación hardcoded en múltiples capas
✅ Imposible bypassear desde el código cliente
✅ Todos los intentos de acceso no autorizados se bloquean y registran

## Funcionalidades Disponibles

- 📊 Dashboard con analytics
- 👥 Gestión de usuarios
- 📝 Gestión de evaluaciones
- 💡 Gestión de recomendaciones
- 📚 Gestión de recursos
- ⚙️ Configuración del sistema

## Dominio Personalizado (Futuro)

Cuando estés listo para configurar el dominio personalizado `minda.productprepa.com`:

### Paso 1: Configurar DNS
1. Ve a tu registrador de dominio
2. Agrega un registro A:
   - Tipo: `A`
   - Name: `minda`
   - Value: `185.158.133.1`
   - TTL: `3600`

### Paso 2: Conectar en Lovable
1. Ve a tu proyecto de Lovable del admin
2. Click en Settings → Domains
3. Click en "Connect Domain"
4. Ingresa: `minda.productprepa.com`
5. Sigue las instrucciones de verificación

### Paso 3: Esperar Propagación
- La propagación DNS puede tomar 24-48 horas
- Puedes verificar el estado en: https://dnschecker.org
- Lovable proveerá SSL automáticamente cuando el dominio esté verificado

## Soporte

Si tienes problemas para acceder:
1. Verifica que estés usando el email correcto: nicolassespindola@gmail.com
2. Verifica tu contraseña de Supabase
3. Revisa los logs del navegador (F12 → Console)
4. Revisa los logs de Supabase Auth

## Diferencias con la App Principal

- **URL Diferente**: El admin está en un subdominio separado
- **Código Separado**: Completamente independiente del código de productprepa.com
- **Sin Impacto**: Los cambios en el admin no afectan la app principal
- **Mismo Backend**: Ambas apps usan el mismo Supabase para datos
