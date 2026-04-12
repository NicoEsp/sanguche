

# Plan: Content Delivery con Supabase Storage + Signed URLs

## Principio clave

**No se toca nada de lo existente.** Los cursos que ya tienen videos en YouTube (como Product Management 101) siguen funcionando exactamente como hoy con iframes. El nuevo sistema de Supabase Storage solo aplica para cursos nuevos como Estrategia de Producto.

---

## Arquitectura

```text
VideoPlayer recibe lesson →
  ├── video_url es URL externa (youtube/vimeo/loom) → iframe (código actual, sin cambios)
  └── video_url es path interno (ej: "estrategia-producto/01-intro.mp4") → 
        → llama Edge Function get-course-video
        → recibe signed URL (4h TTL)
        → renderiza <video> nativo
```

La distinción se hace con una nueva columna `video_type` en `course_lessons`. Todas las lecciones existentes quedan como `'external'` (default), sin migración de datos.

---

## Implementación

### 1. Migración SQL
- Agregar columna `video_type` (`text`, default `'external'`) a `course_lessons` con valores posibles: `'external'` | `'storage'`
- Crear bucket privado `course-videos` (sin RLS público, solo service_role escribe)

### 2. Edge Function `get-course-video`
- Recibe `lesson_id`
- Valida JWT + acceso al curso (`has_course_access` o lógica equivalente)
- Si `video_type = 'storage'`: genera signed URL de 4h con `createSignedUrl`
- Si `video_type = 'external'`: retorna la URL tal cual (fallback de seguridad)
- Cursos gratuitos (`is_free = true`): cualquier usuario autenticado accede
- Retorna `{ url, type, expires_at }`

### 3. Edge Function `upload-course-video` (admin)
- Valida que el caller sea admin
- Recibe archivo via multipart
- Sube a `course-videos/{course-slug}/{filename}`
- Retorna el storage path

### 4. Hook `useVideoUrl`
- Si `videoType === 'external'`: retorna URL directa (sin llamada a Edge Function)
- Si `videoType === 'storage'`: llama a `get-course-video`, cachea resultado, renueva 30 min antes de expirar
- Maneja estados: loading, error, retry

### 5. VideoPlayer (modificación)
- Si `video_type === 'external'` (o undefined): **comportamiento actual idéntico** — iframe con `getEmbedUrl()`
- Si `video_type === 'storage'`: `<video>` nativo con signed URL, controles nativos del browser
- Si el `<video>` da error 403/404: solicita nueva signed URL automáticamente

### 6. Admin: AdminCourseDetail
- Toggle en formulario de lección: "URL externa" (default) vs "Subir video"
- Upload: input file + progress bar → `upload-course-video`
- URL externa: input text como hoy (sin cambios)

### 7. Tipos TypeScript
- Agregar `video_type?: 'external' | 'storage'` a `CourseLesson` en `src/types/courses.ts`

---

## Archivos a crear/modificar

| Archivo | Acción |
|---------|--------|
| `supabase/migrations/xxx.sql` | Columna `video_type` + bucket |
| `supabase/functions/get-course-video/index.ts` | Crear |
| `supabase/functions/upload-course-video/index.ts` | Crear |
| `src/hooks/useVideoUrl.ts` | Crear |
| `src/components/courses/VideoPlayer.tsx` | Modificar (dual render) |
| `src/pages/admin/AdminCourseDetail.tsx` | Modificar (upload UI) |
| `src/types/courses.ts` | Agregar `video_type` |

---

## Qué NO se toca
- Lecciones existentes con YouTube/Vimeo/Loom — cero cambios
- Curso Product Management 101 — sigue con iframes de YouTube
- Lógica actual de `getEmbedUrl()` — se preserva intacta
- No se migra ningún video existente a Storage

