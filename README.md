# ProductPrepa

Una plataforma para Product Managers que permite:
- Evaluarse en 11 dominios claves (Autoevaluación)
- Ver sus Áreas de mejora personalizadas
- Acceder a funcionalidades premium como Mentoría personalizada y Progreso
- Hacer seguimiento del avance en sus objetivos de carrera

## 🏗️ Estructura del proyecto

```
├── public/                — Archivos estáticos (imágenes, favicon, etc.)
├── src/                   — Código fuente frontend (React)
│   ├── components/        — Componentes reutilizables (UI, inputs, cards, etc.)
│   ├── pages/             — Páginas de la aplicación (landing, mentoria, etc.)
│   ├── hooks/             — Hooks personalizados (uso de auth, fetch, etc.)
│   ├── contexts/          — Contextos de React (Auth, etc.)
│   ├── integrations/      — Integraciones con servicios externos
│   └── utils/             — Utilidades / helpers compartidos
├── supabase/              — Configuración y funciones de Supabase
├── tailwind.config.ts     — Configuración de Tailwind CSS
├── tsconfig.json          — Configuración de TypeScript
├── vite.config.ts         — Configuración del bundler (Vite)
└── README.md              — Este archivo
```

## 🔐 Autenticación

- Sistema de autenticación con Supabase Auth
- Registro e inicio de sesión con email
- La tabla `user_subscriptions` guarda el estado de suscripción del usuario

## 💳 Pagos

- Integración con Polar para procesamiento de pagos
- Webhooks para sincronización de suscripciones
- Gestión automática de estados de suscripción

## 🧩 Funcionalidades principales

### Mentoría
- Recomendaciones personalizadas
- Recursos especializados
- Ejercicios prácticos
- Sistema de progreso

### Sistema de bloqueo
- Contenido bloqueado hasta completar mentoría
- Desbloqueo desde panel de administración
- Acceso gradual a funcionalidades premium

## 🚀 Desarrollo

```bash
npm install
npm run dev
```

## 📦 Tecnologías

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Backend as a Service)
- Polar (Pagos)
