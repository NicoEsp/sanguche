

# Nueva pagina /soy-dev - Producto para Desarrolladores

## Resumen

Crear una pagina dedicada a desarrolladores de software que explique por que aprender sobre Producto es clave en el contexto actual. Ademas, agregar un boton de acceso en el Hero de la landing principal.

---

## Cambios

### 1. Nuevo archivo: `src/pages/SoyDev.tsx`

Pagina completa con las siguientes secciones:

**Hero**: Titulo impactante ("Sos Dev. Aprender Producto es tu superpoder. Es el momento") con badge "Para Devs" y subtitulo que conecte con la realidad del desarrollador actual.

**Seccion "Por que Producto importa para Devs"**: 3-4 cards con argumentos clave:
- **El contexto actual**: Con AI generando codigo, el diferencial ya no es solo saber programar sino entender *que* construir y *por que*. Los devs que entienden producto son los que lideran.
- **Mejor comunicacion con PMs y stakeholders**: Hablar el mismo idioma que el negocio acelera tu carrera y reduce fricciones.
- **De ejecutor a estratega**: Pasar de recibir tickets a influir en la direccion del producto. Los devs con mentalidad de producto son los mas valorados.
- **Emprendimiento y side-projects**: Si queres lanzar tu propio producto, necesitas saber priorizacion, discovery y validacion, no solo codigo.

**Seccion "Que vas a descubrir"**: Lista de beneficios concretos que obtiene un dev al usar ProductPrepa:
- Evaluar sus habilidades de producto actuales (autoevaluacion)
- Identificar gaps especificos para su perfil
- Acceder a recursos curados pensados para perfiles tecnicos
- Tener un roadmap claro de crecimiento en producto

**Seccion "Datos del mercado"**: Estadisticas/frases que refuercen la importancia:
- "El 70% de startups fracasan por problemas de producto, no de tecnologia"
- "Los equipos mas exitosos tienen devs que piensan como PMs"
- Mencion al impacto de AI en el rol del developer

**CTA final**: Boton para comenzar la autoevaluacion gratuita + boton secundario que dirige a la página de Planes.

**SEO**: Tags optimizados para "desarrolladores producto", "devs product management", etc.

### 2. Modificacion: `src/pages/Index.tsx`

Agregar un boton debajo del CTA principal "Comenzar evaluacion gratis" en el Hero:

```tsx
<Button asChild variant="ghost" size="sm" className="mt-3 text-muted-foreground hover:text-primary">
  <Link to="/soy-dev">
    Soy Dev, que hago?
    <Code className="ml-2 h-4 w-4" />
  </Link>
</Button>
```

Se usa `variant="ghost"` y tamano small para que sea secundario al CTA principal sin competir visualmente.

### 3. Modificacion: `src/App.tsx`

Agregar la ruta `/soy-dev` como pagina publica (sin ProtectedRoute) dentro del AppLayout, junto a las demas rutas publicas como `/planes`, `/starterpack`, etc.

```tsx
const SoyDev = lazy(() => import("./pages/SoyDev"));
// ...
<Route path="/soy-dev" element={<SoyDev />} />
```

---

## Estilos y patrones

- Se reutilizan los componentes existentes: `Card`, `Badge`, `Button`, `Seo`
- Se siguen los patrones de layout de paginas como StarterPackHome y la landing (secciones con `container`, padding responsive, etc.)
- Iconos de `lucide-react` consistentes con el resto del producto (Code, Lightbulb, Rocket, Target, etc.)
- Animacion `animate-fade-in` como en otras paginas
- Gradientes sutiles consistentes con el design system (primary/5, secondary/5)
- Breadcrumb de navegacion con link a Inicio

## Archivos afectados

| Archivo | Accion |
|---------|--------|
| `src/pages/SoyDev.tsx` | Crear |
| `src/pages/Index.tsx` | Agregar boton en Hero |
| `src/App.tsx` | Agregar ruta /soy-dev |

