import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { getAssessment } from '@/utils/storage';
import { AssessmentResult, Gap, NeutralArea, Strength } from '@/utils/scoring';

interface AssessmentData {
  result: AssessmentResult | null;
  loading: boolean;
  hasAssessment: boolean;
}

export function useAssessmentData(): AssessmentData {
  const [data, setData] = useState<AssessmentData>({
    result: null,
    loading: true,
    hasAssessment: false
  });
  const { user } = useAuth();

  useEffect(() => {
    async function fetchAssessmentData() {
      setData(prev => ({ ...prev, loading: true }));

      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id')
            .eq('user_id', user.id)
            .single();

          if (profile) {
            const { data: assessment } = await supabase
              .from('assessments')
              .select('assessment_result')
              .eq('user_id', profile.id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle();

            if (assessment && assessment.assessment_result) {
              setData({
                result: assessment.assessment_result as AssessmentResult,
                loading: false,
                hasAssessment: true
              });
              return;
            }
          }
        } catch (error) {
          if (import.meta.env.DEV) console.error('Error fetching assessment from Supabase:', error);
        }
      }

      const localAssessment = getAssessment();
      setData({
        result: localAssessment?.result || null,
        loading: false,
        hasAssessment: !!localAssessment
      });
    }

    fetchAssessmentData();
  }, [user]);

  return data;
}

export type { Gap, NeutralArea, Strength };