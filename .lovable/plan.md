
# Fix: Métricas mostrando 0 en Social Proof

## Problema
Las queries con `count: 'exact'` desde el cliente anónimo devuelven 0 porque las tablas `profiles` y `assessments` tienen RLS activado que no permite lecturas públicas.

**Datos reales en la base de datos:**
- Profiles: 462
- Assessments: 355

## Solución

Crear una **función de base de datos** que devuelva los counts, ya que las funciones SQL pueden ejecutarse con `security definer` (bypass de RLS).

### 1. Crear migración SQL

```sql
CREATE OR REPLACE FUNCTION public.get_social_proof_metrics()
RETURNS TABLE(total_users bigint, total_assessments bigint)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    (SELECT COUNT(*) FROM profiles) as total_users,
    (SELECT COUNT(*) FROM assessments) as total_assessments;
$$;

-- Permitir que usuarios anónimos llamen a esta función
GRANT EXECUTE ON FUNCTION public.get_social_proof_metrics() TO anon;
GRANT EXECUTE ON FUNCTION public.get_social_proof_metrics() TO authenticated;
```

### 2. Actualizar el hook `useSocialProofMetrics.ts`

Cambiar de queries directas a tablas a llamar la función RPC:

```typescript
export function useSocialProofMetrics() {
  return useQuery({
    queryKey: ['social-proof-metrics'],
    queryFn: async (): Promise<SocialProofMetrics> => {
      const { data, error } = await supabase.rpc('get_social_proof_metrics').single();
      
      if (error) throw error;
      
      return {
        totalUsers: data?.total_users ?? 0,
        totalAssessments: data?.total_assessments ?? 0,
      };
    },
    staleTime: 1000 * 60 * 60,
  });
}
```

## Resultado esperado
- **+450** PMs registrados (462 redondeado hacia abajo)
- **+350** evaluaciones completadas (355 redondeado hacia abajo)
- **+40 horas** de mentoría dedicadas (fijo)
