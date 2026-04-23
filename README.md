# ProductPrepa

Plataforma de crecimiento profesional para Product Builders. Permite evaluarse en dominios clave, identificar áreas de mejora, acceder a mentoría personalizada, cursos, recursos descargables y un Career Path estructurado.

**URL de producción:** https://productprepa.com

-----

## 🏗️ Estructura del proyecto

```
src/
├── pages/                  # Páginas (usuario y admin)
│   └── admin/              # Panel de administración (15 páginas)
├── components/
│   ├── admin/              # Componentes del panel admin
│   ├── auth/               # Guards (ProtectedRoute, AdminProtectedRoute)
│   ├── courses/            # Visor de cursos y lecciones
│   ├── layout/             # AppLayout, AppSidebar, LandingHeader, MobileNav
│   ├── landing/            # Componentes de la landing page
│   ├── mentoria/           # Componentes de la sección de mentoría
│   ├── planes/             # Componentes de la página de pricing
│   ├── sections/           # Secciones compartidas de la landing
│   ├── skeletons/          # Skeletons de carga (Assessment, Mentoria, Progress)
│   └── ui/                 # shadcn/ui (~40 componentes)
├── contexts/               # AuthContext (estado global de auth)
├── hooks/                  # ~35 custom hooks
├── integrations/
│   ├── supabase/           # Cliente + tipos de la base de datos
│   └── todoist/            # API de creación de tareas
├── seo/                    # Configuración centralizada de SEO por ruta
├── constants/              # navigation.ts, plans.ts
├── lib/                    # Wrapper de Mixpanel
├── types/                  # Definiciones TypeScript
└── utils/                  # scoring.ts, features.ts, storage.ts, csvExport.ts

supabase/
├── config.toml             # Configuración del proyecto Supabase
├── functions/              # 11 Edge Functions (Deno)
└── migrations/             # 80+ migraciones SQL
```

-----

## 🚀 Funcionalidades

### Páginas públicas

| Ruta | Descripción |
|---|---|
| `/` | Landing page |
| `/auth` | Login / Registro (email + Google OAuth) |
| `/planes` | Página de planes y pricing |
| `/cursos-info` | Información de cursos (para usuarios no autenticados) |
| `/preguntas` | Recursos descargables |
| `/soy-dev` | Landing para Developers |
| `/blog` | Lista de artículos del blog |
| `/blog/:slug` | Artículo individual del blog |
| `/welcome` | Página post-compra |

### Páginas autenticadas

| Ruta | Acceso | Descripción |
|---|---|---|
| `/autoevaluacion` | Auth | Evaluación en 11 dominios obligatorios + 2 opcionales |
| `/mejoras` | Auth | Áreas de mejora identificadas a partir de la evaluación |
| `/mentoria` | Auth + Premium | Mentoría personalizada 1:1 |
| `/progreso` | Auth + Premium | Career Path con canvas y checklist |
| `/cursos` | Auth | Biblioteca de cursos |
| `/cursos/:slug` | Auth + Plan cursos | Detalle del curso (video player) |
| `/perfil` | Auth | Perfil del usuario, estadísticas y configuración |

### Panel de administración (`/admin/*`)

Validación server-side via `is_admin_jwt()` RPC. Todos los accesos se registran en `security_audit`.

- **Dashboard** - Métricas y analytics generales
- **Usuarios** - Gestión de usuarios registrados
- **Suscripciones** - Gestión de suscripciones activas
- **Evaluaciones** - Visor de evaluaciones de usuarios
- **Mentoría** - Gestión de mentorías y detalle por usuario
- **Ejercicios** - Asignación y feedback de ejercicios prácticos
- **Cursos** - CRUD de cursos y lecciones
- **Recursos** - CRUD de recursos educativos
- **Starter Pack** - Gestión de contenido del Starter Pack
- **Descargables** - Gestión de recursos descargables
- **Blog** - Creación, edición, publicación y eliminación de posts
- **Configuración** - Settings del sistema

-----

## 📝 Autoevaluación

Sistema de evaluación en **11 dominios obligatorios** y **2 opcionales**:

**Obligatorios:**
1. Estrategia de producto
2. Roadmap y priorización
3. Ejecución y entregas
4. Discovery de usuarios
5. Analítica y métricas
6. UX e investigación
7. Gestión de stakeholders
8. Comunicación y alineación
9. Liderazgo
10. Conocimiento técnico
11. Monetización y negocio

**Opcionales:** Growth, IA aplicada a Producto

Cada dominio se puntúa 1-5. Los resultados calculan un **nivel de seniority**: Junior, Mid, Senior, Lead o Head.

-----

## 💳 Planes y pagos

Integración con **LemonSqueezy** para procesamiento de pagos. Los precios se obtienen dinámicamente via la edge function `pricing-config` (con cache de 5 minutos), con valores fallback en ARS.

| Plan | Tipo | Acceso |
|---|---|---|
| **Gratuito** | Free | Autoevaluación + Áreas de mejora + recursos introductorios |
| **Premium** | Suscripción mensual | Free + 1 sesión mensual 1:1 con mentor + Career Path + recursos curados + Starter Pack |
| **RePremium** | Suscripción mensual | Premium + 2 sesiones mensuales + acceso completo a cursos + feedback de ejercicios + canal directo |
| **Curso Estrategia** | Pago único | Acceso al curso de Estrategia (lifetime) |
| **Cursos All** | Pago único | Acceso a todos los cursos (lifetime) |

Checkout soporta **compra anónima** (solo email). El webhook vincula la compra a una cuenta existente o crea una nueva.

-----

## 🧩 Funcionalidades premium

### /mentoria
- Agendar sesión de mentoría 1:1 con NicoProducto
- Recomendaciones personalizadas post-sesión
- Recursos especializados asignados
- Ejercicios prácticos con feedback
- Contenido bloqueado hasta completar mentoría (desbloqueo desde admin)

### /progreso (Career Path)
- Canvas interactivo con items arrastrables (drag & drop con @dnd-kit)
- Cada item tiene checklist; al completar todos los elementos pasa a estado "completed"
- Barra de progreso superior refleja el avance total
- El canvas se puede guardar para fijar el plan de trabajo
- Exportación a PDF

### /cursos
- Biblioteca de cursos con visor de video
- Progreso por lección trackeable
- Notas por lección
- Ejercicios por curso
- Publicación programada de cursos (edge function `publish-scheduled-courses`)

### Starter Pack (`/starterpack`)
- Recursos estructurados para PMs en dos tracks: Construir Productos y Liderar Equipos
- Contenido administrable desde el panel admin

### Blog (`/blog`)
- CMS completo administrado desde `/admin/blog`
- Posts en Markdown renderizados con `react-markdown`
- Slug auto-generado desde el título
- Soporte para thumbnails, meta title, meta description y keywords por post
- JSON-LD (BlogPosting + BreadcrumbList) y OG tags por post

-----


## 🔍 SEO

Sistema centralizado y route-aware:

- **`Seo.tsx`** - Componente React que inyecta dinámicamente meta tags en `<head>` (title, description, canonical, OG, Twitter Cards, JSON-LD)
- **`seo/routes.ts`** - Configuración centralizada de SEO por ruta pública (keywords, descriptions, schemas)
- **JSON-LD schemas:** WebSite, Organization, Blog, BlogPosting, LearningResource, WebPage, BreadcrumbList, FAQPage, Offer
- **Sitemap dinámico** - Edge function que genera XML con rutas estáticas + cursos publicados + blog posts (cache 1 hora)
- **`robots.txt`** - Permite todos los bots, apunta al sitemap
- **`index.html`** - OG/Twitter tags pre-populados + `<noscript>` con links para crawlers

-----

## 📦 Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 (SWC) |
| Estilos | Tailwind CSS 3 + @tailwindcss/typography |
| UI | shadcn/ui (Radix UI) |
| Routing | React Router DOM v6 |
| Data Fetching | TanStack React Query v5 (2min stale, 10min cache) |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Realtime + Auth + Storage + Edge Functions) |
| Edge Functions | Deno (11 funciones) |
| Pagos | LemonSqueezy |
| Analytics | Mixpanel |
| Drag & Drop | @dnd-kit |
| Markdown | react-markdown |
| Fechas | date-fns (locale español) |
| Iconos | Lucide React |
| Toasts | Sonner |
