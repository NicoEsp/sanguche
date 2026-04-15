

# Plan: Corregir badges, testimonios y tag "Nuevo"

## Datos reales de la base de datos

| Plan | Total activos | Bonificados |
|------|--------------|-------------|
| Premium | 17 | 7 |
| RePremium | 5 | 0 |

## Cambios

### 1. Actualizar badges en Planes.tsx con números reales

- Premium: cambiar `"+35 usuarios activos"` → `"+17 usuarios activos"`
- RePremium: cambiar `"Nuevo"` → `"+5 usuarios activos"`

**Archivo:** `src/pages/Planes.tsx` (líneas 431 y 434)

### 2. Agregar testimonios (SocialProofBlock) en la landing

`SocialProofBlock` ya existe y se usa en `/planes`, pero nunca se importó en `Index.tsx`. Se agrega después de `PlatformPreview`, antes del upgrade teaser.

**Archivo:** `src/pages/Index.tsx`

### 3. Eliminar badge "Nuevo" del título de Descargables

Quitar `<Badge className="bg-emerald-500/90 text-white">Nuevo</Badge>` del header de la página (línea 28). Los badges individuales en cada card se mantienen.

**Archivo:** `src/pages/Descargables.tsx`

