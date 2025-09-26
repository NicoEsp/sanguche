// Sistema de feature flags para funcionalidades freemium
export const FEATURES = {
  ASSESSMENT: 'assessment',
  SKILL_GAPS: 'skill_gaps', 
  RECOMMENDATIONS: 'recommendations',
  PROGRESS: 'progress',
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

// Features gratuitos - siempre disponibles
const FREE_FEATURES: Feature[] = [
  FEATURES.ASSESSMENT,
  FEATURES.SKILL_GAPS,
];

// Features premium - requieren suscripción
const PREMIUM_FEATURES: Feature[] = [
  FEATURES.RECOMMENDATIONS,
  FEATURES.PROGRESS,
];

export function isFeatureAvailable(
  feature: Feature, 
  hasSubscription: boolean = false
): boolean {
  if (FREE_FEATURES.includes(feature)) {
    return true;
  }
  
  if (PREMIUM_FEATURES.includes(feature)) {
    return hasSubscription;
  }
  
  return false;
}

export function isPremiumFeature(feature: Feature): boolean {
  return PREMIUM_FEATURES.includes(feature);
}

export function isMentoriaContentAvailable(
  hasSubscription: boolean = false, 
  mentoriaCompleted: boolean = false,
  isAdmin: boolean = false
): boolean {
  // Admins can always access for testing
  if (isAdmin) {
    return true;
  }
  
  // Must have premium subscription AND have completed mentoria
  return hasSubscription && mentoriaCompleted;
}