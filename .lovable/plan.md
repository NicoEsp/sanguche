

## Poner el boton "Soy Dev" en su propio renglon, debajo del CTA

### Problema

La seccion hero usa `text-center` pero no tiene `flex-col`, asi que tanto el boton "Comenzar evaluacion gratis" como el link `soyDev.queHago()` se renderizan como elementos inline uno al lado del otro. El `mt-6` no fuerza un salto de linea.

### Solucion

Envolver ambos elementos (el Button y el Link de soyDev) en un contenedor `flex flex-col items-center` con gap. Esto garantiza que cada uno ocupe su propio renglon y queden centrados con separacion clara.

### Detalle tecnico

**Archivo: `src/pages/Index.tsx`** (lineas 86-107)

Envolver el `Button` y el `Link` en un `div` con clases flex column:

```jsx
<div className="flex flex-col items-center gap-4">
  <Button asChild size="lg" ...>
    <Link to={...}>
      Comenzar evaluación gratis
      <ArrowRight ... />
    </Link>
  </Button>

  <Link 
    to="/soy-dev" 
    className="inline-flex items-center gap-1 font-mono text-sm ..."
  >
    ...
  </Link>
</div>
```

Se elimina el `mt-6` del Link porque el `gap-4` del contenedor se encarga de la separacion (16px entre ambos elementos). Si se quiere mas espacio se puede subir a `gap-6`.
