# ProductPrepa

Una plataforma para Product Managers que permite:
- Evaluarse en 11 dominios claves (Autoevaluación)
- Ver sus Áreas de mejora personalizadas
- Acceder a funcionalidades premium como Mentoría personalizada y Progreso
- Hacer seguimiento del avance en sus objetivos de carrera

## 🏗️ Estructura del proyecto

### User
src/pages/
├── Index.tsx              → Landing page (página de inicio pública)
├── Auth.tsx               → Autenticación (login/registro)
├── Assessment.tsx         → Autoevaluación en 11 dominios
├── SkillGaps.tsx          → Áreas de mejora personalizadas
├── Recommendations.tsx    → Mentoría personalizada (premium)
├── Progress.tsx           → Sistema de seguimiento de progreso (premium)
├── Premium.tsx            → Página de planes y checkout con Polar
├── Profile.tsx            → ✨ NUEVO: Mi Perfil (estadísticas y configuración)
└── NotFound.tsx           → Página 404

### Admin
src/pages/admin/
├── AdminDashboard.tsx           → Panel principal con métricas
├── AdminUsers.tsx               → Gestión de usuarios
├── AdminAssessments.tsx         → Ver evaluaciones de usuarios
├── AdminRecommendations.tsx     → Gestionar recomendaciones
├── AdminResources.tsx           → CRUD de recursos educativos
├── AdminMentoriaExercises.tsx   → CRUD de ejercicios prácticos
├── AdminMentoriaDetail.tsx      → Detalle de mentoría por usuario
├── AdminProgressObjectives.tsx  → Gestión de objetivos de progreso
└── AdminSettings.tsx            → Configuración del sistema

## 🔐 Autenticación

- Sistema de autenticación con Supabase Auth
- Registro e inicio de sesión con email
- La tabla `user_subscriptions` guarda el estado de suscripción del usuario

## 💳 Pagos

- Integración con Polar para procesamiento de pagos
- Webhooks para sincronización de suscripciones
- Gestión automática de estados de suscripción

## 🧩 Funcionalidades premium principales

### /mentoria
- Recomendaciones personalizadas
- Recursos especializados
- Ejercicios prácticos

### / progreso
- Sistema de progreso

### Sistema de bloqueo
- Contenido bloqueado hasta completar mentoría
- Desbloqueo desde panel de administración
- Acceso gradual a funcionalidades premium


## 📦 Tecnologías

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Backend as a Service)
- Polar (Pagos)
