import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ASSESSMENT_TYPES, type AssessmentTypeKey } from '@/utils/scoring';

// Este hook ya no usa el precio de lista para nada: el MRR sale de montos
// efectivamente cobrados y, cuando falta el dato, de LEGACY_MONTHLY_PRICES.
// Por eso acá no hay copia de los precios actuales — vivían en un FALLBACK_PRICES
// que había que mantener en sync a mano y que, valuando suscripciones viejas al
// precio nuevo, inflaba el MRR. Los precios de lista quedan en dos lugares:
// src/hooks/usePricing.ts y supabase/functions/pricing-config/index.ts.

// Precio con el que se valúa una suscripción activa que no tiene paid_amount
// (pesos, no centavos). NO es el precio de lista: es el precio viejo.
//
// paid_amount lo escribe el webhook en order_created, así que una fila sin ese
// dato es necesariamente vieja — de antes de que lo guardáramos, o de una orden
// cuyo evento se perdió. Esos suscriptores están grandfathered: LemonSqueezy
// clava cada suscripción a su price_id del alta y no la mueve cuando cambia el
// precio de la variante, así que siguen pagando lo viejo aunque el checkout hoy
// cobre $150.000 / $280.000.
//
// Valuarlos al precio de lista actual inflaba el MRR (en agosto de 2026, 3
// suscripciones Premium contadas a $150.000 en vez de $50.000: $300.000 de más).
const LEGACY_MONTHLY_PRICES = {
  premium: 50000,
  repremium: 120000,
};

const PAGE_SIZE = 1000;

// Supabase caps queries at 1000 rows; fetch in pages so results are never truncated
async function fetchAllRows<T>(
  makeQuery: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await makeQuery(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
    from += PAGE_SIZE;
  }
  return rows;
}

interface PlanBreakdown {
  paid: number;
  comped: number;
  mrr: number; // MRR contribution from this plan
}

interface AdminAnalytics {
  totalUsers: number;
  totalAssessments: number;
  assessmentsToday: number;
  assessmentsThisWeek: number;
  assessmentsThisMonth: number;
  premiumPaidUsers: number;
  premiumCompedUsers: number;
  conversionRate: number;
  mrr: number;
  ltv: number;
  arpu: number;
  averageAssessmentScore: number;
  // User growth (current month)
  newUsersThisMonth: number;
  peakDay: { count: number; date: string | null };
  peakAssessmentDay: { count: number; date: string | null };
  monthName: string;
  daysElapsedInMonth: number;
  // Top skill gaps (all-time, top 3)
  topSkillGaps: Array<{ skill: string; count: number; percentage: number }>;
  assessmentsByType: { key: AssessmentTypeKey | 'legacy'; count: number }[];
  subscriptionsByPlan: {
    premium: PlanBreakdown;
    repremium: PlanBreakdown;
    curso_estrategia: { paid: number };
    cursos_all: { paid: number };
    productprepa_business: { paid: number };
    productastic_review: { paid: number };
  };
  pricingSource: 'lemonsqueezy' | 'fallback' | 'real';
}

export function useAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const daysElapsedInMonth = now.getDate();
      const monthName = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
      const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      const [
        pricingResponse,
        totalUsersResponse,
        totalAssessmentsResponse,
        assessmentsTodayResponse,
        assessmentsThisWeekResponse,
        assessmentsThisMonthResponse,
        monthUsers,
        monthAssessments,
        assessmentResults,
        subscriptionsData,
      ] = await Promise.all([
        supabase.functions.invoke('pricing-config'),
        // Server-side counts: exact and never truncated at 1000 rows
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('assessments').select('id', { count: 'exact', head: true }),
        supabase.from('assessments').select('id', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabase.from('assessments').select('id', { count: 'exact', head: true }).gte('created_at', weekAgo.toISOString()),
        supabase.from('assessments').select('id', { count: 'exact', head: true }).gte('created_at', monthStart.toISOString()),
        // Paginated reads need a deterministic order; unordered .range() can skip/duplicate rows across pages
        fetchAllRows<{ created_at: string }>((from, to) =>
          supabase.from('profiles').select('created_at').gte('created_at', monthStart.toISOString()).order('id', { ascending: true }).range(from, to)
        ),
        fetchAllRows<{ created_at: string }>((from, to) =>
          supabase.from('assessments').select('created_at').gte('created_at', monthStart.toISOString()).order('id', { ascending: true }).range(from, to)
        ),
        fetchAllRows<{ assessment_result: unknown; assessment_type: AssessmentTypeKey | null }>((from, to) =>
          supabase.from('assessments').select('assessment_result, assessment_type').order('id', { ascending: true }).range(from, to)
        ),
        fetchAllRows<{ plan: string; status: string; user_id: string; is_comped: boolean | null; paid_amount: number | null }>((from, to) =>
          supabase.from('user_subscriptions').select('plan, status, user_id, is_comped, paid_amount').order('id', { ascending: true }).range(from, to)
        ),
      ]);

      if (totalUsersResponse.error) throw totalUsersResponse.error;
      if (totalAssessmentsResponse.error) throw totalAssessmentsResponse.error;
      if (assessmentsTodayResponse.error) throw assessmentsTodayResponse.error;
      if (assessmentsThisWeekResponse.error) throw assessmentsThisWeekResponse.error;
      if (assessmentsThisMonthResponse.error) throw assessmentsThisMonthResponse.error;

      const totalUsers = totalUsersResponse.count ?? 0;
      const totalAssessments = totalAssessmentsResponse.count ?? 0;
      const assessmentsToday = assessmentsTodayResponse.count ?? 0;
      const assessmentsThisWeek = assessmentsThisWeekResponse.count ?? 0;
      const assessmentsThisMonth = assessmentsThisMonthResponse.count ?? 0;

      // Extract pricing data
      // Sólo se usa para el badge de origen de precios: el MRR se calcula con
      // montos cobrados y, cuando faltan, con LEGACY_MONTHLY_PRICES.
      const pricingData = pricingResponse.data;

      // Count subscriptions by plan with detailed breakdown
      const subscriptionsByPlan = {
        premium: { paid: 0, comped: 0, mrr: 0 },
        repremium: { paid: 0, comped: 0, mrr: 0 },
        curso_estrategia: { paid: 0 },
        cursos_all: { paid: 0 },
        productprepa_business: { paid: 0 },
        productastic_review: { paid: 0 },
      };

      let totalMrr = 0;
      let totalPaidRecurrentUsers = 0;
      // Suscripciones valuadas con un precio estimado en vez del monto cobrado.
      let estimatedSubscriptions = 0;

      subscriptionsData.forEach(sub => {
        if (sub?.status !== 'active' || sub?.plan === 'free') return;

        const plan = sub.plan as keyof typeof subscriptionsByPlan;
        const isComped = sub.is_comped === true;

        switch (plan) {
          case 'premium':
            if (isComped) {
              subscriptionsByPlan.premium.comped++;
            } else {
              subscriptionsByPlan.premium.paid++;
              // Monto real cobrado; sin él, el precio viejo (ver
              // LEGACY_MONTHLY_PRICES), nunca el de lista actual.
              //
              // != null y no truthiness: un paid_amount de 0 es un dato real
              // (cupón del 100%), no un dato faltante. Con `sub.paid_amount ?`
              // esa fila se valuaba al precio viejo e inflaba el MRR, además de
              // contarse como estimada cuando en realidad tiene monto.
              const monthlyPrice = sub.paid_amount != null
                ? sub.paid_amount / 100
                : LEGACY_MONTHLY_PRICES.premium;
              if (sub.paid_amount == null) estimatedSubscriptions++;
              subscriptionsByPlan.premium.mrr += monthlyPrice;
              totalMrr += monthlyPrice;
              totalPaidRecurrentUsers++;
            }
            break;
          case 'repremium':
            if (isComped) {
              subscriptionsByPlan.repremium.comped++;
            } else {
              subscriptionsByPlan.repremium.paid++;
              const monthlyPrice = sub.paid_amount != null
                ? sub.paid_amount / 100
                : LEGACY_MONTHLY_PRICES.repremium;
              if (sub.paid_amount == null) estimatedSubscriptions++;
              subscriptionsByPlan.repremium.mrr += monthlyPrice;
              totalMrr += monthlyPrice;
              totalPaidRecurrentUsers++;
            }
            break;
          case 'curso_estrategia':
            // One-time purchase, no MRR contribution
            if (!isComped) {
              subscriptionsByPlan.curso_estrategia.paid++;
            }
            break;
          case 'cursos_all':
            if (!isComped) {
              subscriptionsByPlan.cursos_all.paid++;
            }
            break;
          case 'productprepa_business':
            if (!isComped) {
              subscriptionsByPlan.productprepa_business.paid++;
            }
            break;
          case 'productastic_review':
            if (!isComped) {
              subscriptionsByPlan.productastic_review.paid++;
            }
            break;
        }
      });

      // Total premium users (all plans except free) — used for conversion
      const premiumUsers = subscriptionsByPlan.premium.paid + subscriptionsByPlan.premium.comped +
                          subscriptionsByPlan.repremium.paid + subscriptionsByPlan.repremium.comped +
                          subscriptionsByPlan.curso_estrategia.paid +
                          subscriptionsByPlan.cursos_all.paid +
                          subscriptionsByPlan.productprepa_business.paid +
                          subscriptionsByPlan.productastic_review.paid;

      // Premium paid = only recurrent paying subscribers (for conversion metrics)
      const premiumPaidUsers = subscriptionsByPlan.premium.paid + subscriptionsByPlan.repremium.paid;
      const premiumCompedUsers = subscriptionsByPlan.premium.comped + subscriptionsByPlan.repremium.comped;

      // Calculate financial metrics
      const mrr = totalMrr;
      // ARPU = Average Revenue Per (Paying) User - only divide by users who actually pay for recurrent plans
      const arpu = totalPaidRecurrentUsers > 0 ? mrr / totalPaidRecurrentUsers : 0;

      // LTV = Total historical revenue / unique paying users
      // Sum all paid_amount from ALL subscriptions (active + inactive + cancelled)
      const allPaidAmounts = subscriptionsData.filter(s => s?.paid_amount && s.paid_amount > 0);
      const totalHistoricalRevenue = allPaidAmounts.reduce((sum, s) => sum + (s.paid_amount! / 100), 0);
      const uniquePayingUsers = new Set(allPaidAmounts.map(s => s.user_id)).size;
      const ltv = uniquePayingUsers > 0 ? totalHistoricalRevenue / uniquePayingUsers : 0;

      // New users this month + peak registration day
      const newUsersThisMonth = monthUsers.length;
      const usersByDay = new Map<string, number>();
      monthUsers.forEach(u => {
        if (u?.created_at) {
          const dateStr = new Date(u.created_at).toISOString().split('T')[0];
          usersByDay.set(dateStr, (usersByDay.get(dateStr) || 0) + 1);
        }
      });
      const peakDayData = Array.from(usersByDay.entries())
        .reduce((max, [date, count]) => count > max.count ? { date, count } : max,
                { date: null as string | null, count: 0 });
      const peakDay = { count: peakDayData.count, date: peakDayData.date };

      // Peak assessment day (current month)
      const assessmentsByDay = new Map<string, number>();
      monthAssessments.forEach(a => {
        if (a?.created_at) {
          const dateStr = new Date(a.created_at).toISOString().split('T')[0];
          assessmentsByDay.set(dateStr, (assessmentsByDay.get(dateStr) || 0) + 1);
        }
      });
      const peakAssessmentDayData = Array.from(assessmentsByDay.entries())
        .reduce((max, [date, count]) => count > max.count ? { date, count } : max,
                { date: null as string | null, count: 0 });
      const peakAssessmentDay = { count: peakAssessmentDayData.count, date: peakAssessmentDayData.date };

      // Average score + skill gaps from assessment results
      const skillGapCounts = new Map<string, number>();
      const assessmentTypeKeys: ReadonlyArray<AssessmentTypeKey | 'legacy'> = [
        ...ASSESSMENT_TYPES.map(t => t.key),
        'legacy',
      ];
      const assessmentTypeCounts = Object.fromEntries(
        assessmentTypeKeys.map(key => [key, 0])
      ) as Record<AssessmentTypeKey | 'legacy', number>;
      let totalScores = 0;
      let totalScoreCount = 0;

      assessmentResults.forEach(assessment => {
        assessmentTypeCounts[assessment.assessment_type ?? 'legacy']++;
        try {
          const result = assessment.assessment_result as any;

          if (result?.gaps && Array.isArray(result.gaps)) {
            result.gaps.forEach((gap: any) => {
              const domainKey = gap?.domain || gap?.skill || gap?.area || gap?.key;
              if (domainKey && typeof domainKey === 'string') {
                skillGapCounts.set(domainKey, (skillGapCounts.get(domainKey) || 0) + 1);
              }
            });
          }

          if (result && typeof result.promedioGlobal === 'number') {
            totalScores += result.promedioGlobal;
            totalScoreCount++;
          }
        } catch (e) {
          // Skip invalid assessments
        }
      });

      const topSkillGaps = Array.from(skillGapCounts.entries())
        .map(([skill, count]) => ({
          skill,
          count,
          percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 3);

      const assessmentsByType = assessmentTypeKeys.map(key => ({ key, count: assessmentTypeCounts[key] }));

      const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
      const averageAssessmentScore = totalScoreCount > 0 ? totalScores / totalScoreCount : 0;

      // Determine pricing source
      // "real" sólo si el MRR salió entero de montos efectivamente cobrados.
      // Con una sola suscripción estimada el número ya es una aproximación, y el
      // badge del dashboard no debería decir lo contrario.
      const pricingSourceValue: 'lemonsqueezy' | 'fallback' | 'real' =
        totalPaidRecurrentUsers > 0 && estimatedSubscriptions === 0
          ? 'real'
          : (pricingData?.source === 'lemonsqueezy' ? 'lemonsqueezy' : 'fallback');

      const analyticsData: AdminAnalytics = {
        totalUsers,
        totalAssessments,
        assessmentsToday,
        assessmentsThisWeek,
        assessmentsThisMonth,
        premiumPaidUsers,
        premiumCompedUsers,
        conversionRate,
        mrr,
        ltv,
        arpu,
        averageAssessmentScore,
        newUsersThisMonth,
        peakDay,
        peakAssessmentDay,
        monthName: formattedMonthName,
        daysElapsedInMonth,
        topSkillGaps,
        assessmentsByType,
        subscriptionsByPlan,
        pricingSource: pricingSourceValue,
      };

      setAnalytics(analyticsData);
      setLastUpdated(new Date());
    } catch (err) {
      setError('Error cargando analíticas');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const refetch = () => fetchAnalytics(true);

  return { analytics, loading, error, refreshing, refetch, lastUpdated };
}
