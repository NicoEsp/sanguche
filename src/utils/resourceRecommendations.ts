import { DownloadableResource } from "@/types/downloads";
import { AnyDomainKey, AssessmentResult } from "@/utils/scoring";

/**
 * Ranking de descargables contra el resultado de una evaluación.
 *
 * La regla vieja era "mostrame todo recurso cuyo dominio caiga en el rango":
 * con un solo recurso condicionado en la base eso se traducía en la misma card
 * para todos, sin relación con lo que la persona necesita. Acá el orden lo pone
 * la necesidad: primero las brechas (en el orden ya priorizado por scoring, que
 * para builders sube los dominios críticos de su etapa), después las áreas
 * competentes y al final las fortalezas.
 */

export type RecommendationTier = "gap" | "neutral" | "strength";

export interface RecommendedResource {
  resource: DownloadableResource;
  domainKey: AnyDomainKey;
  domainLabel: string;
  domainValue: number;
  tier: RecommendationTier;
  /** Por qué le tocó este recurso, para mostrarlo abajo del título. */
  reason: string;
}

const TIER_RANK: Record<RecommendationTier, number> = {
  gap: 0,
  neutral: 1,
  strength: 2,
};

type DomainNeed = {
  key: AnyDomainKey;
  label: string;
  value: number;
  tier: RecommendationTier;
  /** Posición dentro del tier: cuanto más chico, más urgente. */
  order: number;
};

function buildNeedIndex(result: AssessmentResult): Map<string, DomainNeed> {
  const index = new Map<string, DomainNeed>();

  // Las brechas ya vienen ordenadas por prioridad desde computeSeniorityScore
  // (y para builders, con los dominios críticos de su etapa al frente), así que
  // el índice del array ES la urgencia. No lo reordenamos por puntaje.
  result.gaps.forEach((gap, i) => {
    index.set(gap.key, { key: gap.key, label: gap.label, value: gap.value, tier: "gap", order: i });
  });

  [...result.neutralAreas]
    .sort((a, b) => a.value - b.value)
    .forEach((area, i) => {
      if (index.has(area.key)) return;
      index.set(area.key, {
        key: area.key,
        label: area.label,
        value: area.value,
        tier: "neutral",
        order: i,
      });
    });

  [...result.strengths]
    .sort((a, b) => a.value - b.value)
    .forEach((strength, i) => {
      if (index.has(strength.key)) return;
      index.set(strength.key, {
        key: strength.key,
        label: strength.label,
        value: strength.value,
        tier: "strength",
        order: i,
      });
    });

  return index;
}

function buildReason(need: DomainNeed): string {
  switch (need.tier) {
    case "gap":
      return `Porque ${need.label} quedó entre tus áreas a trabajar (${need.value}/5)`;
    case "neutral":
      return `Para llevar ${need.label} al siguiente nivel (${need.value}/5)`;
    case "strength":
      return `Para profundizar en ${need.label}, una de tus fortalezas (${need.value}/5)`;
  }
}

/**
 * Ordena los recursos por afinidad con el resultado. Un recurso entra solo si
 * su dominio fue evaluado y el puntaje cae dentro del rango que definió el
 * admin: un material pensado para quien está en 1-3 no le sirve a quien ya
 * está en 5, y al revés.
 */
export function rankResourcesByAffinity(
  resources: DownloadableResource[],
  result: AssessmentResult | null,
): RecommendedResource[] {
  if (!result || !resources.length) return [];

  const needs = buildNeedIndex(result);

  const matches: Array<RecommendedResource & { need: DomainNeed }> = [];

  for (const resource of resources) {
    if (!resource.condition_domain) continue;
    const need = needs.get(resource.condition_domain);
    if (!need) continue;

    const minLevel = resource.condition_min_level ?? 1;
    const maxLevel = resource.condition_max_level ?? 5;
    if (need.value < minLevel || need.value > maxLevel) continue;

    matches.push({
      resource,
      domainKey: need.key,
      domainLabel: need.label,
      domainValue: need.value,
      tier: need.tier,
      reason: buildReason(need),
      need,
    });
  }

  matches.sort((a, b) => {
    const byTier = TIER_RANK[a.tier] - TIER_RANK[b.tier];
    if (byTier !== 0) return byTier;
    if (a.need.order !== b.need.order) return a.need.order - b.need.order;
    // Dentro del mismo dominio manda el rango más ajustado: un material hecho
    // para 1-2 es más específico que uno genérico de 1-5.
    const aSpan = (a.resource.condition_max_level ?? 5) - (a.resource.condition_min_level ?? 1);
    const bSpan = (b.resource.condition_max_level ?? 5) - (b.resource.condition_min_level ?? 1);
    if (aSpan !== bSpan) return aSpan - bSpan;
    if (a.resource.display_order !== b.resource.display_order) {
      return a.resource.display_order - b.resource.display_order;
    }
    return a.resource.title.localeCompare(b.resource.title);
  });

  return matches.map(({ need: _need, ...match }) => match);
}
