import { AssessmentResult, AssessmentValues, OptionalAssessmentValues } from "./scoring";

const KEY = "productprepa:assessment";

export type AssessmentRecord = {
  values: AssessmentValues;
  optionalValues?: OptionalAssessmentValues;
  result: AssessmentResult;
  createdAt: string; // ISO string
};

export async function saveAssessment(
  values: AssessmentValues,
  optionalValues: OptionalAssessmentValues | undefined,
  result: AssessmentResult,
  supabaseClient?: any
) {
  const record: AssessmentRecord = {
    values,
    optionalValues,
    result,
    createdAt: new Date().toISOString(),
  };
  
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch (e) {
    // Silent fail
  }

  if (supabaseClient) {
    try {
      const { data: { user } } = await supabaseClient.auth.getUser();
      if (user) {
        // Get user profile
        const { data: profile } = await supabaseClient
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          await supabaseClient
            .from('assessments')
            .insert({
              user_id: profile.id,
              assessment_values: values,
              assessment_result: result,
            });
        }
      }
    } catch (error) {
      if (import.meta.env.DEV) console.error('Failed to save assessment to Supabase:', error);
    }
  }
}

export function getAssessment(): AssessmentRecord | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AssessmentRecord;
  } catch (e) {
    return null;
  }
}

export function clearAssessment() {
  try {
    localStorage.removeItem(KEY);
  } catch (e) {
    // Silent fail
  }
}
