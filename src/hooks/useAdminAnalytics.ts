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
  skillGapDistribution: Array<{ skill: string; count: number }>;
  conversionRate: number;
  mrr: number;
  arr: number;
  arpu: number;
  averageAssessmentScore: number;
  recentActivePeriod: string;
}

export function useAdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAnalytics() {
      try {
        setLoading(true);
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

        const polarMonthlyPrice = 9.99;
        const mrr = premiumUsers * polarMonthlyPrice;
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
        let totalScores = 0;
        let totalScoreCount = 0;

        assessmentsData?.forEach(assessment => {
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

        const skillGapDistribution = Array.from(skillGapCounts.entries())
          .map(([skill, count]) => ({ skill, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 8);

        const conversionRate = totalUsers > 0 ? (premiumUsers / totalUsers) * 100 : 0;
        const averageAssessmentScore = totalScoreCount > 0 ? totalScores / totalScoreCount : 0;

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
        };

        setAnalytics(analyticsData);
      } catch (err) {
        setError('Error cargando analíticas');
      } finally {
        setLoading(false);
      }
    }

    fetchAnalytics();
  }, []);

  return { analytics, loading, error };
}