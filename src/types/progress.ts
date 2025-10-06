export type ObjectiveSource = "mentor" | "custom";

export interface ObjectiveLevel {
  current: number;
  target: number;
  label?: string;
}

export interface ObjectiveStep {
  id: string;
  title: string;
  completed: boolean;
  description?: string;
}

export interface ProgressObjective {
  id: string;
  title: string;
  summary: string;
  type: string;
  source: ObjectiveSource;
  steps: ObjectiveStep[];
  level?: ObjectiveLevel;
  dueDate?: string;
  status: "not-started" | "in-progress" | "completed";
  mentorNotes?: string;
  timeframe: "now" | "soon" | "later";
}

export type CanvasStage = "now" | "soon" | "later";

export interface CanvasPlacement {
  stage: CanvasStage;
  objectiveId: string;
}
