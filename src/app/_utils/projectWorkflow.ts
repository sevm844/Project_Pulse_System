export type ProjectStage =
  | "Proposal Defense"
  | "Frontend"
  | "CAP101"
  | "CAP102"
  | "Alpha Defense"
  | "Beta Defense"
  | "Omega Defense"
  | "Final Defense"
  | "Final Approval";

export const PROJECT_STAGES: ProjectStage[] = [
  "Proposal Defense",
  "Frontend",
  "CAP101",
  "CAP102",
  "Alpha Defense",
  "Beta Defense",
  "Omega Defense",
  "Final Defense",
  "Final Approval",
];

export const STAGE_TRANSITIONS: Record<ProjectStage, ProjectStage[]> = {
  "Proposal Defense": ["Frontend"],
  "Frontend": ["CAP101"],
  "CAP101": ["CAP102"],
  "CAP102": ["Alpha Defense"],
  "Alpha Defense": ["Beta Defense"],
  "Beta Defense": ["Omega Defense"],
  "Omega Defense": ["Final Defense"],
  "Final Defense": ["Final Approval"],
  "Final Approval": [],
};

export function canTransitionProjectStage(
  currentStage: ProjectStage,
  nextStage: ProjectStage,
) {
  if (currentStage === nextStage) return true;
  return STAGE_TRANSITIONS[currentStage].includes(nextStage);
}

export function getAllowedNextStages(currentStage: ProjectStage) {
  return [currentStage, ...STAGE_TRANSITIONS[currentStage]];
}

export function isProjectStage(value: string): value is ProjectStage {
  return PROJECT_STAGES.includes(value as ProjectStage);
}

export function normalizeProjectStage(value: string): ProjectStage {
  return isProjectStage(value) ? value : "Proposal Defense";
}
