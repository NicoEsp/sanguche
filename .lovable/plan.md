

## Reordenar KPI cards en /admin

Actualmente hay 2 grids:
- **Fila 1** (5 cols): Usuarios Totales, Premium Pagados, Bonificados, MRR, LTV
- **Fila 2** (4 cols): Evaluaciones, Esta Semana, ARPU, Conversión

El nuevo orden pedido:
- **Fila 1**: Usuarios Totales, Evaluaciones (hoy), Esta Semana, Conversión → 4 cards
- **Fila 2**: Premium Pagados, Bonificados, MRR, ARPU, LTV → 5 cards

### Cambios en `src/pages/admin/AdminDashboard.tsx`

1. **Primer grid** (lineas 77-136): Cambiar a `lg:grid-cols-4` y mover aquí las cards de Usuarios Totales, Evaluaciones, Esta Semana y Conversión.

2. **Segundo grid** (lineas 138-187): Cambiar a `lg:grid-cols-5` y mover aquí Premium Pagados, Bonificados, MRR, ARPU y LTV.

Solo se reordenan las cards entre los dos grids, sin cambiar el contenido de cada card.

