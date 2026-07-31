# Promo · Nuevas evaluaciones

Video de anuncio de las evaluaciones por perfil (43s · 1920×1080 · 60fps · H.264).
No es una grabación de pantalla: es una pieza de motion graphics renderizada
frame a frame, que recrea pixel-fiel las tres pantallas de la feature con los
componentes, copy y colores reales de la app.

## Guion (timeline)

| Tiempo | Escena |
|---|---|
| 0.0–4.0s | Intro de marca: "Cuatro perfiles, cuatro evaluaciones." |
| 4.0–11.5s | Selector de perfil (`AssessmentTypeSelector`): hover en "Ya trabajo en producto", click en "Estoy construyendo un producto" |
| 11.5–23.8s | Wizard builder: Q1 y Q2 completas, montage rápido Q3–Q10, pregunta de contexto (etapa MVP + typing) |
| 23.8–36.3s | Resultados: toast "Evaluación guardada", promedio 3.4 con count-up, badges, scroll al radar y dibujo animado del mapa de competencias |
| 36.3–43.0s | Outro: "¿Desde dónde arrancás vos?" + CTA + URL |

Los puntajes del ejemplo (promedio 3.4, "Proceso sólido", especialización en
Ejecución) son los mismos del screenshot de la landing, y el radar usa la
matemática exacta de `src/components/assessment/CompetencyRadar.tsx`.

## Cómo re-renderizar

Requiere Node 22+, Playwright con Chromium, y las deps locales:

```bash
npm install            # @ffmpeg-installer/ffmpeg (+ fuentes ya copiadas en assets/)

# stills de control en cualquier timestamp (ms)
node render.mjs stills 7800,25600,34000

# render completo (3 workers en paralelo, ~15 min en 4 cores)
node render_par.mjs video_silent.mp4 60 2 3

# sound design (whooshes, clicks, chime) y mux final
node mkaudio.mjs
ffmpeg -i video_silent.mp4 -i mix.wav -c:v copy -c:a aac -b:a 192k -shortest promo-evaluaciones.mp4
```

`index.html` expone `window.seek(ms)`: toda la animación es una función pura
del tiempo, así que el render es determinístico. Abriéndolo en un navegador
con `?play` se previsualiza en loop.

## Para editar

- **Copy / textos**: buscar en `index.html` (data `TYPES`, `BQ`, captions `CAPS`).
- **Timing**: objeto `T` (ms) en `index.html`.
- **Cámara**: keyframes en `camAt()`. **Cursor**: `CURSOR_KEYS()`.
- **Audio**: eventos y volúmenes en `mkaudio.mjs`.

Fuentes Inter y Caveat (SIL OFL, via @fontsource) y logo en `assets/`.
