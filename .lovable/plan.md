

## Plan: Fix 3 bugs en Perfil, pricing hardcodeado, y consistencia visual

### Bug 1 — Fecha desbordada en ProfileStats (mobile)

**Problema:** La card de "Última evaluación" muestra una fecha como "05/12/2025" en `text-3xl font-bold`, que desborda el contenedor en mobile.

**Archivo:** `src/components/profile/ProfileStats.tsx`

**Cambios:**
- Hacer el tamaño de texto del valor dinámico: si el valor es string (fecha), usar `text-xl` en vez de `text-3xl`
- Agregar `break-words` y `min-w-0` al contenedor
- Agregar padding horizontal (`px-3`) al CardContent para dar más respiración
- Opcionalmente truncar con `overflow-hidden text-ellipsis`

### Bug 2 — Precio hardcodeado "USD 9,99/mes"

**Problema:** En `src/pages/Profile.tsx` línea 127, `formatNextBillingDate()` tiene `USD 9,99/mes` hardcodeado para todos los planes.

**Archivo:** `src/pages/Profile.tsx`

**Cambios:**
- Importar `usePricing` hook
- En `formatNextBillingDate()`, usar el precio dinámico según `subscription?.plan`:
  - `premium` → `premium.formatted`
  - `repremium` → `repremium.formatted`
  - `curso_estrategia` → `curso_estrategia.formatted`
  - `cursos_all` → `cursos_all.formatted`
- Mostrar como `Próximo cobro: {date} - {precio}/mes` con el precio real en ARS (no USD)
- Verificación adicional: no hay otras ocurrencias de "9,99" en el código (ya confirmado, solo está en Profile.tsx)

### Bug 3 — Consistencia visual de páginas internas con la landing

**Problema:** Las páginas internas (SkillGaps, Descargables, Profile, Courses, etc.) usan headers más pequeños y layout más compacto que no se alinean con el estilo bold de la landing (`text-4xl sm:text-5xl font-extrabold tracking-tight`).

**Archivos afectados:** `SkillGaps.tsx`, `Descargables.tsx`, `Profile.tsx`, `Courses.tsx`, `Recommendations.tsx`, `Assessment.tsx`

**Cambios por página:**
1. **SkillGaps.tsx** — `h1` de `text-2xl sm:text-3xl font-semibold` → `text-3xl sm:text-4xl font-extrabold tracking-tight`
2. **Descargables.tsx** — `h1` de `text-3xl font-bold` → `text-3xl sm:text-4xl font-extrabold tracking-tight`, mejorar spacing `py-8` → `py-8 sm:py-12`
3. **Profile.tsx** — Secciones con `text-2xl font-bold` → `text-3xl sm:text-4xl font-extrabold tracking-tight` para "Estadísticas de Career Path"
4. **Courses.tsx** — Revisar headers y ajustar al mismo patrón
5. **Recommendations.tsx** — Revisar hero de mentoría

**Patrón unificado para h1 de página:**
```
text-3xl sm:text-4xl font-extrabold tracking-tight
```

**Patrón unificado para h2 de sección:**
```
text-2xl sm:text-3xl font-bold tracking-tight
```

**Spacing de contenedor consistente:**
```
container py-8 sm:py-12 px-4 sm:px-6
```

### Resumen

| Archivo | Cambio |
|---|---|
| `ProfileStats.tsx` | Texto dinámico según tipo de valor, mejor responsive |
| `Profile.tsx` | Precio dinámico con usePricing, headers más bold |
| `SkillGaps.tsx` | Headers y spacing alineados a landing |
| `Descargables.tsx` | Headers y spacing alineados a landing |
| `Courses.tsx` | Headers y spacing alineados a landing |
| `Recommendations.tsx` | Headers alineados si aplica |

