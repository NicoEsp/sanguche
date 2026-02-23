

## Corregir datos de Lemon Squeezy para juchambo@gmail.com

### Resumen

Actualizar el registro de `user_subscriptions` de juchambo@gmail.com con los IDs de Lemon Squeezy que llegaron por webhook pero no se guardaron correctamente.

### Cambio

Ejecutar un UPDATE en `user_subscriptions` usando el insert tool para agregar los datos faltantes:

- `lemon_squeezy_customer_id`: `'7150814'`
- `lemon_squeezy_subscription_id`: `'1640512'`
- `lemon_squeezy_order_id`: `'6828911'`

Se identificara al usuario buscando su profile ID a traves de su email en la tabla `profiles`.

No se requieren cambios de codigo ni migraciones de esquema.

