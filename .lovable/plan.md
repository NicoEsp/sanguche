
## Corrección Urgente: Acceso RePremium

### Problema
El hook `useSubscription.ts` solo reconoce `plan === 'premium'`, excluyendo a usuarios `repremium` de todas las funcionalidades premium.

### Solución
Modificar línea 114-116 de `src/hooks/useSubscription.ts`:

```typescript
// ANTES (bug)
hasActivePremium: isStillLoading 
  ? undefined 
  : (isActive && plan === 'premium'),

// DESPUÉS (correcto)
hasActivePremium: isStillLoading 
  ? undefined 
  : (isActive && ['premium', 'repremium'].includes(plan || '')),
```

### Impacto Inmediato
Jonathan Glantz y cualquier futuro usuario RePremium tendrán acceso completo a:
- Mentoría personalizada
- Career Path
- Recomendaciones
- Recursos premium

### Archivo a Modificar
| Archivo | Cambio |
|---------|--------|
| `src/hooks/useSubscription.ts` | Incluir `repremium` en verificación de `hasActivePremium` |

### Prevención Futura
Para evitar que esto vuelva a pasar, cuando agreguemos nuevos planes debemos revisar:
1. `has_active_premium()` en DB
2. `useSubscription.ts` (hasActivePremium)
3. `useCourseAccess.ts` (acceso a cursos)
4. Admin filters y badges
