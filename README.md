# Sanguche / ProductPrepa

## Una aplicación para Product Managers que permite:
	•	Evaluarse en 11 dominios claves (Autoevaluación)
	•	Ver sus Áreas de mejora personalizadas
	•	Acceder a funcionalidades premium como Mentoría personalizada y Progreso
	•	Hacer seguimiento del avance en sus objetivos de carrera

Esta aplicación está construida con React + TypeScript + Tailwind, usando Supabase como backend (autenticación + base de datos) y Polar como procesador de pagos.

# 🏗️ Estructura del proyecto

├── public/                — Archivos estáticos (imágenes, favicon, etc.)

├── src/                   — Código fuente frontend (React)
│   ├── components/        — Componentes reutilizables (UI, inputs, cards, etc.)
│   ├── pages/             — Páginas de la aplicación (landing, mentoria, etc.)
│   ├── hooks/              — Hooks personalizados (uso de auth, fetch, etc.)
│   ├── services/           — Integraciones con backend / supabase / pagos
│   ├── styles/             — Estilos globales / configuraciones Tailwind
│   └── utils/              — Utilidades / helpers compartidos

├── supabase/               — Archivos o scripts relacionados a la configuración de Supabase
├── .env                    — Variables de entorno locales
├── tailwind.config.ts      — Configuración de Tailwind CSS
├── tsconfig.json           — Configuración de TypeScript
├── vite.config.ts          — Configuración del bundler (Vite)
└── README.md               — Este archivo

## Algunas notas más específicas:
	•	src/pages/index.tsx: página principal / landing de la app
	•	src/pages/mentoria: sección privada para usuarios Premium donde se muestran Recomendaciones, Recursos, Ejercicios y eventualmente Progreso
	•	src/services/supabase.ts: cliente de Supabase configurado para autenticación, operaciones en la base de datos
	•	src/services/pagos: funciones/integraciones para manejar pagos con Polar (creación de suscripciones, verificación de estado, webhooks)
	•	supabase/: contiene archivos relacionados con el esquema de base de datos, migrations o configuraciones de tablas (por ejemplo: usuarios, user_subscriptions, requests de ejercicio)

⸻

 # 🔐 Autenticación y manejo de usuarios
	•	Se usa Supabase Auth para registro/inicio de sesión con correo
	•	La confirmación por email redirige al usuario a la URL pública configurada
	•	La tabla user_subscriptions guarda el estado de suscripción del usuario

# 💳 Pagos con Polar
	•	Polar es el procesador de pagos: se encarga de la suscripción, renovación, etc.
	•	La aplicación tiene un endpoint webhook que reciba eventos de Polar (por ejemplo: subscription_created, payment_succeeded)
	•	Ese webhook valida el evento, identificar al usuario (por ID, correo u otra metadata), y hace un update en Supabase para reflejar el estado (por ejemplo, status = “active”, plan = “premium”)

⸻

# 🧩 Lógica de Mentoría / Recomendaciones / Recursos / Ejercicios
	•	La sección Mentoría en el frontend muestra:
	•	Recomendaciones
	•	Recursos
	•	Ejercicios
	•	(y en el futuro) Progreso
	•	Ejercicios: debe haber una versión minimalista antes de que el usuario comente su mail; cuando lo haga, se guarda en una tabla exercise_requests con su user_id, email, exercise_id, timestamp, etc.
	•	Recomendaciones / Recursos: si el usuario no asistió a su sesión de mentoría, los ítems deben mostrarse bloqueados (con un candado, en gris), sólo con título/“Conexión con tus fortalezas”, sin permitir interacción ni ver detalles.
	•	El admin puede desbloquear esos recursos/recomendaciones del usuario desde su panel, luego de la mentoría. Cuando estén desbloqueados, el usuario puede expandirlos (colapsable) y ver los objetivos, criterios de éxito, links, etc.

⸻

# Roadmap cercano
	•	Completar la funcionalidad de Progreso: visualizador del avance del usuario en su trayectoria profesional
	•	Mejorar la lógica de desbloqueo automático (o semi-automático) después de las sesiones de mentoría
	•	Refinar UX/UI de la sección de mentoría para que el usuario tenga claro qué esperar
	•	Añadir más ejercicios, plantillas descargables y recursos que se sientan personalizados
	•	Versionamiento de contenido para diferentes niveles (junior, medio, senior)
