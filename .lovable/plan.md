

## Problema

Los usuarios RePremium no aparecen en la seccion "Gestion de Mentorias" del admin porque el hook `usePremiumUsers` filtra exclusivamente por `plan = 'premium'`, ignorando a los usuarios con plan `'repremium'`. Ademas, el badge en la tabla esta hardcodeado como "Premium" en vez de mostrar el plan real del usuario.

## Solucion

Dos cambios puntuales:

### 1. Hook `usePremiumUsers.ts` - Incluir RePremium en la query

Reemplazar el filtro `.eq('user_subscriptions.plan', 'premium')` por `.in('user_subscriptions.plan', ['premium', 'repremium'])` para traer ambos tipos de usuarios con acceso a mentoria.

Tambien actualizar la interfaz `PremiumUser` para que el tipo de `plan` incluya `'repremium'`.

### 2. Pagina `AdminRecommendations.tsx` - Badge dinamico por plan

Reemplazar el badge hardcodeado `<Badge variant="default">Premium</Badge>` por un badge dinamico que use `getPlanBadgeInfo()` del archivo centralizado `src/constants/plans.ts`. Esto mostrara "Premium" en ambar o "RePremium" en purpura segun corresponda, consistente con el resto del admin.

Tambien actualizar el subtitulo de la pagina de "usuarios Premium" a "usuarios Premium y RePremium".

---

### Detalle tecnico

**`src/hooks/usePremiumUsers.ts`**
- Linea 11: Cambiar tipo de `plan` de `'free' | 'premium'` a `'free' | 'premium' | 'repremium'`
- Linea 35: Cambiar `.eq('user_subscriptions.plan', 'premium')` por `.in('user_subscriptions.plan', ['premium', 'repremium'])`

**`src/pages/admin/AdminRecommendations.tsx`**
- Importar `getPlanBadgeInfo` desde `@/constants/plans`
- Linea 112: Reemplazar badge hardcodeado por badge dinamico usando `getPlanBadgeInfo(user.user_subscriptions.plan)`
- Linea 43: Actualizar descripcion a "Ejercicios y recursos para usuarios Premium y RePremium"
- Linea 58-59: Actualizar titulo y descripcion de la card de busqueda

