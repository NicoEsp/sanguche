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

// LinkedIn sharing tracking
const LINKEDIN_SHARE_KEY = "productprepa:linkedin_share";

export type LinkedInShareRecord = {
  sharedAt: string; // ISO string
  accessExpiresAt: string; // ISO string
};

export function saveLinkedInShare() {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours
  
  const record: LinkedInShareRecord = {
    sharedAt: now.toISOString(),
    accessExpiresAt: expiresAt.toISOString(),
  };
  
  try {
    localStorage.setItem(LINKEDIN_SHARE_KEY, JSON.stringify(record));
  } catch (e) {
    // noop
  }
}

export function getLinkedInShare(): LinkedInShareRecord | null {
  try {
    const raw = localStorage.getItem(LINKEDIN_SHARE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LinkedInShareRecord;
  } catch (e) {
    return null;
  }
}

export function hasTemporaryAccess(): boolean {
  const record = getLinkedInShare();
  if (!record) return false;
  
  const now = new Date();
  const expiresAt = new Date(record.accessExpiresAt);
  
  return now < expiresAt;
}
