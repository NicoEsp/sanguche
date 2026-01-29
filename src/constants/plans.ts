// Planes que tienen acceso a funcionalidades premium (mentoría, career path, recursos premium)
export const PREMIUM_PLANS = ['premium', 'repremium'] as const;

// Planes que tienen acceso a cursos
export const COURSE_PLANS = ['curso_estrategia', 'cursos_all', 'repremium'] as const;

// Todos los planes de pago (para edge functions y verificaciones de acceso a recursos)
export const ALL_PAID_PLANS = ['premium', 'repremium', 'curso_estrategia', 'cursos_all'] as const;

// Helpers
export const isPremiumPlan = (plan?: string): boolean => 
  PREMIUM_PLANS.includes(plan as typeof PREMIUM_PLANS[number]);

export const hasCoursesAccess = (plan?: string): boolean => 
  COURSE_PLANS.includes(plan as typeof COURSE_PLANS[number]);

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
    default:
      return { 
        variant: 'secondary', 
        label: 'Free', 
        className: '' 
      };
  }
};
