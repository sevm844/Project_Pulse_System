export type DefenseRequirementStatus = "Pending" | "Completed";
export type DefenseFileStatus = "Pending" | "Uploaded";
export type DefenseReadinessStatus = "Pending" | "Ready" | "Not Ready";
export type EvaluationStatus = "Pending" | "Submitted";

export type DefensePanelist = {
  id: number;
  role: string;
  name: string;
  email: string;
};

export type DefenseRequirement = {
  id: number;
  title: string;
  detail: string;
  status: DefenseRequirementStatus;
};

export type DefenseFile = {
  id: number;
  name: string;
  detail: string;
  uploaded: string;
  status: DefenseFileStatus;
};

export type DefenseEvaluation = {
  presentation: number;
  documentation: number;
  systemDemo: number;
  response: number;
  remarks: string;
};

export type DefensePlan = {
  id: number;
  groupId: number;
  groupName: string;
  projectTitle: string;
  course: string;
  section: string;
  stage: string;
  date: string;
  time: string;
  venue: string;
  adviser: string;
  readinessStatus: DefenseReadinessStatus;
  panelists: DefensePanelist[];
  requirements: DefenseRequirement[];
  files: DefenseFile[];
  evaluationStatus: EvaluationStatus;
  evaluationData: DefenseEvaluation;
  updatedAt: string;
};

type DefenseGroupInput = {
  id: number;
  course: string;
  section: string;
  groupName: string;
  projectTitle: string;
  stage: string;
  adviser: string;
};

type StoredStudentGroupSnapshot = {
  id?: number;
  course?: string;
  section?: string;
  groupName?: string;
  projectTitle?: string;
  title?: string;
  stage?: string;
  adviser?: string;
};

const DEFENSE_STORAGE_KEY = "project-pulse-defense-plans";
const STUDENT_GROUP_STORAGE_KEY = "project-pulse-student-group";

const defaultPanelists: DefensePanelist[] = [
  {
    id: 1,
    role: "Adviser",
    name: "Anna Cruz",
    email: "anna.cruz@ub.edu.ph",
  },
  {
    id: 2,
    role: "Chairperson",
    name: "Dr. Santos",
    email: "santos@ub.edu.ph",
  },
  {
    id: 3,
    role: "Panel 1",
    name: "Prof. Lim",
    email: "lim@ub.edu.ph",
  },
  {
    id: 4,
    role: "Panel 2",
    name: "Ms. Reyes",
    email: "reyes@ub.edu.ph",
  },
];

const defaultRequirements: DefenseRequirement[] = [
  {
    id: 1,
    title: "Manuscript submitted",
    detail: "Latest chapter manuscript must be submitted.",
    status: "Pending",
  },
  {
    id: 2,
    title: "Adviser approval",
    detail: "Adviser must approve the group for defense.",
    status: "Pending",
  },
  {
    id: 3,
    title: "Presentation slides",
    detail: "Defense presentation file must be uploaded.",
    status: "Pending",
  },
  {
    id: 4,
    title: "Similarity report",
    detail: "Similarity report must be uploaded before defense.",
    status: "Pending",
  },
];

const defaultFiles: DefenseFile[] = [
  {
    id: 1,
    name: "Chapter Manuscript",
    detail: "Current manuscript workspace",
    uploaded: "-",
    status: "Pending",
  },
  {
    id: 2,
    name: "Presentation Slides",
    detail: "Defense presentation deck",
    uploaded: "-",
    status: "Pending",
  },
  {
    id: 3,
    name: "Approval Form",
    detail: "Signed adviser approval file",
    uploaded: "-",
    status: "Pending",
  },
  {
    id: 4,
    name: "Similarity Report",
    detail: "Required similarity report",
    uploaded: "-",
    status: "Pending",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function normalizeStage(value?: string) {
  if (
    value === "Proposal Review" ||
    value === "Alpha Defense" ||
    value === "Beta Defense" ||
    value === "Final Defense"
  ) {
    return value;
  }

  return "Proposal Review";
}

function getStoredStudentGroupSnapshot(): StoredStudentGroupSnapshot | null {
  if (!canUseStorage()) return null;

  const saved = window.localStorage.getItem(STUDENT_GROUP_STORAGE_KEY);
  if (!saved) return null;

  return JSON.parse(saved) as StoredStudentGroupSnapshot;
}

function getPrimaryGroupInput(): DefenseGroupInput {
  const group = getStoredStudentGroupSnapshot();

  return {
    id: 1,
    course: group?.course || "BSIT",
    section: group?.section || "4A",
    groupName: group?.groupName || "Project Pulse",
    projectTitle:
      group?.projectTitle || group?.title || "Smart Capstone Monitoring System",
    stage: normalizeStage(group?.stage),
    adviser: group?.adviser || "Anna Cruz",
  };
}

function syncPlanWithCurrentGroup(plan: DefensePlan): DefensePlan {
  if (plan.groupId !== 1) return plan;

  const currentGroup = getPrimaryGroupInput();

  return {
    ...plan,
    groupName: currentGroup.groupName,
    projectTitle: currentGroup.projectTitle,
    course: currentGroup.course,
    section: currentGroup.section,
    stage: currentGroup.stage,
    adviser: currentGroup.adviser,
  };
}

function getDefaultPlans(): DefensePlan[] {
  return [createDefensePlanForGroup(getPrimaryGroupInput())];
}

export function createDefensePlanForGroup(group: DefenseGroupInput): DefensePlan {
  return {
    id: group.id,
    groupId: group.id,
    groupName: group.groupName,
    projectTitle: group.projectTitle,
    course: group.course,
    section: group.section,
    stage: group.stage,
    date: "May 22, 2026",
    time: "9:00 AM",
    venue: "Room 402",
    adviser: group.adviser,
    readinessStatus: "Pending",
    panelists: defaultPanelists,
    requirements: defaultRequirements,
    files: defaultFiles,
    evaluationStatus: "Pending",
    evaluationData: {
      presentation: 0,
      documentation: 0,
      systemDemo: 0,
      response: 0,
      remarks: "",
    },
    updatedAt: new Date().toISOString(),
  };
}

export function getStoredDefensePlans() {
  if (!canUseStorage()) return getDefaultPlans();

  const saved = window.localStorage.getItem(DEFENSE_STORAGE_KEY);

  if (!saved) {
    const defaults = getDefaultPlans();
    saveStoredDefensePlans(defaults);
    return defaults;
  }

  const storedPlans = JSON.parse(saved) as DefensePlan[];
  const syncedPlans = storedPlans.map(syncPlanWithCurrentGroup);

  saveStoredDefensePlans(syncedPlans);
  return syncedPlans;
}

export function saveStoredDefensePlans(plans: DefensePlan[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(DEFENSE_STORAGE_KEY, JSON.stringify(plans));
}

export function getStoredDefensePlan(groupId = 1) {
  const plans = getStoredDefensePlans();
  return plans.find((plan) => plan.groupId === groupId) || plans[0] || getDefaultPlans()[0];
}

export function saveStoredDefensePlan(plan: DefensePlan) {
  const plans = getStoredDefensePlans();
  const nextPlan = syncPlanWithCurrentGroup({
    ...plan,
    updatedAt: new Date().toISOString(),
  });

  const exists = plans.some((item) => item.groupId === nextPlan.groupId);

  const nextPlans = exists
    ? plans.map((item) => (item.groupId === nextPlan.groupId ? nextPlan : item))
    : [nextPlan, ...plans];

  saveStoredDefensePlans(nextPlans);
  return nextPlan;
}

export function computeDefenseAverage(evaluation: DefenseEvaluation) {
  const scores = [
    evaluation.presentation,
    evaluation.documentation,
    evaluation.systemDemo,
    evaluation.response,
  ];

  const total = scores.reduce((sum, score) => sum + Number(score || 0), 0);
  return Math.round(total / scores.length);
}

export function computeDefenseResult(score: number) {
  if (score >= 85) return "Passed";
  if (score >= 75) return "Conditional";
  return "Needs Revision";
}
