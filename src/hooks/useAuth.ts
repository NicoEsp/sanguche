// Re-export useAuth from AuthContext
export { useAuth } from '@/contexts/AuthContext';

export function useSubscription() {
  // TODO: Implementar lógica de suscripción real cuando se conecte con Supabase
  const subscription = {
    plan: 'free' as 'free' | 'premium',
    status: 'active' as 'active' | 'inactive' | 'cancelled',
    trialEnd: null as Date | null,
  };
  
  return {
    subscription,
    hasActivePremium: subscription?.status === 'active' && subscription?.plan === 'premium',
    isTrialing: subscription?.trialEnd ? new Date() < subscription.trialEnd : false,
  };
}