

## Ajustes a mensajes motivacionales + boton "Ver resultados"

### 1. Mensajes motivacionales por porcentaje

Reemplazar los textos en `getProgressMessage` (linea 298-304 de `src/pages/Assessment.tsx`):

```
>= 90  ->  "Un ultimo esfuerzo!"           (sin cambio)
>= 75  ->  "Ya casi terminas!"             (sin cambio)
>= 50  ->  "Quedan las mas dificiles, ya casi estas"   (NUEVO, reemplaza "Estas a mitad de camino")
>= 25  ->  "Vas bien. Las preguntas que siguen son fundamentales"  (NUEVO, reemplaza "Buen inicio, segui asi")
```

No se necesita pasar `currentStep` a la funcion, se mantiene solo con porcentaje.

### 2. Boton "Ver resultados" en la ultima pregunta obligatoria

Cuando `currentStep === DOMAINS.length - 1` (pregunta 11, la ultima obligatoria), agregar debajo de los botones "Anterior" / "Siguiente (Opcionales)" un boton centrado:

- Texto: **"Ver resultados"**
- Tipo: `submit` (dispara `form.handleSubmit(onSubmit)`)
- Variante: `outline`, `w-full mt-2`
- Deshabilitado si `isSaving` o si no estan respondidas todas las obligatorias

### Archivo a modificar

`src/pages/Assessment.tsx` unicamente.
