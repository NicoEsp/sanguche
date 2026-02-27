## Tres cambios puntuales

### 1. Aclarar "Pesos Argentinos" en /planes (PlanCard)

En `src/pages/Planes.tsx`, linea 64, despues del `priceLabel` ("/mes"), agregar:

```
<p className="text-xs text-muted-foreground mt-0.5">Pesos Argentinos</p>
```

Esto queda dentro del `div` existente del precio, no agrega altura significativa a las cards porque ya tienen `min-h` en titulo y features.

### 2. Aclarar "Pesos Argentinos" en /cursos-info (3 cards de pricing)

En `src/pages/CursosInfo.tsx`, en las tres cards de precio:

- **Curso Individual** (linea 381): debajo de "pago unico", agregar `<p className="text-xs text-muted-foreground">Pesos Argentinos</p>`
- **Todos los Cursos** (linea 411): idem
- **Con Mentoria** (linea 442): debajo de "/mes", agregar lo mismo

Tambien en el precio del hero del curso (linea 261), debajo de "pago unico", agregar la misma aclaracion.

### 3. Aclarar en landing page (/)

En `src/pages/Index.tsx`, las 3 mini-cards de pricing (lineas 189, 222, 254): agregar `<p className="text-xs text-muted-foreground">Pesos Argentinos</p>` debajo de cada precio.

### 4. Cambiar titulo post-evaluacion

En `src/pages/Assessment.tsx` linea 425, cambiar "Autoevaluacion de seniority" por "Tu diagnostico en Producto".

### Archivos a modificar

- `src/pages/Planes.tsx` - texto en PlanCard
- `src/pages/CursosInfo.tsx` - texto en 3 cards + hero
- `src/pages/Index.tsx` - texto en 3 mini-cards de landing
- `src/pages/Assessment.tsx` - cambiar titulo