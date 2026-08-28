// Planes que tienen acceso a funcionalidades premium (mentoría, career path, recursos premium)
export const PREMIUM_PLANS = ['premium', 'repremium'] as const;

// Ojo: el acceso a cursos y el chequeo de "plan pago" NO viven acá. Están
// re-escritos a mano en src/hooks/useCourseAccess.ts y src/hooks/useSubscription.ts.
// Existían COURSE_PLANS/ALL_PAID_PLANS + sus helpers, pero nadie los importaba nunca,
// así que se borraron. Si algún día se centraliza esa política, este es el lugar.

// Helpers
export const isPremiumPlan = (plan?: string): boolean =>
  PREMIUM_PLANS.includes(plan as typeof PREMIUM_PLANS[number]);

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
