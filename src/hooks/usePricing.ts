import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
// Los precios de respaldo viven en constants/planesContent porque el build
// también los necesita y no puede importar este módulo (arrastra el cliente de
// Supabase, que toca localStorage al importarse).
import { FALLBACK_PRICES, type PlanPricing } from '@/constants/planesContent';

interface PlanCounts {
  premium: number | null;
  repremium: number | null;
}

interface PricingData {
  planCounts?: PlanCounts;
  plans: {
    premium: PlanPricing;
    repremium: PlanPricing;
    curso_estrategia: PlanPricing;
    cursos_all: PlanPricing;
    productprepa_business: PlanPricing;
  };
  lastUpdated: string;
  source: string;
}

/**
 * Precios vigentes de todos los planes, más cuánta gente pasó por cada uno.
 * Si la API falla devuelve los valores de respaldo, así la página nunca queda
 * sin precio; `loading` distingue "todavía no llegó" de "no se pudo".
 */
export function usePricing() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<PricingData>('pricing-config');
      
      if (error) {
        if (import.meta.env.DEV) console.error('Error fetching pricing:', error);
        throw error;
      }
      
      return data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2
  });

  if (!data && import.meta.env.DEV && error) {
    console.warn('[Pricing] Using fallback values due to API error');
  }

  const premium = data?.plans?.premium ?? FALLBACK_PRICES.premium;
  const repremium = data?.plans?.repremium ?? FALLBACK_PRICES.repremium;
  const curso_estrategia = data?.plans?.curso_estrategia ?? FALLBACK_PRICES.curso_estrategia;
  const cursos_all = data?.plans?.cursos_all ?? FALLBACK_PRICES.cursos_all;
  const productprepa_business = data?.plans?.productprepa_business ?? FALLBACK_PRICES.productprepa_business;

  // Sin conteo no hay badge: preferimos no mostrar prueba social antes que mostrarla inventada.
  const planCounts: PlanCounts = data?.planCounts ?? { premium: null, repremium: null };

  // Monto por slug de plan (en centavos ARS). Fuente única para checkout/analytics:
  // evita hardcodear precios y mantenerlos en sync con LemonSqueezy.
  const pricesByPlan: Record<string, number> = {
    premium: premium.amount,
    repremium: repremium.amount,
    curso_estrategia: curso_estrategia.amount,
    cursos_all: cursos_all.amount,
    productprepa_business: productprepa_business.amount,
  };

  return {
    premium,
    repremium,
    curso_estrategia,
    cursos_all,
    productprepa_business,
    planCounts,
    pricesByPlan,
    loading: isLoading,
    error
  };
}
