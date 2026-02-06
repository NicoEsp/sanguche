

# Reemplazar estadisticas con datos reales y referencias verificables

## Resumen

Actualizar la seccion "Los numeros hablan" en `/soy-dev` para que cada estadistica tenga una fuente real verificable, y agregar las referencias debajo de las metricas.

---

## Estadisticas actuales vs. propuestas

| Actual | Problema | Propuesta con fuente real |
|--------|----------|--------------------------|
| **70%** "de startups fracasan por problemas de producto, no de tecnologia" | El numero 70% no tiene una fuente clara y verificable | **35%** "de startups fracasan porque no habia necesidad de mercado. Es la razon #1 de fracaso." — CB Insights, Top Reasons Startups Fail (2021) |
| **3x** "mas valorados son los devs que entienden producto en procesos de hiring" | No tiene fuente real | **4-5x** "mas rapido crecen en revenue las empresas donde producto, cultura y herramientas estan alineados" — McKinsey, Developer Velocity (2020) |
| **2025** "el ano en que AI cambio las reglas: saber programar ya no alcanza" | Es una opinion, no un dato verificable | **84%** "de developers ya usan herramientas de AI para programar. Solo codigo ya no es el diferencial." — Stack Overflow Developer Survey (2025) |

---

## Cambios tecnicos

### 1. Actualizar `const stats` en `src/pages/SoyDev.tsx`

Reemplazar los 3 objetos del array `stats` con los datos verificados:

```tsx
const stats = [
  {
    value: "35%",
    label:
      "de startups fracasan porque no habia necesidad de mercado. Es la razon #1 de fracaso.",
    source: "CB Insights, 2021",
    url: "https://www.cbinsights.com/research/report/startup-failure-reasons-top/",
  },
  {
    value: "4-5x",
    label:
      "mas rapido crecen en revenue las empresas donde producto, cultura y herramientas estan alineados",
    source: "McKinsey, 2020",
    url: "https://www.mckinsey.com/industries/technology-media-and-telecommunications/our-insights/developer-velocity-how-software-excellence-fuels-business-performance",
  },
  {
    value: "84%",
    label:
      "de developers ya usan herramientas de AI para programar. Solo codigo ya no es el diferencial.",
    source: "Stack Overflow Survey, 2025",
    url: "https://survey.stackoverflow.co/2025/ai",
  },
];
```

### 2. Actualizar el renderizado de stats en el JSX

Agregar debajo de cada `label` un link a la fuente:

```tsx
<a
  href={stat.url}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs text-primary/60 hover:text-primary underline mt-1 inline-block"
>
  Fuente: {stat.source}
</a>
```

---

## Fuentes verificadas

1. **CB Insights "Top 12 Reasons Startups Fail"** (2021): Analisis de 111+ post-mortems de startups. La razon #1 es "No market need" con 35%. Directamente un problema de producto.
   - URL: https://www.cbinsights.com/research/report/startup-failure-reasons-top/

2. **McKinsey "Developer Velocity"** (Abril 2020): Estudio de 440 empresas grandes. Las empresas en el cuartil superior en Developer Velocity Index crecen 4-5x mas rapido en revenue. Las 4 capacidades con mayor impacto son: tools, **product management**, cultura y talent management.
   - URL: https://www.mckinsey.com/.../developer-velocity-how-software-excellence-fuels-business-performance

3. **Stack Overflow Developer Survey 2025**: El 84% de desarrolladores ya usan herramientas de AI. Refuerza el mensaje de que programar por si solo no es el diferencial.
   - URL: https://survey.stackoverflow.co/2025/ai

## Archivo afectado

| Archivo | Accion |
|---------|--------|
| `src/pages/SoyDev.tsx` | Actualizar array `stats` y renderizado con fuentes |

