// Tipos para usuario y suscripción - placeholder para futuras integraciones
export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: Date;
}

export interface Subscription {
  id: string;
  userId: string;
  plan: 'free' | 'premium';
  status: 'active' | 'inactive' | 'cancelled';
  currentPeriodEnd?: Date;
  trialEnd?: Date;
}

export interface AuthState {
  user: User | null;
  subscription: Subscription | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}