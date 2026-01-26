
## Plan: Actualizar capitalización de "Estrategia de Producto"

### Resumen

Actualizar todas las instancias de "estrategia de producto" a "Estrategia de Producto" en los archivos del sitio para mantener consistencia con el nombre oficial del curso.

---

### Archivos a modificar

#### 1. `src/pages/CursosInfo.tsx`

**Línea 89** - Keywords del SEO:
```
De: keywords="cursos estrategia de producto, ..."
A:  keywords="cursos Estrategia de Producto, ..."
```

*Nota: Los JSON-LD ya están correctamente capitalizados en las líneas 31, 37 y 38.*

---

#### 2. `src/pages/Planes.tsx`

**Línea 372** - Feature del plan:
```
De: "Fundamentos de estrategia de producto"
A:  "Fundamentos de Estrategia de Producto"
```

---

#### 3. `src/components/courses/CoursePaywall.tsx`

**Línea 73** - Texto informativo:
```
De: "Los cursos están incluidos en los planes RePremium y Curso de Estrategia"
A:  "Los cursos están incluidos en los planes RePremium y Curso de Estrategia de Producto"
```

---

### Archivos NO modificados (uso contextual diferente)

Los siguientes archivos usan "estrategia de producto" en contexto genérico (no como nombre del curso), por lo que **no deben modificarse**:

- **`src/utils/scoring.ts`**: Usa "estrategia de producto" como competencia/habilidad genérica en el assessment, no como nombre del curso
- **`src/utils/recommendedObjectives.ts`**: Ídem, describe la habilidad de estrategia en general

---

### Resumen de cambios

| Archivo | Línea | Cambio |
|---------|-------|--------|
| CursosInfo.tsx | 89 | Keywords SEO |
| Planes.tsx | 372 | Feature del plan curso |
| CoursePaywall.tsx | 73 | Texto informativo |

