import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AdminAnalytics {
  totalUsers: number;
  activeUsers: number;
  totalAssessments: number;
  assessmentsToday: number;
  assessmentsThisWeek: number;
  premiumUsers: number;
  userGrowth: Array<{ date: string; count: number }>;
  skillGapDistribution: Array<{ 
    skill: string; 
    count: number;
    percentage: number;
    avgCurrentLevel: number;
    avgTargetLevel: number;
  }>;
  conversionRate: number;
  mrr: number;
  arr: number;
  arpu: number;
  averageAssessmentScore: number;
  recentActivePeriod: string;
  scoreDistribution: Array<{ range: string; count: number; percentage: number }>;
  reEvaluationRate: number;
  avgScoreFree: number;
  avgScorePremium: number;
  usersWithOptionalAnswers: number;
}

export function useAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAnalytics = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

        const { data: usersData, error: usersError } = await supabase
          .from('profiles')
          .select('id, created_at, user_id');

        if (usersError) throw usersError;

        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('assessments')
          .select('id, created_at, assessment_result, user_id');

        if (assessmentsError) throw assessmentsError;

        const { data: subscriptionsData, error: subscriptionsError } = await supabase
          .from('user_subscriptions')
          .select('plan, status, user_id, created_at, lemon_squeezy_subscription_id');

        if (subscriptionsError) throw subscriptionsError;

        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

        const totalUsers = usersData?.length || 0;
        const totalAssessments = assessmentsData?.length || 0;
        
        const assessmentsToday = assessmentsData?.filter(a => 
          a?.created_at && new Date(a.created_at) >= today
        ).length || 0;

        const assessmentsThisWeek = assessmentsData?.filter(a => 
          a?.created_at && new Date(a.created_at) >= weekAgo
        ).length || 0;

        const activeUserIds = new Set(
          assessmentsData?.filter(a => a?.created_at && new Date(a.created_at) >= monthAgo)
            .map(a => a.user_id)
            .filter(Boolean) || []
        );
        const activeUsers = activeUserIds.size;

        const premiumSubscriptions = subscriptionsData?.filter(s =>
          s?.plan === 'premium' && s?.status === 'active'
        ) || [];
        const premiumUsers = premiumSubscriptions.length;

        const monthlyPriceARS = 50000;
        const mrr = premiumUsers * monthlyPriceARS;
        const arr = mrr * 12;
        const arpu = totalUsers > 0 ? mrr / totalUsers : 0;

        const userGrowth = [];
        for (let i = 29; i >= 0; i--) {
          const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
          const dateStr = date.toISOString().split('T')[0];
          const count = usersData?.filter(u => 
            u?.created_at && new Date(u.created_at).toDateString() === date.toDateString()
          ).length || 0;
          userGrowth.push({ date: dateStr, count });
        }

        const skillGapCounts = new Map<string, number>();
        const skillGapLevels = new Map<string, { currentLevels: number[]; targetLevels: number[] }>();
        let totalScores = 0;
        let totalScoreCount = 0;
        const scoreRanges = { '1-2': 0, '2-3': 0, '3-4': 0, '4-5': 0 };
        
        // Track users with multiple assessments
        const userAssessmentCounts = new Map<string, number>();
        
        // Track scores by subscription type
        let freeUserScores = 0;
        let freeUserCount = 0;
        let premiumUserScores = 0;
        let premiumUserCount = 0;

        assessmentsData?.forEach(assessment => {
          try {
            const result = assessment.assessment_result as any;
            const isPremium = premiumSubscriptions.some(sub => sub.user_id === assessment.user_id);
            
            if (result?.gaps && Array.isArray(result.gaps)) {
              result.gaps.forEach((gap: any) => {
                const domainKey = gap?.domain || gap?.skill || gap?.area || gap?.key;
                if (domainKey && typeof domainKey === 'string') {
                  skillGapCounts.set(domainKey, (skillGapCounts.get(domainKey) || 0) + 1);
                  
                  // Track levels for this gap
                  if (!skillGapLevels.has(domainKey)) {
                    skillGapLevels.set(domainKey, { currentLevels: [], targetLevels: [] });
                  }
                  const levels = skillGapLevels.get(domainKey)!;
                  if (typeof gap.currentLevel === 'number') {
                    levels.currentLevels.push(gap.currentLevel);
                  }
                  if (typeof gap.targetLevel === 'number') {
                    levels.targetLevels.push(gap.targetLevel);
                  }
                }
              });
            }
            
            if (result && typeof result.promedioGlobal === 'number') {
              const score = result.promedioGlobal;
              totalScores += score;
              totalScoreCount++;
              
              // Distribute into ranges
              if (score >= 1 && score < 2) scoreRanges['1-2']++;
              else if (score >= 2 && score < 3) scoreRanges['2-3']++;
              else if (score >= 3 && score < 4) scoreRanges['3-4']++;
              else if (score >= 4 && score <= 5) scoreRanges['4-5']++;
              
              // Track by subscription type
              if (isPremium) {
                premiumUserScores += score;
                premiumUserCount++;
              } else {
                freeUserScores += score;
                freeUserCount++;
              }
            }
            
            // Track re-evaluation rate
            if (assessment.user_id) {
              userAssessmentCounts.set(
                assessment.user_id,
                (userAssessmentCounts.get(assessment.user_id) || 0) + 1
              );
            }
          } catch (e) {
            // Skip invalid assessments
          }
        });

        const skillGapDistribution = Array.from(skillGapCounts.entries())
          .map(([skill, count]) => {
            const levels = skillGapLevels.get(skill);
            const avgCurrentLevel = levels && levels.currentLevels.length > 0
              ? levels.currentLevels.reduce((a, b) => a + b, 0) / levels.currentLevels.length
              : 0;
            const avgTargetLevel = levels && levels.targetLevels.length > 0
              ? levels.targetLevels.reduce((a, b) => a + b, 0) / levels.targetLevels.length
              : 0;
            
            return {
              skill,
              count,
              percentage: totalUsers > 0 ? (count / totalUsers) * 100 : 0,
              avgCurrentLevel,
              avgTargetLevel
            };
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);
        
        // Calculate score distribution
        const scoreDistribution = Object.entries(scoreRanges).map(([range, count]) => ({
          range,
          count,
          percentage: totalScoreCount > 0 ? (count / totalScoreCount) * 100 : 0
        }));
        
        // Calculate re-evaluation rate
        const usersWithMultipleAssessments = Array.from(userAssessmentCounts.values())
          .filter(count => count > 1).length;
        const reEvaluationRate = totalUsers > 0 
          ? (usersWithMultipleAssessments / totalUsers) * 100 
          : 0;
        
        // Calculate average scores by type
        const avgScoreFree = freeUserCount > 0 ? freeUserScores / freeUserCount : 0;
        const avgScorePremium = premiumUserCount > 0 ? premiumUserScores / premiumUserCount : 0;

        const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
        const averageAssessmentScore = totalScoreCount > 0 ? totalScores / totalScoreCount : 0;

        // Contar usuarios únicos con preguntas opcionales completadas
        const usersWithOptionalDomains = new Set<string>();
        assessmentsData?.forEach(assessment => {
          try {
            const result = assessment.assessment_result as any;
            const optionalDomains = result?.optionalDomains;
            if (optionalDomains && (optionalDomains.growth || optionalDomains.ia_aplicada)) {
              if (assessment.user_id) {
                usersWithOptionalDomains.add(assessment.user_id);
              }
            }
          } catch (e) {
            // Skip invalid
          }
        });
        const usersWithOptionalAnswers = usersWithOptionalDomains.size;

        const analyticsData: AdminAnalytics = {
          totalUsers,
          activeUsers,
          totalAssessments,
          assessmentsToday,
          assessmentsThisWeek,
          premiumUsers,
          userGrowth,
          skillGapDistribution,
          conversionRate,
          mrr,
          arr,
          arpu,
          averageAssessmentScore,
          recentActivePeriod: "30 días",
          scoreDistribution,
          reEvaluationRate,
          avgScoreFree,
          avgScorePremium,
          usersWithOptionalAnswers,
        };

      setAnalytics(analyticsData);
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

  return { analytics, loading, error, refreshing, refetch };
}