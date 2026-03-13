

## Plan: Fix tracking + Personalización en /planes

Dos tareas basadas en tu documento, adaptadas a la estructura real del código.

---

### Tarea 1 — Fix del bug de tracking `planes_page_viewed`

**Archivo:** `src/pages/Planes.tsx` (líneas 113-121)

Reemplazar el `useEffect` actual de tracking por dos efectos separados:

1. **Efecto inmediato** (sin dependencias async): dispara `planes_page_viewed` al montar con solo `is_authenticated`.
2. **Efecto enriquecido**: dispara `planes_page_enriched` solo cuando `pricingLoading` termina y el usuario está autenticado, con los flags de suscripción.

---

### Tarea 2 — Personalización con datos del assessment

**Archivos:** `src/pages/Planes.tsx`, `src/hooks/useAssessmentData.ts`

**Hallazgo del Paso 0 (verificación de estructura):**
- El hook expone `result` (no `assessmentResult`)
- Los gaps están en `result.gaps` con tipo `Gap`
- La propiedad de prioridad se llama `prioridad` (no `priority`), valores: `"Alta"` | `"Media"`
- El nombre del dominio está en `label` (no `name`)

**Implementación:**
1. Importar `useAssessmentData` en Planes.tsx
2. Extraer los top 2 gaps con `prioridad === "Alta"`
3. Insertar bloque visual condicional entre el `<Seo>` y el hero section
4. Agregar evento `planes_personalization_shown` cuando el bloque se renderiza

**Bloque visual:** Un banner destacado (bg-primary/10, borde primary) mostrando las 2 áreas críticas del usuario y conectándolas con la mentoría Premium.

---

### Resumen de cambios

| Archivo | Cambio |
|---|---|
| `src/pages/Planes.tsx` | Split tracking en 2 efectos, importar useAssessmentData, bloque personalizado, evento de tracking personalización |

No se modifican otros archivos. No se toca el flujo de checkout ni el efecto de abandono.

