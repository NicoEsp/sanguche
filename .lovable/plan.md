

## 4 fixes en la pantalla de autoevaluacion

### 1. Botones alineados en pregunta 11 (lineas 821-840)

El boton "Ver resultados" tiene `mt-2` y esta fuera del flow horizontal. Hay que poner los 3 botones (Anterior, Siguiente Opcionales, Ver resultados) en el mismo `flex` row. Cambiar la estructura para que en el step `DOMAINS.length - 1`, los botones "Siguiente (Opcionales)" y "Ver resultados" esten en la misma fila junto con "Anterior", sin `mt-2`.

### 2. Evitar texto huerfano "(1)" en opciones (lineas 710-712)

Agregar `text-wrap: pretty` o `text-wrap: balance` al `<span>` que muestra `option.label` tanto en preguntas obligatorias (linea 710) como opcionales (linea 786). Esto le indica al navegador que redistribuya el texto para evitar que queden pocas palabras solas en la ultima linea. Como fallback, tambien se puede usar `text-balance` de Tailwind si esta disponible, o aplicar inline style `textWrap: 'pretty'`.

### 3. Ultima pregunta opcional pre-selecciona la primera opcion

El problema es que cuando el usuario navega "atras" desde la ultima pregunta opcional y vuelve, o cuando llega por primera vez, el `RadioGroup` puede tener un valor residual. Revisando el codigo, `optionalValues` se inicializa como `{}` y nunca se resetea al hacer `handleStartReevaluation`. Hay que agregar `setOptionalValues({})` en `handleStartReevaluation` (linea 286-295). Tambien verificar que el `value` prop del RadioGroup en opcionales (linea 764) pase `undefined` correctamente cuando no hay valor, asegurandose que `currentOptionalValue` sea `undefined` y no `0` o falsy que el RadioGroup interprete mal.

### 4. Bordes de la card de progreso demasiado anchos

La barra de progreso sticky (linea 606) usa `-mx-4 sm:mx-0 sm:rounded-lg sm:border` pero no tiene `max-w-2xl mx-auto` como el form (linea 658). Hay que:
- En el contenedor sticky, agregar `max-w-2xl mx-auto` en desktop para que quede alineado con el form
- El warning de reevaluacion (linea 652) ya tiene `max-w-2xl mx-auto`, esta OK
- Ajustar para que progress bar, pregunta, y botones compartan la misma columna

### Archivos a modificar
- `src/pages/Assessment.tsx` - los 4 cambios

