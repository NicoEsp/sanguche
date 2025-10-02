# ProductPrepa Admin Panel

Panel de administración para ProductPrepa.

## 🔒 Seguridad

Este panel tiene acceso restringido únicamente al administrador:
- **Usuario autorizado**: nicolassespindola@gmail.com
- Validación hardcoded en múltiples capas (AuthContext, ProtectedRoute, funciones RLS)
- Aplicación completamente separada de la app principal
- Imposible acceder sin las credenciales correctas

## 🚀 Acceso Temporal

**URL Temporal de Lovable**: La aplicación está disponible en el subdominio temporal de Lovable:
```
https://[project-id].lovable.app
```

Para acceder:
1. Abre la URL temporal en tu navegador
2. Usa las credenciales:
   - Email: nicolassespindola@gmail.com
   - Contraseña: [tu contraseña de Supabase]

## 🎯 Acceso Futuro (Dominio Personalizado)

En el futuro, el panel estará disponible en:
```
https://minda.productprepa.com
```

**Configuración DNS requerida** (cuando estés listo):
1. Ve a tu registrador de dominio (donde compraste productprepa.com)
2. Agrega un registro A:
   - Tipo: A
   - Name: minda
   - Value: 185.158.133.1
   - TTL: 3600
3. En Lovable, ve a Settings → Domains y conecta minda.productprepa.com
4. Espera 24-48 horas para propagación DNS

## 💻 Desarrollo Local

### Desde la raíz del proyecto:
```bash
npm run admin:install  # Instalar dependencias (solo primera vez)
npm run admin:dev      # Desarrollo
npm run admin:build    # Build para producción
npm run admin:preview  # Preview del build
```

### Desde el directorio admin-app:
```bash
cd admin-app
npm install  # Solo primera vez
npm run dev
```

El servidor de desarrollo corre en `http://localhost:5174`

## 📦 Estructura

Esta es una aplicación React completamente independiente que:
- Usa Vite como bundler
- Tiene su propio package.json y dependencias
- Se conecta al mismo Supabase que la app principal
- Tiene su propia configuración de rutas y componentes

## 🛠️ Scripts Disponibles

- `npm run dev` - Servidor de desarrollo
- `npm run build` - Build para producción
- `npm run preview` - Preview del build
- `npm run lint` - Linter

## 📁 Rutas del Panel

- `/` - Dashboard principal
- `/usuarios` - Gestión de usuarios
- `/evaluaciones` - Gestión de evaluaciones
- `/recomendaciones` - Gestión de recomendaciones
- `/recursos` - Gestión de recursos
- `/configuracion` - Configuración del sistema
- `/login` - Página de login

## 🔐 Capas de Seguridad

1. **Frontend**: AuthContext valida el email hardcoded
2. **Rutas**: AdminProtectedRoute bloquea acceso no autorizado
3. **Database**: Funciones RLS verifican permisos de admin en cada query
4. **Logs**: Todos los intentos de acceso no autorizados se registran

## 📝 Notas

- La aplicación está completamente separada de productprepa.com
- No hay código del admin en la aplicación principal
- Los cambios en el admin no afectan la app principal
- Ambas apps usan el mismo Supabase backend
