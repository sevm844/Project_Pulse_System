import type { DocumentStatus, TaskItem } from "../student/_data/mockStudentData";

export type ProjectStage =
  | "Proposal Defense"
  | "Alpha Defense"
  | "Beta Defense"
  | "Final Defense"
  | "Final Approval";

export const PROJECT_STAGES: ProjectStage[] = [
  "Proposal Defense",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
  "Final Approval",
];

export const STAGE_TRANSITIONS: Record<ProjectStage, ProjectStage[]> = {
  "Proposal Defense": ["Alpha Defense"],
  "Alpha Defense": ["Beta Defense"],
  "Beta Defense": ["Final Defense"],
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

export function isTaskAllowedForStage(task: TaskItem, stage: ProjectStage) {
  if (stage === "Proposal Defense") {
    return ["Missing Deliverable", "Adviser Approval"].includes(task.section);
  }

  if (stage === "Alpha Defense") {
    return ["Stage Requirement", "Missing Deliverable", "Adviser Approval"].includes(
      task.section,
    );
  }

  if (stage === "Beta Defense") {
    return ["Stage Requirement", "Adviser Approval"].includes(task.section);
  }

  if (stage === "Final Defense" || stage === "Final Approval") {
    return ["Final Requirement", "Adviser Approval"].includes(task.section);
  }

  return false;
}

export function getDocumentStatusProgress(status: DocumentStatus | string) {
  if (status === "Approved") return 100;
  if (status === "Submitted") return 80;
  if (status === "Under Review") return 70;
  if (status === "Needs Revision") return 50;
  if (status === "Draft") return 25;
  return 0;
}

export function computeOverallProgress(
  documents: Array<{ status: DocumentStatus | string }>,
) {
  if (documents.length === 0) return null;

  const total = documents.reduce(
    (sum, document) => sum + getDocumentStatusProgress(document.status),
    0,
  );

  return Math.round(total / documents.length);
}
