
# Cambio en Social Proof Strip

## Modificación

**Archivo:** `src/components/landing/SocialProofStrip.tsx`

**Línea 16-19** - Reemplazar:
```tsx
<div className="flex items-center gap-2">
  <Award className="h-5 w-5 text-primary" />
  <span>Diseñado por <strong>NicoProducto</strong></span>
</div>
```

**Por:**
```tsx
<div className="flex items-center gap-2">
  <Award className="h-5 w-5 text-primary" />
  <span><strong>+40 horas</strong> de mentoría dedicadas</span>
</div>
```

## Resultado

El strip de social proof mostrará:
- **+450** PMs registrados
- **+350** evaluaciones completadas  
- **+40 horas** de mentoría dedicadas
