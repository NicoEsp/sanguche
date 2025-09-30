import { AssessmentResult, DomainKey } from './scoring';
import { Resource } from '@/hooks/useResources';

export function shouldShowResource(
  resource: Resource,
  assessmentResult: AssessmentResult | null
): boolean {
  // Recursos públicos siempre se muestran
  if (resource.visibility_type === 'public') {
    return true;
  }

  // Recursos condicionales requieren resultado de assessment
  if (!assessmentResult || !resource.condition_domain) {
    return false;
  }

  // Buscar el valor del dominio en el assessment
  const domainKey = resource.condition_domain as DomainKey;
  const allDomains = [
    ...assessmentResult.strengths,
    ...assessmentResult.gaps,
    ...assessmentResult.neutralAreas
  ];

  const domainScore = allDomains.find(d => d.key === domainKey);
  if (!domainScore) return false;

  // Verificar si el valor está dentro del rango
  const minLevel = resource.condition_min_level || 1;
  const maxLevel = resource.condition_max_level || 5;

  return domainScore.value >= minLevel && domainScore.value <= maxLevel;
}

export function getResourceBadgeType(
  resource: Resource,
  assessmentResult: AssessmentResult | null
): 'public' | 'recommended' | null {
  if (resource.visibility_type === 'public') {
    return 'public';
  }

  if (shouldShowResource(resource, assessmentResult)) {
    return 'recommended';
  }

  return null;
}
