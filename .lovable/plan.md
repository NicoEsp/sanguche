
# Fix: Alineación de textos en "Cómo funciona"

## Problema
La card "Evaluáte" tiene un Badge "5 minutos" que las otras cards no tienen, causando que:
- Los textos de descripción de "Descubrí" y "Crecé" queden más arriba
- Hay espacio en blanco desigual entre las cards

## Solución

Agregar un **espacio reservado invisible** en las cards que no tienen subtitle, para mantener la alineación visual consistente.

### Cambio en `src/components/sections/HowItWorks.tsx`

**Líneas 51-55** - Actualizar el renderizado del título y subtitle:

```tsx
<h3 className="font-semibold mb-1">{step.title}</h3>
{step.subtitle ? (
  <Badge variant="secondary" className="mb-2 text-xs">{step.subtitle}</Badge>
) : (
  <div className="mb-2 h-5"></div>
)}
<p className="text-sm text-muted-foreground">{step.description}</p>
```

## Resultado esperado
- Las 3 descripciones quedarán perfectamente alineadas en la misma línea visual
- Se elimina el espacio en blanco irregular debajo de "Descubrí" y "Crecé"
