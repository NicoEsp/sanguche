
## Plan: Actualizar página de Cursos Info

### Cambios a realizar en `src/pages/CursosInfo.tsx`

---

### 1. Reemplazar icono por imagen real del curso

**Ubicación:** Líneas 133-143 (sección de imagen del curso)

Cambiar el placeholder con ícono por la imagen real del curso que ven los usuarios logueados.

**De:**
```tsx
<div className="relative aspect-video md:aspect-auto bg-muted flex items-center justify-center p-6">
  <div className="text-center">
    <div className="w-24 h-24 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
      <TrendingUp className="w-12 h-12 text-primary" />
    </div>
    <Badge variant="nuevo" className="mb-2">
      <Calendar className="w-3 h-3 mr-1" />
      Lanza 31 de enero
    </Badge>
  </div>
</div>
```

**A:**
```tsx
<div className="relative aspect-video md:aspect-auto overflow-hidden">
  <img 
    src="https://lgscevufwnetegglgpnw.supabase.co/storage/v1/object/public/course-thumbnails/estrategia-de-producto-para-principiantes-1768839792745.jpeg"
    alt="Curso Estrategia de Producto para principiantes"
    className="w-full h-full object-cover"
  />
  <div className="absolute bottom-4 left-4">
    <Badge variant="nuevo">
      <Calendar className="w-3 h-3 mr-1" />
      Lanza 31 de enero
    </Badge>
  </div>
</div>
```

---

### 2. Agregar "Las Seis Dimensiones" a la lista de contenidos

**Ubicación:** Líneas 168-173

**De:**
```tsx
{[
  "Fundamentos de estrategia de producto",
  "Frameworks esenciales para empezar",
  "Cómo alinear producto con negocio",
  "Ejercicios prácticos aplicables",
].map((item, index) => (
```

**A:**
```tsx
{[
  "Fundamentos de Estrategia de Producto",
  "Las Seis Dimensiones",
  "Frameworks esenciales para empezar",
  "Cómo alinear producto con negocio",
  "Ejercicios prácticos aplicables",
].map((item, index) => (
```

---

### 3. Agregar indicador de precio de pre-lanzamiento

**Ubicación:** Líneas 182-188 (sección de precio)

**De:**
```tsx
<div className="flex items-center justify-between">
  <div>
    <span className="text-2xl font-bold">
      {pricingLoading ? "..." : curso_estrategia.formatted}
    </span>
    <span className="text-sm text-muted-foreground ml-1">pago único</span>
  </div>
```

**A:**
```tsx
<div className="flex items-center justify-between">
  <div>
    <div className="flex items-center gap-2">
      <span className="text-2xl font-bold">
        {pricingLoading ? "..." : curso_estrategia.formatted}
      </span>
      <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800">
        Precio pre-lanzamiento
      </Badge>
    </div>
    <span className="text-sm text-muted-foreground">pago único</span>
  </div>
```

---

### Resumen de cambios

| Elemento | Antes | Después |
|----------|-------|---------|
| Imagen del curso | Ícono placeholder (TrendingUp) | Imagen real del thumbnail |
| Lista de contenidos | 4 items | 5 items (+ Las Seis Dimensiones) |
| Capitalización "estrategia" | "estrategia de producto" | "Estrategia de Producto" |
| Indicador de precio | Solo precio | Precio + badge "Precio pre-lanzamiento" |
