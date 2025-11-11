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

  return {
    amount: data?.amount ?? (() => {
      console.warn('[Pricing] Using fallback value: 50000 ARS');
      console.warn('[Pricing] API error:', error);
      return 50000;
    })(),
    currency: data?.currency ?? 'ARS',
    formatted: data?.formatted ?? (() => {
      console.warn('[Pricing] Using fallback formatted: "$ 50.000"');
      return '$ 50.000';
    })(),
    loading: isLoading,
    error
  };
}
