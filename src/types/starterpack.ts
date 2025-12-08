export type ResourceType = 'article' | 'pdf' | 'video' | 'template' | 'checklist';
export type Audience = 'build' | 'lead' | 'both';
export type AccessType = 'public' | 'requires_account' | 'premium';
export type ResourceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface StarterPackResource {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  type: ResourceType;
  audience: Audience;
  access_type: AccessType;
  file_path: string | null;
  bucket_name: string;
  duration_estimate: string | null;
  level: ResourceLevel;
  step_order: number | null;
  display_order: number;
  is_featured: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type AccessState = 'accessible' | 'requires_login' | 'requires_premium';

export interface StepperStep {
  number: number;
  title: string;
  description: string;
  resource?: StarterPackResource;
  isAssessmentStep?: boolean;
  isPremiumStep?: boolean;
}
