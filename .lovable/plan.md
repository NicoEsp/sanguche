

# Plan: Nuevo Descargable Premium "Prepárate para una Entrevista de PM"

## Resumen

Subir un nuevo recurso descargable exclusivo para usuarios Premium y RePremium. El documento es una guía de 7 páginas para preparar entrevistas de Product Manager.

**Comportamiento deseado:**
- ✅ Usuarios Premium/RePremium: pueden ver y descargar
- 🔒 Usuarios Free: ven la tarjeta bloqueada con CTA a suscribirse
- 🔒 Usuarios no logueados: ven la tarjeta bloqueada con CTA a iniciar sesión

---

## Cambios Necesarios

### 1. Base de Datos - Agregar columna `access_level`

La tabla `downloadable_resources` no tiene campo de nivel de acceso. Necesitamos agregar una columna usando el enum existente `resource_access_level` (ya existe con valores: `public`, `authenticated`, `premium`).

```sql
ALTER TABLE downloadable_resources 
ADD COLUMN access_level resource_access_level NOT NULL DEFAULT 'authenticated';
```

### 2. Subir el archivo PDF

Copiar el PDF a storage y crear el registro en la base de datos:
- **Título**: "Prepárate para una entrevista de PM"
- **Descripción**: "Guía para preparar tu narrativa profesional y destacar en entrevistas de Product Manager. Incluye frameworks para logros, liderazgo y decisiones difíciles."
- **access_level**: `premium`

### 3. Actualizar Types

Agregar `access_level` a la interfaz `DownloadableResource`:

```typescript
export interface DownloadableResource {
  // ... campos existentes
  access_level: 'public' | 'authenticated' | 'premium';
}
```

### 4. Actualizar DownloadableCard

Modificar el componente para manejar 3 estados de acceso:

| Estado | Condición | UI |
|--------|-----------|-----|
| **Accesible** | Usuario Premium/RePremium O recurso no-premium | Botones activos |
| **Requiere suscripción** | Usuario Free + recurso premium | Tarjeta bloqueada + CTA "Ver planes" |
| **Requiere login** | No autenticado | Tarjeta bloqueada + CTA "Iniciar sesión" |

**Diseño visual bloqueado:**
- Overlay semitransparente sobre la tarjeta
- Icono de candado prominente
- Badge "Premium" en la tarjeta
- CTA claro según el caso

### 5. Actualizar Admin Panel

Agregar selector de `access_level` en el formulario de creación/edición:

```tsx
<Select value={formData.access_level} ...>
  <SelectItem value="public">Público</SelectItem>
  <SelectItem value="authenticated">Solo autenticados</SelectItem>
  <SelectItem value="premium">Solo Premium</SelectItem>
</Select>
```

Mostrar badge de acceso en la tabla.

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| **DB Migration** | Agregar columna `access_level` a `downloadable_resources` |
| `src/types/downloads.ts` | Agregar campo `access_level` a la interfaz |
| `src/components/downloads/DownloadableCard.tsx` | Lógica de acceso + UI bloqueada |
| `src/pages/admin/AdminDescargables.tsx` | Selector de nivel de acceso |
| **Storage** | Copiar PDF al bucket `downloads` |

---

## Sección Técnica

### DownloadableCard - Lógica de acceso

```tsx
import { useSubscription } from '@/hooks/useSubscription';
import { isPremiumPlan } from '@/constants/plans';

export function DownloadableCard({ resource }: DownloadableCardProps) {
  const { isAuthenticated } = useAuth();
  const { subscription, loading: subLoading } = useSubscription();
  
  const isPremiumResource = resource.access_level === 'premium';
  const userHasPremium = isPremiumPlan(subscription?.plan);
  
  // Determinar estado de acceso
  const accessState = useMemo(() => {
    if (!isPremiumResource) return 'accessible';
    if (!isAuthenticated) return 'requires_login';
    if (!userHasPremium) return 'requires_subscription';
    return 'accessible';
  }, [isPremiumResource, isAuthenticated, userHasPremium]);
  
  const isLocked = accessState !== 'accessible';
  
  // ... render con estados
}
```

### DownloadableCard - UI Bloqueada

```tsx
{isLocked && (
  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center rounded-lg">
    <div className="text-center p-6">
      <Lock className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
      {accessState === 'requires_login' ? (
        <>
          <p className="font-medium mb-2">Inicia sesión para acceder</p>
          <Button onClick={() => navigate('/auth', { state: { from: { pathname: '/preguntas' } } })}>
            Iniciar sesión
          </Button>
        </>
      ) : (
        <>
          <p className="font-medium mb-2">Contenido exclusivo Premium</p>
          <p className="text-sm text-muted-foreground mb-4">
            Accede a este recurso con tu suscripción Premium o RePremium
          </p>
          <Button asChild>
            <Link to="/planes">Ver planes</Link>
          </Button>
        </>
      )}
    </div>
  </div>
)}
```

### Badge Premium en tarjeta

```tsx
{resource.access_level === 'premium' && (
  <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
    <Crown className="h-3 w-3 mr-1" />
    Premium
  </Badge>
)}
```

### Admin - FormData actualizado

```typescript
interface FormData {
  // ... campos existentes
  access_level: 'public' | 'authenticated' | 'premium';
}

const initialFormData: FormData = {
  // ... otros campos
  access_level: 'authenticated',
};
```

### Registro del nuevo recurso

```sql
INSERT INTO downloadable_resources (
  title,
  slug,
  description,
  type,
  file_path,
  bucket_name,
  access_level,
  display_order,
  is_featured,
  is_active
) VALUES (
  'Prepárate para una entrevista de PM',
  'preparate-entrevista-pm',
  'Guía para preparar tu narrativa profesional y destacar en entrevistas de Product Manager. Incluye frameworks para logros, liderazgo y decisiones difíciles.',
  'guide',
  'preparate-entrevista-pm.pdf',
  'downloads',
  'premium',
  10,
  true,
  true
);
```

---

## Resultado Final

1. **Nuevo recurso visible** en `/preguntas` con badge Premium
2. **Usuarios Premium/RePremium** pueden ver y descargar inmediatamente
3. **Usuarios Free** ven overlay bloqueado con CTA a `/planes`
4. **Usuarios no logueados** ven overlay bloqueado con CTA a `/auth`
5. **Admin** puede configurar nivel de acceso para futuros recursos

