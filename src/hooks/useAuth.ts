import { AuthState } from '@/types/user';

// Hook placeholder para autenticación - retorna valores mock por ahora
export function useAuth(): AuthState {
  return {
    user: null,
    subscription: null, 
    isLoading: false,
    isAuthenticated: false,
  };
}

export function useSubscription() {
  const { subscription } = useAuth();
  
  return {
    subscription,
    hasActivePremium: subscription?.status === 'active' && subscription?.plan === 'premium',
    isTrialing: subscription?.trialEnd ? new Date() < subscription.trialEnd : false,
  };
}