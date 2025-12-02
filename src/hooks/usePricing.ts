import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface PricingData {
  currency: string;
  amount: number;
  formatted: string;
  lastUpdated: string;
}

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
    staleTime: 60000, // 1 minute
    refetchOnWindowFocus: true,
    retry: 2
  });

  // Fallback values for when API fails
  const fallbackAmount = 50000;
  const fallbackFormatted = '$ 50.000';

  if (!data && import.meta.env.DEV && error) {
    console.warn('[Pricing] Using fallback values due to API error');
  }

  return {
    amount: data?.amount ?? fallbackAmount,
    currency: data?.currency ?? 'ARS',
    formatted: data?.formatted ?? fallbackFormatted,
    loading: isLoading,
    error
  };
}
