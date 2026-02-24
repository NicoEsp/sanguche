## Reducir abandono de la autoevaluacion: cards + tracking por pregunta

### Problema

De 73 usuarios que inician, solo 38 terminan (52%). El scroll largo en desktop asusta y no hay datos granulares de donde abandonan.

### Cambios

#### 1. Tracking por pregunta: `assessment_question_answered`

Agregar un evento Mixpanel cada vez que el usuario selecciona una opcion en cualquier pregunta (obligatoria u opcional). Propiedades:

- `question_number`: posicion (1-indexed)
- `question_id`: slug semantico (ej. `estrategia`, `roadmap`)
- `answer_value`: valor elegido (1-5)
- `is_optional`: boolean
- `time_on_question`: segundos desde que la pregunta aparecio en pantalla

Esto se implementa con un `useRef` para guardar el timestamp de cuando aparece cada card, y disparando el evento en el `onValueChange` del RadioGroup.

#### 2. Interfaz card-based para TODOS los dispositivos

Actualmente mobile ya usa steps (1 pregunta a la vez) pero desktop muestra todas juntas con scroll. El cambio:

- **Eliminar la bifurcacion mobile/desktop**: usar siempre la logica de `currentStep` para mostrar 1 pregunta a la vez, tanto en mobile como desktop.
- **Reutilizar** la navegacion que ya existe (botones Anterior/Siguiente, skip para opcionales).
- Mantener la card (fieldset con border y bg-card) pero centrada y con max-width para que en desktop se vea como un card prominente, no pegada al borde.

#### 3. Barra de progreso mejorada con mensajes motivacionales

- Hacer la barra mas grande (`h-5`) y visible en ambos dispositivos.
- Agregar mensajes contextuales segun el progreso:
  - 25%: "Buen inicio, segui asi"
  - 50%: "Estas a mitad de camino!"
  - 75%: "Ya casi terminas!"
  - 90%+: "Un ultimo esfuerzo!"
- La barra sera sticky en la parte superior para ambos dispositivos.

### Archivos a modificar

- `**src/pages/Assessment.tsx**`: Cambio principal. Eliminar la bifurcacion `isMobile` para el renderizado de preguntas y navegacion. Unificar en card-based con steps para todos. Agregar logica de tracking por pregunta (ref para timestamp, evento en onValueChange). Mejorar barra de progreso con mensajes.

### Lo que NO cambia

- La logica de scoring, dominios y preguntas opcionales
- La persistencia en localStorage de respuestas parciales
- Los eventos `assessment_started` y `assessment_completed`
- La pagina de resultados post-evaluacion