

## Fondo oscuro tipo terminal en las lineas de prompt

Envolver la linea del prompt (`> Adding skill: ...`) en un contenedor con fondo oscuro, bordes redondeados y padding, simulando una ventana de terminal.

### Cambios en `src/components/soydev/SkillCard.tsx`

Reemplazar el `div` del prompt line (lineas ~34-43) con un contenedor estilizado:

```tsx
<div className="flex items-center gap-2 bg-[#1a1a2e] rounded-md px-3 py-2 min-h-[36px] border border-white/5">
  {phase !== "idle" && (
    <div className="font-mono text-xs sm:text-sm text-green-400 overflow-hidden whitespace-nowrap animate-typing">
      <span className="text-gray-500">{">"}</span>{" "}
      Adding skill: {title}...
    </div>
  )}
  {(phase === "check" || phase === "card") && (
    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0 animate-fade-in" />
  )}
</div>
```

Cambios puntuales:
- Fondo oscuro con `bg-[#1a1a2e]` (azul muy oscuro, estilo terminal)
- Borde sutil con `border border-white/5`
- Bordes redondeados con `rounded-md`
- Padding interno con `px-3 py-2`
- Altura minima `min-h-[36px]` para que el contenedor se vea consistente antes y despues de la animacion
- El color del `>` cambia de `text-muted-foreground/60` a `text-gray-500` para mejor contraste sobre fondo oscuro

