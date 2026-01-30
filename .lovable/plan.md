

## Plan: Career Path Disponible sin Mentoría Completada

### Resumen del Cambio

Actualmente, el Career Path (`/progreso`) **ya está disponible** para usuarios Premium/RePremium sin necesidad de completar la mentoría. La página solo verifica `hasActivePremium`.

Lo que `mentoria_completed` controla actualmente:
- **En `/mentoria`**: Muestra/oculta los recursos dedicados y ejercicios asignados por el mentor
- **En `/mentoria`**: Cambia el hero de "Agendar sesión" a "Excelente trabajo, ve tu Career Path"

El cambio necesario es **actualizar la UI de admin** para que refleje correctamente qué controla este toggle:

### Archivos a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/pages/admin/AdminUsers.tsx` | Actualizar texto del botón y tooltip para reflejar que solo controla ejercicios y recursos |
| `src/pages/admin/AdminMentoriaDetail.tsx` | Actualizar texto del botón y toast de confirmación |

### Cambios Específicos

#### 1. AdminUsers.tsx (líneas 732-745 y 833-841)

**Antes (Desktop)**:
```tsx
<Button
  title={user.mentoria_completed ? 
    'Bloquear recomendaciones y recursos personalizados' : 
    'Desbloquear recomendaciones y recursos personalizados'
  }
>
  {user.mentoria_completed ? '🔒 Bloquear Contenido' : '🔓 Desbloquear Contenido'}
</Button>
```

**Después (Desktop)**:
```tsx
<Button
  title={user.mentoria_completed ? 
    'Ocultar ejercicios y recursos asignados' : 
    'Mostrar ejercicios y recursos asignados'
  }
>
  {user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}
</Button>
```

**Antes (Mobile)**:
```tsx
{user.mentoria_completed ? '🔒 Bloquear' : '🔓 Desbloquear'}
```

**Después (Mobile)**:
```tsx
{user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}
```

#### 2. AdminMentoriaDetail.tsx (líneas 98-141)

**Antes**:
```tsx
toast({
  title: "✅ Mentoría completada",
  description: "El usuario ahora tiene acceso a todo el contenido avanzado"
});
```

**Después**:
```tsx
toast({
  title: "✅ Mentoría completada",
  description: "El usuario ahora puede ver ejercicios y recursos asignados"
});
```

### Lo que NO Cambia

- **Progress.tsx**: Ya solo verifica `hasActivePremium`, no requiere cambios
- **Recommendations.tsx**: La lógica de mostrar/ocultar recursos y ejercicios basada en `mentoria_completed` permanece igual
- **features.ts**: Las funciones `isMentoriaContentAvailable` y `isMentoriaAdvancedContentAvailable` permanecen igual

### Resultado Final

Los usuarios Premium/RePremium podrán:
1. Acceder a Career Path inmediatamente al suscribirse
2. Ver ejercicios y recursos dedicados solo después de que el admin marque la mentoría como completada

El admin verá textos claros que reflejan exactamente qué controla el toggle de mentoría.

---

### Sección Técnica

Los cambios son puramente de UI/UX en el panel de administración:

```tsx
// AdminUsers.tsx - Desktop (línea 738-744)
title={user.mentoria_completed ? 
  'Ocultar ejercicios y recursos asignados' : 
  'Mostrar ejercicios y recursos asignados'
}
// Botón: {user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}

// AdminUsers.tsx - Mobile (línea 840)
// Botón: {user.mentoria_completed ? '✓ Mentoría' : '⏳ Pendiente'}

// AdminMentoriaDetail.tsx - Toast (línea 119-120)
description: "El usuario ahora puede ver ejercicios y recursos asignados"
```

