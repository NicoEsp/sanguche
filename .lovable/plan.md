
## Boton "Soy Dev" con estilo de IDE/codigo

### Que cambia

El boton actual es un `Button` ghost gris simple. Lo vamos a transformar en un elemento que simule una linea de codigo en un editor/terminal, manteniendo su funcionalidad de link a `/soy-dev`.

### Diseno visual

El boton tendra aspecto de snippet de codigo:
- Fondo oscuro semi-transparente (`bg-slate-900/80`) con bordes redondeados
- Fuente monoespaciada (`font-mono`)
- Prompt de terminal (`>` o `$`) en verde al inicio, simulando una linea de comando
- El texto "soyDev" en camelCase con coloreado tipo syntax highlighting (keyword en una tonalidad, string en otra)
- Signo de interrogacion `?` como si fuera parte del codigo
- Cursor parpadeante al final (usando una animacion CSS)
- Hover sutil con borde que se ilumina

### Ejemplo visual aproximado

```text
┌─────────────────────────────────┐
│  > soyDev.queHago()_ 	          │
└─────────────────────────────────┘
```

Donde:
- `>` en verde (prompt)
- `soyDev` en celeste (como una variable)
- `.queHago()` en amarillo/naranja (como un metodo)
- `_` parpadeando como cursor

### Detalle tecnico

**Archivo: `src/pages/Index.tsx`** (lineas 96-101)

Reemplazar el `Button` ghost actual por un `Link` estilizado con clases de Tailwind:
- `font-mono` para tipografia monoespaciada
- `bg-slate-900/80 text-slate-300` para el fondo oscuro
- Spans internos con colores diferenciados: `text-green-400` para el prompt, `text-sky-400` para el objeto, `text-amber-400` para el metodo
- Animacion de cursor parpadeante usando `animate-pulse` o un keyframe custom
- `border border-slate-700 hover:border-slate-500` para el borde con hover
- Se mantiene el `onClick` de tracking con Mixpanel
- Se elimina el icono `Code` de lucide ya que el estilo visual lo reemplaza

**Archivo: `src/index.css`** (opcional)

Agregar un keyframe `blink` para el cursor si `animate-pulse` no da el efecto deseado:
```css
@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}
```
