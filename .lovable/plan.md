

## Simplificar props de Seo en paginas publicas

### Que se hace

Todas estas paginas pasan manualmente `title`, `description`, `keywords`, `canonical` y/o `jsonLd` a `<Seo />`, pero esos mismos datos ya existen en `src/seo/routes.ts`. Como `Seo.tsx` ya los carga automaticamente por pathname, los props redundantes se pueden eliminar.

### Cambios por archivo

| Archivo | Cambio |
|---------|--------|
| `src/seo/routes.ts` | Agregar entrada para `/mejoras` (SkillGaps) |
| `src/pages/Index.tsx` | `<Seo />` sin props |
| `src/pages/Planes.tsx` | `<Seo />` sin props |
| `src/pages/CursosInfo.tsx` | `<Seo />` sin props |
| `src/pages/Descargables.tsx` | `<Seo />` sin props |
| `src/pages/StarterPackHome.tsx` | `<Seo />` sin props |
| `src/pages/StarterPackBuild.tsx` | `<Seo />` sin props |
| `src/pages/StarterPackLead.tsx` | `<Seo />` sin props |
| `src/pages/SoyDev.tsx` | `<Seo />` sin props (jsonLd ya esta en routes.ts) |
| `src/pages/Assessment.tsx` | `<Seo />` sin props |
| `src/pages/SkillGaps.tsx` | `<Seo />` sin props (tras agregar `/mejoras` a routes.ts) |

### Detalle tecnico

- En cada pagina se reemplaza `<Seo title="..." description="..." ... />` por `<Seo />`
- Se pueden eliminar imports no usados (ej: si `keywords` o `jsonLd` eran variables locales solo para Seo)
- Paginas como `CourseDetail.tsx`, `Auth.tsx`, `Welcome.tsx` NO se tocan porque usan datos dinamicos (titulo del curso, estado de auth) que no vienen de routes.ts
- Se agrega la entrada `/mejoras` a `routes.ts` con title, description, canonical y keywords que actualmente tiene SkillGaps.tsx

### Resultado

- 10 paginas simplificadas
- Una sola fuente de verdad para metadata SEO
- Menos codigo duplicado y mas facil de mantener

