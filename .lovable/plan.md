

## Separar visualmente el boton "Soy Dev" del CTA principal

### Cambio

Un ajuste simple en `src/pages/Index.tsx` (linea 99): cambiar el `mt-3` del Link de soyDev por `mt-6` para agregar mas interlineado entre el boton "Comenzar evaluacion gratis" y el snippet de codigo, y que no queden pegados.

### Detalle tecnico

**Archivo: `src/pages/Index.tsx`** (linea 99)

Cambiar la clase `mt-3` a `mt-6` en el className del Link:

```
mt-3 inline-flex items-center...
```
pasa a:
```
mt-6 inline-flex items-center...
```

Esto agrega 1.5rem (24px) de espacio superior en vez de los 0.75rem (12px) actuales, dando una separacion clara entre ambos elementos sin romper la jerarquia visual.
