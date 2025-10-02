# ProductPrepa Admin Panel

Panel de administración para ProductPrepa (minda.productprepa.com).

## Seguridad

Este panel tiene acceso restringido únicamente al administrador:
- **Usuario autorizado**: nicolassespindola@gmail.com
- Validación hardcoded en el código
- Aplicación completamente separada de la app principal

## Desarrollo

```bash
cd admin-app
npm install
npm run dev
```

El servidor de desarrollo corre en `http://localhost:5174`

## Build

```bash
npm run build
```

## Deploy

Esta aplicación debe desplegarse en el subdominio `minda.productprepa.com` separado de la aplicación principal.
