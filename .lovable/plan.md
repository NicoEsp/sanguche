

## Agregar item de mentoría en "Qué vas a descubrir en ProductPrepa"

### Cambio

Agregar un quinto item al array `benefits` en `src/pages/SoyDev.tsx` que mencione las sesiones de mentoría personalizada con NicoProducto como link a LinkedIn.

### Detalle técnico

**Archivo: `src/pages/SoyDev.tsx`**

1. Importar el icono `MessageCircle` de lucide-react (para representar mentoría/sesiones 1:1)
2. Agregar un nuevo item al array `benefits` con contenido JSX en vez de string plano (como ya se hace en `Planes.tsx` y `PaywallCard.tsx`):

```tsx
{
  icon: MessageCircle,
  text: <>Accedé a sesiones de mentoría personalizada 1:1 con <a href="https://www.linkedin.com/in/nicolas-espindola/" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 transition-colors underline">NicoProducto</a> para acelerar tu crecimiento en producto</>
}
```

3. Actualizar el tipo del array `benefits` para que `text` acepte `React.ReactNode` en lugar de solo `string` (ajustar la key del `.map()` ya que `benefit.text` podría no ser string — usar el index como key).

