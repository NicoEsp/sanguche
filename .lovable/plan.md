

## Plan: Agregar logging a send-discount-email para diagnosticar

### Problema
La función no tiene ningún `console.log` en su flujo de negocio. Solo vemos "booted/shutdown" en los logs, sin saber en qué punto sale (sin assessments, sin candidatos, sin emails, etc.).

### Cambios

**Archivo: `supabase/functions/send-discount-email/index.ts`**

Agregar `console.log` en cada punto de decisión:

1. Al inicio: log de la ventana de fechas que está buscando (3-4 días atrás)
2. Después de buscar assessments: log de cuántos encontró
3. Después de filtrar ya enviados: log de cuántos pendientes
4. Dentro del loop: log de por qué se skippea cada usuario (sin email, plan no free, no es candidato)
5. Al enviar: log de éxito o error por usuario
6. Al final: resumen total

Esto permitirá ver exactamente qué pasa en cada ejecución del cron en los logs de Supabase, sin cambiar la lógica de negocio.

### Resultado esperado
En la próxima ejecución (13:00 UTC) o en una prueba manual, los logs mostrarán exactamente cuántos assessments hay en la ventana, cuántos pasan cada filtro, y por qué se skippean.

