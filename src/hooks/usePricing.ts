import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PlanPricing {
  amount: number;
  formatted: string;
  currency: string;
}

interface PricingData {
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

// Fallback prices if API fails (all in ARS)
const FALLBACK_PRICES = {
  premium: { amount: 5000000, formatted: '$ 50.000', currency: 'ARS' },
  repremium: { amount: 12000000, formatted: '$ 120.000', currency: 'ARS' },
  curso_estrategia: { amount: 4900000, formatted: '$ 49.000', currency: 'ARS' },
  cursos_all: { amount: 7500000, formatted: '$ 75.000', currency: 'ARS' },
  productprepa_business: { amount: 0, formatted: '$ 0', currency: 'ARS' },
};

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
    pricesByPlan,
    loading: isLoading,
    error
  };
}
