/**
 * Qué planes existen y qué habilita cada uno. Fuente única: useSubscription
 * repetía estas mismas listas inline, así que agregar un plan obligaba a
 * acordarse de los dos lugares — y olvidarse de uno no rompe el build, sólo
 * deja al plan nuevo sin acceso.
 *
 * El acceso a cursos no vive acá: es por curso, no por plan (cursos_all y
 * repremium abren todo, curso_estrategia sólo el suyo, y los cursos free se
 * abren a cualquier autenticado). Esa regla es de useCourseAccess.
 */

// Planes con acceso a funcionalidades premium (mentoría, career path, recursos premium)
export const PREMIUM_PLANS = ['premium', 'repremium'] as const;

// Todos los planes de pago (para edge functions y verificaciones de acceso a recursos)
export const ALL_PAID_PLANS = ['premium', 'repremium', 'curso_estrategia', 'cursos_all', 'productprepa_business', 'productastic_review'] as const;

/** Todo plan posible en user_subscriptions.plan, incluido el estado sin pagar. */
export type SubscriptionPlan = 'free' | (typeof ALL_PAID_PLANS)[number];

// Helpers
export const isPremiumPlan = (plan?: string): boolean =>
  PREMIUM_PLANS.includes(plan as typeof PREMIUM_PLANS[number]);

export const isPaidPlan = (plan?: string): boolean =>
  ALL_PAID_PLANS.includes(plan as typeof ALL_PAID_PLANS[number]);

// Helper para obtener badge info por plan
export const getPlanBadgeInfo = (plan?: string): { 
  variant: 'default' | 'secondary' | 'outline' | 'destructive'; 
  label: string; 
  className: string;
} => {
  switch (plan) {
    case 'premium':
      return { 
        variant: 'default', 
        label: 'Premium', 
        className: 'bg-amber-500/20 text-amber-600 border-amber-500/30' 
      };
    case 'repremium':
      return { 
        variant: 'outline', 
        label: 'RePremium', 
        className: 'bg-purple-500/20 text-purple-600 border-purple-500/30' 
      };
    case 'curso_estrategia':
      return { 
        variant: 'outline', 
        label: 'Curso', 
        className: 'bg-blue-500/20 text-blue-600 border-blue-500/30' 
      };
    case 'cursos_all':
      return {
        variant: 'outline',
        label: 'Cursos All',
        className: 'bg-cyan-500/20 text-cyan-600 border-cyan-500/30'
      };
    case 'productprepa_business':
      return {
        variant: 'outline',
        label: 'PP Business',
        className: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30'
      };
    case 'productastic_review':
      return {
        variant: 'outline',
        label: 'Review',
        className: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30'
      };
    default:
      return { 
        variant: 'secondary', 
        label: 'Free', 
        className: '' 
      };
  }
};
