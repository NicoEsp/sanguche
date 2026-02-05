
# Cambiar fecha de lanzamiento del curso

## Curso
**Estrategia de Producto para principiantes** (ID: `cde8ceef-7ec4-4f40-90d8-5b8efb2cc5ce`)

## Cambio
- **Fecha actual**: 31 de enero de 2026
- **Nueva fecha**: 20 de febrero de 2026

## Acción técnica
Ejecutar actualización en la tabla `courses`:
```sql
UPDATE courses 
SET publish_at = '2026-02-20T00:00:00-03:00', updated_at = now()
WHERE id = 'cde8ceef-7ec4-4f40-90d8-5b8efb2cc5ce';
```

Nota: La hora se configura a medianoche en zona horaria Argentina (UTC-3).
