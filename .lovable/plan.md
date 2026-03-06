

## Plan: Eliminar todo lo relacionado a send-discount-email

### Archivos a eliminar
- `supabase/functions/send-discount-email/index.ts` — la Edge Function completa

### Archivos a modificar
- `supabase/config.toml` — quitar las líneas 95-96 (`[functions.send-discount-email]` y `verify_jwt = false`)

### SQL a ejecutar manualmente en Supabase
El usuario deberá ejecutar en el SQL Editor:

1. **Eliminar el cron job**:
```sql
SELECT cron.unschedule('send-discount-emails-daily');
```

2. **Eliminar la tabla `discount_email_queue`**:
```sql
DROP TABLE IF EXISTS public.discount_email_queue;
```

3. **(Opcional) Eliminar el secret `RESEND_API_KEY`** desde Settings > Edge Functions si ya no se usa en ninguna otra función.

### Nota
El archivo `src/integrations/supabase/types.ts` se actualiza automáticamente al sincronizar el schema, así que no lo tocamos manualmente. Después de dropear la tabla, los types se regenerarán sin `discount_email_queue`.

