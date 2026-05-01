export type CourseCode = "BSIT" | "BSCS" | "BSIS";

export type ProjectStage =
  | "Proposal Review"
  | "Alpha Defense"
  | "Beta Defense"
  | "Final Defense"
  | "Final Approval";

export type DeanProject = {
  id: number;
  course: CourseCode;
  section: string;
  groupName: string;
  projectTitle: string;
  adviser: string;
  stage: ProjectStage;
  progress: number;
  riskLevel: "Normal" | "At Risk" | "Ready";
  lastActivity: string;
  revisionCount: number;
  feedbackCompletion: number;
  finalRequirementStatus: string;
  defenseOutcome: string;
};

export const deanProjects: DeanProject[] = [
  {
    id: 1,
    course: "BSIT",
    section: "4A",
    groupName: "Project Pulse",
    projectTitle: "Smart Capstone Monitoring System",
    adviser: "Anna Cruz",
    stage: "Alpha Defense",
    progress: 68,
    riskLevel: "Normal",
    lastActivity: "Today",
    revisionCount: 8,
    feedbackCompletion: 60,
    finalRequirementStatus: "Pending",
    defenseOutcome: "Pending",
  },
  {
    id: 2,
    course: "BSIT",
    section: "4B",
    groupName: "CodeCraft",
    projectTitle: "Inventory and Request Tracking System",
    adviser: "Anna Cruz",
    stage: "Proposal Review",
    progress: 42,
    riskLevel: "At Risk",
    lastActivity: "Yesterday",
    revisionCount: 14,
    feedbackCompletion: 35,
    finalRequirementStatus: "Incomplete",
    defenseOutcome: "Pending",
  },
  {
    id: 3,
    course: "BSCS",
    section: "4A",
    groupName: "AlgorithmX",
    projectTitle: "Automated Scheduling Optimization Tool",
    adviser: "Anna Cruz",
    stage: "Beta Defense",
    progress: 82,
    riskLevel: "Ready",
    lastActivity: "Apr 26",
    revisionCount: 5,
    feedbackCompletion: 90,
    finalRequirementStatus: "Pending",
    defenseOutcome: "Passed",
  },
  {
    id: 4,
    course: "BSIS",
    section: "4A",
    groupName: "ArchiveLink",
    projectTitle: "Digital Records Request and Archive System",
    adviser: "Marco Reyes",
    stage: "Final Approval",
    progress: 96,
    riskLevel: "Ready",
    lastActivity: "Apr 25",
    revisionCount: 6,
    feedbackCompletion: 100,
    finalRequirementStatus: "Complete",
    defenseOutcome: "Passed",
  },
];

export const chapterProgress = [
  ["Chapter 1", "Approved", 100],
  ["Chapter 2", "Approved", 100],
  ["Chapter 3", "Under Review", 78],
  ["Chapter 4", "Draft", 45],
  ["Chapter 5", "Pending", 20],
];

export const revisionHistory = [
  {
    id: 1,
    version: "v8",
    chapter: "Chapter 3",
    editedBy: "Student Name",
    editedAt: "May 01, 2026 • 9:20 AM",
    note: "Updated methodology and sampling procedure.",
  },
  {
    id: 2,
    version: "v7",
    chapter: "Chapter 2",
    editedBy: "Maria Santos",
    editedAt: "Apr 29, 2026 • 3:40 PM",
    note: "Added recent related studies.",
  },
  {
    id: 3,
    version: "v6",
    chapter: "Chapter 1",
    editedBy: "John Reyes",
    editedAt: "Apr 28, 2026 • 11:10 AM",
    note: "Revised objectives and scope.",
  },
];

export const adviserWorkloads = [
  ["Anna Cruz", 3, 5],
  ["Marco Reyes", 1, 1],
  ["Elena Rivera", 4, 7],
];

export const defenseOutcomes = [
  ["Project Pulse", "Alpha Defense", "Pending", "May 10, 2026"],
  ["AlgorithmX", "Beta Defense", "Passed", "Apr 26, 2026"],
  ["ArchiveLink", "Final Defense", "Passed", "Apr 25, 2026"],
];

export const finalApprovals = [
  {
    id: 4,
    groupName: "ArchiveLink",
    projectTitle: "Digital Records Request and Archive System",
    finalManuscript: "Approved",
    grammarianCertificate: "Uploaded",
    recordsValidation: "Validated",
    finalRequirements: "Complete",
    status: "Ready",
  },
  {
    id: 3,
    groupName: "AlgorithmX",
    projectTitle: "Automated Scheduling Optimization Tool",
    finalManuscript: "Under Review",
    grammarianCertificate: "Pending",
    recordsValidation: "Pending",
    finalRequirements: "Incomplete",
    status: "Pending",
  },
];

export const deanNotifications = [
  {
    id: 1,
    title: "ArchiveLink is ready for final approval.",
    date: "Just now",
  },
  {
    id: 2,
    title: "CodeCraft has high revision frequency.",
    date: "Today",
  },
  {
    id: 3,
    title: "AlgorithmX defense result was submitted.",
    date: "Yesterday",
  },
];
