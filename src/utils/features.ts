// Sistema de feature flags para funcionalidades freemium
import { hasTemporaryAccess } from './storage';
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

// Por ahora mock - luego se conectará con auth real
export function isFeatureAvailable(feature: Feature): boolean {
  // Usuario mock sin suscripción premium
  const hasSubscription = false;
  
  if (FREE_FEATURES.includes(feature)) {
    return true;
  }
  
  if (PREMIUM_FEATURES.includes(feature)) {
    // Verificar si tiene acceso temporal por compartir
    if (feature === FEATURES.RECOMMENDATIONS) {
      if (hasTemporaryAccess()) {
        return true;
      }
    }
    
    return hasSubscription;
  }
  
  return false;
}

export function isPremiumFeature(feature: Feature): boolean {
  return PREMIUM_FEATURES.includes(feature);
}