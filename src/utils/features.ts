export const FEATURES = {
  ASSESSMENT: 'assessment',
  SKILL_GAPS: 'skill_gaps', 
  RECOMMENDATIONS: 'recommendations',
  PROGRESS: 'progress',
} as const;

export type Feature = typeof FEATURES[keyof typeof FEATURES];

const FREE_FEATURES: Feature[] = [
  FEATURES.ASSESSMENT,
  FEATURES.SKILL_GAPS,
];

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

/**
 * Contenido avanzado de mentoría (recursos dedicados). Alcanza con la
 * suscripción activa: quien todavía no tuvo su primera sesión también lo ve,
 * porque antes entraba a /mentoria y no encontraba nada.
 */
export function isMentoriaAdvancedContentAvailable(
  hasSubscription: boolean = false,
  isAdmin: boolean = false
): boolean {
  if (isAdmin) {
    return true;
  }

  return hasSubscription;
}