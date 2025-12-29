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
  };
  lastUpdated: string;
  source: string;
}

// Fallback prices if API fails
const FALLBACK_PRICES = {
  premium: { amount: 50000, formatted: '$ 50.000', currency: 'ARS' },
  repremium: { amount: 1999, formatted: 'USD 19,99', currency: 'USD' },
  curso_estrategia: { amount: 49, formatted: 'USD 49', currency: 'USD' },
  cursos_all: { amount: 99, formatted: 'USD 99', currency: 'USD' },
};

export function usePricing() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<PricingData>('pricing-config');
      
      if (error) {
        console.error('Error fetching pricing:', error);
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

  return {
    premium: data?.plans?.premium ?? FALLBACK_PRICES.premium,
    repremium: data?.plans?.repremium ?? FALLBACK_PRICES.repremium,
    curso_estrategia: data?.plans?.curso_estrategia ?? FALLBACK_PRICES.curso_estrategia,
    cursos_all: data?.plans?.cursos_all ?? FALLBACK_PRICES.cursos_all,
    loading: isLoading,
    error
  };
}
