

## Animacion estilo "Claude Code: adding skill" en las cards de "Por que Producto importa"

### Concepto

Cada card aparece con una animacion escalonada que simula el estilo de una terminal agregando una skill, inspirado en la estetica de Claude Code:

1. Aparece un "prompt line" con efecto typing: `> Adding skill: [titulo]...`
2. La card se expande/revela debajo con fade-in
3. Un checkmark verde aparece al completarse
4. Cada card se dispara con un delay incremental (0s, 0.4s, 0.8s, 1.2s)

La animacion se activa cuando la seccion entra en viewport (Intersection Observer), asi el usuario la ve al scrollear.

### Visual de referencia

```text
> Adding skill: El contexto cambio...        [check verde]
+------------------------------------------+
| [icon]                                    |
| El contexto cambio                        |
| Con AI generando codigo, el diferencial...|
+------------------------------------------+

> Adding skill: Habla el mismo idioma...     [check verde]
+------------------------------------------+
| ...                                       |
+------------------------------------------+
```

### Detalle tecnico

**Nuevo archivo: `src/components/soydev/SkillCard.tsx`**

Componente individual que recibe la data de una card + un `delay` y renderiza:
- Una linea superior con fuente mono, efecto typing (overflow hidden + width animado), texto verde tipo terminal: `> Adding skill: {title}...`
- Un icono de CheckCircle2 que aparece con fade-in al terminar el typing
- La Card existente debajo, con animacion `fade-in` + `translateY` retrasada para que aparezca despues del typing
- Usa `useState` + `useEffect` con `IntersectionObserver` para activar la animacion solo cuando es visible

**Modificacion: `src/pages/SoyDev.tsx`**

- Importar `SkillCard` y reemplazar el `.map()` actual de `whyCards` (lineas 176-191)
- Cada `SkillCard` recibe `card`, `index` (para calcular delay), y un ref compartido para el observer
- La seccion wrapper recibe un `ref` para el Intersection Observer

**Modificacion: `tailwind.config.ts`**

Agregar keyframe `typing` para la animacion de ancho del texto:

```
"typing": {
  "0%": { width: "0", opacity: "1" },
  "100%": { width: "100%", opacity: "1" }
}
```

Y la animacion correspondiente:
```
"typing": "typing 1s steps(30) forwards"
```

### Comportamiento

- Al hacer scroll y la seccion entra en el viewport, se dispara la secuencia
- Card 1 arranca inmediatamente, card 2 a los 0.4s, card 3 a los 0.8s, card 4 a los 1.2s
- Cada card muestra primero la linea de terminal con typing, luego la card con fade-in
- La animacion solo ocurre una vez (no se repite al scrollear de vuelta)
- En mobile funciona igual, la grilla pasa a 1 columna y las cards se apilan

