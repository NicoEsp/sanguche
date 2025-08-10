import { AssessmentResult, AssessmentValues } from "./scoring";

const KEY = "productprepa:assessment";

export type AssessmentRecord = {
  values: AssessmentValues;
  result: AssessmentResult;
  createdAt: string; // ISO string
};

export function saveAssessment(values: AssessmentValues, result: AssessmentResult) {
  const record: AssessmentRecord = {
    values,
    result,
    createdAt: new Date().toISOString(),
  };
  try {
    localStorage.setItem(KEY, JSON.stringify(record));
  } catch (e) {
    // noop
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
    // noop
  }
}
