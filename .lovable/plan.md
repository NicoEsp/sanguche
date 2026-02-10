
## Fixes para las cards de /soy-dev

### 1. Cards del mismo tamaño

La tercera card ("De ejecutor a estratega") tiene menos texto, por eso queda mas chica. Se agrega `h-full` al Card y al contenedor para que todas las cards del grid tengan la misma altura.

**Archivo: `src/components/soydev/SkillCard.tsx`**
- Agregar `h-full` al div wrapper de la Card (el que tiene la transicion)
- Agregar `h-full` al componente `Card` para que ocupe todo el espacio disponible

### 2. Animacion se repite cada vez que se entra a la pagina

Actualmente el `IntersectionObserver` se desconecta despues de la primera vez y el estado `skillsVisible` queda en `true` para siempre (incluso si navegas a otra pagina y volves). Se necesita:

**Archivo: `src/pages/SoyDev.tsx`**
- Resetear `skillsVisible` a `false` cada vez que el componente se monta (agregar un `useEffect` que setee `false` al montar)
- Mantener el `observer.disconnect()` para que no se re-dispare al scrollear, pero reconectarse en cada mount

**Archivo: `src/components/soydev/SkillCard.tsx`**
- Resetear `phase` a `"idle"` cuando `triggerAnimation` cambia a `false`, para que la animacion pueda volver a correr

### Detalle tecnico

En `SkillCard.tsx`:
```tsx
// Agregar h-full al wrapper y Card
<div className="space-y-2 h-full flex flex-col">
  ...
  <div className="... flex-1">
    <Card className="... h-full">
```

```tsx
// Resetear phase cuando triggerAnimation cambia a false
useEffect(() => {
  if (!triggerAnimation) {
    setPhase("idle");
  }
}, [triggerAnimation]);
```

En `SoyDev.tsx`:
```tsx
// Resetear al montar para que funcione en cada visita
useEffect(() => {
  setSkillsVisible(false);
}, []);

// No desconectar el observer permanentemente, recrearlo en cada mount
```
