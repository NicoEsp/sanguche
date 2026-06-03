export interface UserProfile {
  id: string;
  name: string | null;
  user_id: string;
  created_at: string;
  mentoria_completed: boolean;
  is_founder?: boolean;
  email?: string;
  subscription?: {
    plan: string;
    status: string;
  };
  role?: string;
  hasOptionalAnswers?: boolean;
}

export interface UpgradeModalTarget {
  id: string;
  name: string | null;
  email: string | null;
  currentPlan: string;
}

export interface DeleteDialogTarget {
  id: string;
  name: string | null;
  email: string | null;
}

export const ITEMS_PER_PAGE = 20;

export const PLAN_FILTER_OPTIONS = [
  { value: 'all', label: 'Todos los planes' },
  { value: 'free', label: 'Gratuito' },
  { value: 'premium', label: 'Premium' },
  { value: 'repremium', label: 'RePremium' },
  { value: 'curso_estrategia', label: 'Curso Estrategia' },
  { value: 'cursos_all', label: 'Cursos All' },
] as const;
