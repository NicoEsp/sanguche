# ProductPrepa

Plataforma de crecimiento profesional para Product Builders. Permite evaluarse en dominios clave, identificar áreas de mejora, acceder a mentoría personalizada, cursos, recursos descargables y un Career Path estructurado.

**URL de producción:** https://productprepa.com
-----

## 🏗️ Estructura del proyecto

```text
src/
├── pages/                  # Páginas (usuario y admin)
│   └── admin/              # Panel de administración (14 páginas)
├── components/
│   ├── admin/              # Componentes del panel admin
│   ├── auth/               # Guards (ProtectedRoute, AdminProtectedRoute)
│   ├── courses/            # Visor de cursos y lecciones
│   ├── downloads/          # Componentes de recursos descargables
│   ├── fetita/             # Chat, memo y paneles de Fetita
│   ├── landing/            # Componentes de la landing page
│   ├── layout/             # AppLayout, AppSidebar, LandingHeader, MobileNav
│   ├── mentoria/           # Componentes de la sección de mentoría
│   ├── planes/             # Componentes de la página de pricing
│   ├── profile/            # Componentes del perfil de usuario
│   ├── progress/           # Componentes del Career Path
│   ├── resources/          # Componentes de recursos educativos
│   ├── sections/           # Secciones compartidas de la landing
│   ├── skeletons/          # Skeletons de carga (Assessment, Mentoria, Progress)
│   └── ui/                 # shadcn/ui (30 componentes)
├── contexts/               # AuthContext (estado global de auth)
├── hooks/                  # 31 custom hooks
├── integrations/
│   ├── supabase/           # Cliente + tipos de la base de datos
│   └── todoist/            # API de creación de tareas
├── seo/                    # Configuración centralizada de SEO por ruta
├── constants/              # navigation.ts, plans.ts
├── lib/                    # Wrapper de Mixpanel, version check, cliente de streaming de Fetita
├── types/                  # Definiciones TypeScript
└── utils/                  # scoring, features, storage, csvExport, dateHelpers, errorMessages, recommendedObjectives

supabase/
├── config.toml             # Configuración del proyecto Supabase
├── functions/              # 17 Edge Functions (Deno)
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
| `/preguntas` o `/descargables` | Recursos descargables |
| `/soy-dev` | Landing para Developers |
| `/sesion/:slug` | Reserva de sesiones (eventos) |
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
| `/fetita` | Auth + acceso beta | Fetita, el agente que desafía una decisión de producto por conversación y deja un memo con veredicto |
| `/cursos` | Auth | Biblioteca de cursos |
| `/cursos/:slug` | Auth + Plan cursos | Detalle del curso (video player) |
| `/perfil` | Auth | Perfil del usuario, estadísticas y configuración |

### Panel de administración (`/admin/*`)

Validación server-side via `is_admin_jwt()` RPC. Todos los accesos se registran en `security_audit`.

| Ruta | Descripción |
|---|---|
| `/admin` | Dashboard con métricas y analytics generales |
| `/admin/usuarios` | Gestión de usuarios registrados |
| `/admin/suscripciones` | Gestión de suscripciones activas |
| `/admin/evaluaciones` | Visor de evaluaciones de usuarios |
| `/admin/mentoria` | Listado de mentorías |
| `/admin/mentoria/:userId` | Detalle de mentoría por usuario (objetivos + ejercicios) |
| `/admin/ejercicios` | Asignación y feedback de ejercicios prácticos |
| `/admin/cursos` | CRUD de cursos |
| `/admin/cursos/:courseId` | Detalle del curso (lecciones + ejercicios) |
| `/admin/descargables` | Gestión de recursos descargables |
| `/admin/blog` | CMS: creación, edición y publicación de posts |
| `/admin/sesiones` | Gestión de eventos / sesiones |
| `/admin/fetita` | Fetita: consumo de la API y calidad (tasa de alucinación), accesos de la beta y revisión de conversaciones y memos |

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
| **Premium** | Suscripción mensual | Free + 1 sesión mensual 1:1 con mentor + Career Path + recursos curados |
| **RePremium** | Suscripción mensual | Premium + 2 sesiones mensuales + acceso completo a cursos + feedback de ejercicios + canal directo |
| **Curso Estrategia** | Pago único | Acceso al curso de Estrategia (lifetime) |
| **Cursos All** | Pago único | Acceso a todos los cursos (lifetime) |

Checkout soporta **compra anónima** (solo email). El webhook vincula la compra a una cuenta existente o crea una nueva.

**Pagos por fuera de LemonSqueezy** (B2B por transferencia, factura directa, bonificaciones): el cliente crea su cuenta en `/auth` y desde `/admin/usuarios` → **Upgrade** se le asigna el plan, el monto cobrado (opcional, en ARS) y notas internas. El RPC `admin_update_subscription` guarda todo en `user_subscriptions` y lo registra en `admin_actions_log`. La fila queda sin IDs de LemonSqueezy, aparece como **Manual** en `/admin/suscripciones` y el webhook nunca la toca.

-----

## 🧩 Funcionalidades premium

### /mentoria
- Agendar sesión de mentoría 1:1 con NicoProducto
- Recomendaciones personalizadas post-sesión
- Recursos especializados asignados
- Ejercicios prácticos con feedback
- Contenido bloqueado hasta completar mentoría (desbloqueo desde admin)

### /progreso (Career Path)
- Canvas interactivo con items arrastrables (drag & drop con `@dnd-kit`)
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

### Blog (`/blog`)
- CMS completo administrado desde `/admin/blog`
- Posts en Markdown renderizados con `react-markdown`
- Slug auto-generado desde el título
- Soporte para thumbnails, meta title, meta description y keywords por post
- Publicación programada (edge function `publish-scheduled-blog`)
- JSON-LD (BlogPosting + BreadcrumbList) y OG tags por post

-----

## 🤖 Fetita (beta cerrada)

**Fetita es el agente de ProductPrepa.** Conversa sobre una decisión de producto por conversación, la desafía con un protocolo de 7 pasos (decisión, problema, evidencia, refutación, exclusión, test, fin) y deja un memo con veredicto: listo, falta o frenar. Corre en la edge function `fetita-chat` contra la API de Claude, con respuestas por streaming. El material que la persona pega se lee aparte y no se guarda.

**Acceso y costo.** Se habilita por persona desde `/admin/fetita` (RPC `admin_set_fetita_access`, con log en `admin_actions_log`), con cupo mensual de mensajes, presupuesto mensual en USD e interruptor general (`admin_update_fetita_settings`). Cada request a la API queda en `fetita_runs` con tokens y costo.

**Calidad.** Un juez automático revisa cada memo contra la conversación (`fetita_memo_checks`), el admin revisa a mano (`admin_review_fetita_memo`) y la persona deja pulgar arriba o abajo con motivo (`fetita_feedback`). La puesta en marcha está en [`docs/fetita.md`](docs/fetita.md).

-----

## 🔌 Edge Functions

17 funciones Deno en `supabase/functions/`:

| Función | Propósito |
|---|---|
| `cancel-subscription` | Cancelar suscripción en LemonSqueezy |
| `delete-user` | Borrado seguro de usuario (admin) |
| `fetita-chat` | Turno de conversación con Fetita por streaming (SSE) contra la API de Claude |
| `fetita-evaluate` | Vuelve a correr el juez de alucinaciones sobre un memo (admin) |
| `get-admin-users` | Listado paginado de usuarios para el panel admin |
| `get-course-video` | Firma URL de video de curso (signed URL) |
| `get-resource-access` | Valida acceso a recursos descargables |
| `lemon-squeezy-checkout` | Crea sesión de checkout |
| `lemon-squeezy-webhook` | Recibe eventos de pagos / suscripciones |
| `pricing-config` | Devuelve precios actuales (con cache) |
| `publish-scheduled-blog` | Publica posts programados (cron) |
| `publish-scheduled-courses` | Publica cursos programados (cron) |
| `send-course-published-emails` | Email de aviso de curso nuevo |
| `send-discount-email` | Email de descuento |
| `send-exercise-emails` | Email de feedback de ejercicios |
| `send-welcome-email` | Onboarding post-registro |
| `sitemap` | Genera `sitemap.xml` dinámico |
| `upload-course-video` | Sube video de curso a storage |

-----

## 🔍 SEO

Sistema centralizado y route-aware:

- **`Seo.tsx`** - Componente React que inyecta dinámicamente meta tags en `<head>` (title, description, canonical, OG, Twitter Cards, JSON-LD)
- **`seo/routes.ts`** - Configuración centralizada de SEO por ruta pública (keywords, descriptions, schemas)
- **JSON-LD schemas:** WebSite, Organization, Blog, BlogPosting, LearningResource, WebPage, BreadcrumbList, FAQPage, Offer
- **Sitemap dinámico** - Edge function `sitemap` que genera XML con rutas estáticas + cursos publicados + blog posts (cache 1 hora)
- **`robots.txt`** - Permite todos los bots, apunta al sitemap
- **`index.html`** - OG/Twitter tags pre-populados + `<noscript>` con links para crawlers

-----

## 📦 Stack técnico

| Capa | Tecnología |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 5 (SWC) |
| Package manager | Bun |
| Estilos | Tailwind CSS 3 + @tailwindcss/typography |
| UI | shadcn/ui (Radix UI) |
| Routing | React Router DOM v6 |
| Data Fetching | TanStack React Query v5 (2min stale, 10min cache) |
| Forms | React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Realtime + Auth + Storage + Edge Functions) |
| Edge Functions | Deno (17 funciones) |
| IA | API de Claude con el SDK de Anthropic, desde edge functions (Fetita) |
| Pagos | LemonSqueezy |
| Analytics | Mixpanel + Vercel Analytics |
| Drag & Drop | @dnd-kit |
| Markdown | react-markdown |
| Fechas | date-fns (locale español) |
| Iconos | Lucide React |
| Toasts | Sonner |

-----

## 🧭 Convenciones y arquitectura

### Organización por feature
Los refactors recientes (ej. PR #69 sobre Career Path) consolidan archivos grandes siguiendo este patrón:

- **Componentes hijos enfocados** (single responsibility) extraídos del page
- **Custom hooks** para lógica de negocio reutilizable (`useCareerPathPdfExport`, etc.)
- **`shared.ts` por feature** con constantes, tipos y helpers consolidados
- **Page principal ≤ 350 líneas**, actúa como orquestador

Ejemplo: `src/components/progress/` contiene los componentes del Career Path + `shared.ts`.

### Seguridad
- Validación admin server-side con `is_admin_jwt()` RPC
- RLS policies en todas las tablas Supabase
- Logging en `security_audit` para acciones administrativas
- Borrado lógico (`is_active = false`) preferido sobre borrado físico

### Performance
- Code splitting con `React.lazy` por ruta
- TanStack Query con stale time agresivo (2min) + realtime para invalidación
- Skeletons cargados síncronamente para evitar flash de loading
