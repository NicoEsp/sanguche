# ProductPrepa

Una plataforma para Product Managers que permite:
- Evaluarse en 11 dominios claves (Autoevaluación)
- Ver sus Áreas de mejora personalizadas
- Acceder a funcionalidades premium como Mentoría personalizada y Career Path
- Hacer seguimiento del avance en sus objetivos de carrera

-----

## 🏗️ Estructura del proyecto

### User
src/pages/
├── Index.tsx              → Landing page (página de inicio pública)
├── Auth.tsx               → Autenticación (login/registro)
├── Assessment.tsx         → ✨ NUEVO: Autoevaluación en 11 dominios basada en preguntas y ejemplos concretos
├── SkillGaps.tsx          → Áreas de mejora
├── Recommendations.tsx    → Mentoría personalizada (premium)
├── Progress.tsx           → Career Path - Sistema de seguimiento de objetivos (premium)
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

- Integración con LemonSqueezy para procesamiento de pagos (Se descarta Polar como procesador de pagos por problemas administrativos)
- Webhooks para sincronización de suscripciones
- Gestión automática de estados de suscripción

## 🧩 Funcionalidades premium principales

### /mentoria
Desde esta sección un usuario puede:
- Agendar sesión de Mentoria con NicoProducto
- Recibir recomendaciones personalizadas en base a sesión de Mentoria
- Recibir recursos especializados
- Ejercicios prácticos post sesión de Mentoria
- Contenido bloqueado hasta completar mentoría
- Desbloqueo desde panel de administración
- Acceso gradual a funcionalidades premium

### /progreso (Career Path)
Desde esta sección el usuario puede:
- Acceder a su Career Path estructurado en un Canvas y una lista de items arrastrable. Cada item tiene un checklist, al completar todos los elementos de la checklist el item pasa a estado 'completed' y eso se ve reflejado como avance en la sección superior
- ✨ NUEVO: Ahora el canvas puede guardarse para fijar el plan de trabajo y se puede exportar a PDF

-----

## 📦 Tecnologías

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase (Backend as a Service)
- LemonSqueezy (Pagos)
