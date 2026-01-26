

## Plan: Card de Curso con Imagen Completa Arriba

### Problema Actual

La card del curso "Estrategia de Producto" en `/cursos-info` tiene un layout de 2 columnas donde:
- La imagen está a la izquierda con `aspect-video md:aspect-auto` y `object-cover`
- Esto causa que la imagen se corte para llenar el espacio disponible

### Solución

Cambiar el layout de la card del curso destacado para que muestre:
1. **Arriba**: La imagen completa sin recortar
2. **Abajo**: Toda la información del curso (badges, título, descripción, features, precio, CTAs)

---

### Cambios en `src/pages/CursosInfo.tsx`

#### Modificar la sección Featured Course (líneas 125-208)

**De**:
```jsx
<div className="grid md:grid-cols-2 gap-6">
  {/* Course Image */}
  <div className="relative aspect-video md:aspect-auto overflow-hidden">
    <img ... className="w-full h-full object-cover" />
  </div>
  {/* Course Details */}
  <div className="p-6 md:py-8">
    ...
  </div>
</div>
```

**A**:
```jsx
<div className="flex flex-col">
  {/* Course Image - Full width, no cropping */}
  <div className="relative w-full">
    <img 
      src="..."
      alt="Curso Estrategia de Producto para principiantes"
      className="w-full h-auto object-contain rounded-t-lg"
    />
    <div className="absolute bottom-4 left-4">
      <Badge variant="nuevo">
        <Calendar className="w-3 h-3 mr-1" />
        Lanza 31 de enero
      </Badge>
    </div>
  </div>

  {/* Course Details - Below image */}
  <div className="p-6">
    {/* ... badges, título, descripción, features, precio, CTA ... */}
  </div>
</div>
```

### Detalles técnicos

| Propiedad | Antes | Después |
|-----------|-------|---------|
| Layout | `grid md:grid-cols-2` | `flex flex-col` |
| Imagen contenedor | `aspect-video md:aspect-auto overflow-hidden` | `relative w-full` |
| Imagen estilo | `object-cover` (recorta) | `object-contain` o `h-auto` (muestra completa) |
| Content padding | `p-6 md:py-8` | `p-6` (consistente) |

### Beneficios

1. **Imagen completa visible**: Sin recorte ni distorsión
2. **Mejor jerarquía visual**: La imagen como hero, contenido debajo
3. **Responsive natural**: La imagen escala proporcionalmente en todos los dispositivos
4. **Consistencia mobile/desktop**: Mismo layout en todas las pantallas

