# Plan: Mejorar credibilidad de landing y planes

Tres líneas de trabajo basadas en el feedback recibido.

---

## 1. Agregar social proof con números reales en la landing

El componente `SocialProofStrip` ya existe con métricas dinámicas (usuarios registrados, evaluaciones completadas, horas de mentoría, recursos), pero no se usa en ningún lado.

**Cambio:** Importar `SocialProofStrip` en `Index.tsx` y colocarlo entre el hero y la sección "Cómo funciona" (`HowItWorks`). Mantiene el estilo minimalista actual (es una franja sutil con iconos y números, sin cards ni colores fuertes).

**Archivo:** `src/pages/Index.tsx`

---

## 2. Capturas del backoffice para demostrar profesionalismo

Agregar una sección en la landing (después de `WhyProductPrepa`, antes del upgrade teaser) que muestre 2-3 capturas de la plataforma: autoevaluación, career path, mentoría. Estilo limpio con imágenes en contenedores con borde sutil y sombra, sin romper el minimalismo.

**Enfoque:** Crear un componente `PlatformPreview` que muestre las capturas en un grid o carrusel horizontal simple. Las imágenes se subirían como assets estáticos en `/public/screenshots/`.

**Archivos:**

- `src/components/landing/PlatformPreview.tsx` (nuevo)
- `src/pages/Index.tsx` (importar y colocar)
- Assets: tomar screenshots de la app en producción de la ruta /admin  y usarlas sin mostrar números de internos de ProductPrepa

---

## 3. Corregir uso de mayúsculas (patrón IA en español)

Revisar y corregir textos que usen Title Case incorrecto en español. En español, solo se capitalizan nombres propios y la primera palabra de un título. Ejemplos encontrados:

**Landing (`Index.tsx`):**

- "Empezá gratis. Crecé a tu ritmo." - Correcto
- "Product Builder" - Correcto (nombre propio del producto)

**Planes (`Planes.tsx`):**

- "Planes de Suscripción" → "Planes de suscripción"
- "Comparativa de Planes" → "Comparativa de planes"
- "Plan Gratuito", "Plan Premium", "Plan RePremium" - Correcto (nombres propios de producto)

**Componentes:**

- `HowItWorks.tsx` - Correcto (verbos simples)
- `WhyProductPrepa.tsx` - Correcto
- `SocialProofBlock.tsx` - Correcto

**Tabla comparativa en Planes:**

- "Características" como header - Correcto
- Labels de secciones ("Sin compromiso", "Recursos", "Mentoría", "Cursos", "Precio") - Correcto como categorías

Haré un barrido completo de todos los textos visibles al usuario para corregir mayúsculas tipo Title Case que no correspondan.

**Archivos:** `src/pages/Planes.tsx`, y otros archivos con copy visible que tenga este patrón.

---

## Resumen de archivos a tocar


| Archivo                                      | Cambio                                         |
| -------------------------------------------- | ---------------------------------------------- |
| `src/pages/Index.tsx`                        | Agregar `SocialProofStrip` + `PlatformPreview` |
| `src/components/landing/PlatformPreview.tsx` | Nuevo componente con capturas                  |
| `src/pages/Planes.tsx`                       | Corregir mayúsculas                            |
| Varios archivos con copy                     | Barrido de Title Case incorrecto               |


## Pregunta abierta

Para las capturas del backoffice: puedo tomar screenshots de la app en el preview y usarlas como imágenes estáticas en la landing. Otra opción es que me pases capturas específicas que quieras mostrar. La primera opción la puedo resolver solo.