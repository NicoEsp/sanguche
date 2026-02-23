

## Pasar usuario Premium a Free desde Suscripciones

### Resumen

Agregar un boton "Pasar a Free" en la columna de Acciones de la tabla de suscripciones, visible solo para usuarios con plan distinto de `free`. Al hacer click, muestra un dialog de confirmacion y luego usa la funcion de base de datos `admin_update_subscription` que ya existe para cambiar el plan.

### Cambios

#### `src/pages/admin/AdminSubscriptions.tsx`

1. Agregar un boton "Pasar a Free" al lado del boton de "Marcar Bonif." en la columna Acciones, visible cuando `sub.plan !== 'free'`
2. Agregar un `AlertDialog` de confirmacion que muestre el nombre del usuario y su plan actual antes de ejecutar la accion
3. Al confirmar, llamar a `supabase.rpc('admin_update_subscription', { p_target_profile_id: sub.user_id, p_new_plan: 'free', p_notes: 'Downgraded by admin' })`
4. Invalidar queries de suscripciones y stats tras el exito
5. Mostrar toast de exito/error

No se necesitan cambios en base de datos ni edge functions. La funcion `admin_update_subscription` ya soporta cualquier valor del enum `subscription_plan`, incluyendo `free`.

