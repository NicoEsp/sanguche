

## Mejorar responsividad y metricas del Admin Dashboard

### Problemas actuales

1. Los valores grandes de MRR/ARR/ARPU en formato moneda ("$1.234.567") desbordan las cards en pantallas chicas
2. Las KPI cards del grid de 5 columnas no tienen altura uniforme
3. ARR no es la metrica mas util para el negocio -- se reemplaza por Lifetime Value (LTV)

### Cambios

#### 1. Responsividad de las KPI cards (AdminDashboard.tsx)

- Agregar `truncate` y `text-base sm:text-2xl` a todos los valores numericos grandes para que escalen en mobile
- Agregar `min-h-[120px]` (o similar) a todas las cards KPI para que tengan la misma altura
- En el grid principal de 5 columnas: cambiar a `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` para que no queden apretadas
- En el grid secundario de 4 columnas: mantener `grid-cols-2 lg:grid-cols-4`
- Agregar `overflow-hidden` a las cards que muestran montos
- Los badges en "Resumen Financiero" necesitan `whitespace-nowrap` y `text-xs` para no colapsar

#### 2. Cards con mismo alto y ancho (AdminDashboard.tsx)

- Agregar `h-full` a cada `<Card>` dentro de los grids de KPI para que se estiren uniformemente
- Esto aplica a los dos grids superiores (5 cols y 4 cols) y al grid de actividad reciente

#### 3. Reemplazar ARR por LTV (useAdminAnalytics.ts + AdminDashboard.tsx)

**En `useAdminAnalytics.ts`:**
- Renombrar `arr` a `ltv` en la interface `AdminAnalytics`
- Calcular LTV como: `arpu * avgLifetimeMonths` (estimacion simple con meses promedio de vida de suscriptor)
- Alternativa mas simple si no hay datos de churn: `LTV = totalRevenue / totalPaidUsers` usando la suma de todos los `paid_amount` de suscripciones activas e inactivas
- Para hacerlo simple y realista: LTV = suma total de paid_amount de TODOS los suscriptores (activos e historicos) / cantidad total de suscriptores unicos

**En `AdminDashboard.tsx`:**
- Cambiar la card "ARR" por "LTV" con icono `TrendingUp`
- Actualizar el "Resumen Financiero" para mostrar LTV en lugar de ARR
- Label: "Lifetime Value" con descripcion "Ingreso promedio por cliente"

### Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `src/hooks/useAdminAnalytics.ts` | Reemplazar `arr` por `ltv`, calcular LTV real |
| `src/pages/admin/AdminDashboard.tsx` | Responsividad, alturas uniformes, ARR -> LTV |

### Detalle de calculo LTV

Se calcula sumando todos los `paid_amount` historicos (no solo activos) y dividiendo por la cantidad de usuarios unicos que alguna vez pagaron. Esto da el ingreso promedio real por cliente a lo largo de su vida.

```text
LTV = SUM(paid_amount de todas las suscripciones con pago) / COUNT(usuarios unicos que pagaron)
```

Para esto se necesita incluir suscripciones con status `expired` o `cancelled` ademas de `active` en la query de subscriptions.

