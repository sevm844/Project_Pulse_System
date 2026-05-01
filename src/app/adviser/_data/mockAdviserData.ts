export type CourseCode = "BSIT" | "BSCS" | "BSIS";

export type GroupStage =
  | "Proposal Review"
  | "Alpha Defense"
  | "Beta Defense"
  | "Final Defense";

export type ReviewStatus =
  | "Pending"
  | "Under Review"
  | "Approved"
  | "Needs Revision"
  | "Rejected";

export type AssignedGroup = {
  id: number;
  course: CourseCode;
  section: string;
  schoolYear: string;
  semester: string;
  groupName: string;
  projectTitle: string;
  stage: GroupStage;
  adviser: string;
  lastSubmission: string;
  progress: number;
  status: string;
};

export type ReviewItem = {
  id: number;
  groupId: number;
  course: CourseCode;
  section: string;
  groupName: string;
  projectTitle: string;
  documentTitle: string;
  version: string;
  submittedAt: string;
  stage: GroupStage;
  status: ReviewStatus;
  comments: string[];
};


export type DefenseEndorsement = {
  id: number;
  groupId: number;
  course: CourseCode;
  section: string;
  groupName: string;
  projectTitle: string;
  stage: GroupStage;
  schedule: string;
  completionRate: number;
  feedbackCompletion: number;
  requiredFiles: string[];
  status: "Pending" | "Ready" | "Not Ready";
};

export type AdviserNotification = {
  id: number;
  title: string;
  date: string;
};

export const courses: CourseCode[] = ["BSIT", "BSCS", "BSIS"];

export const sections = ["4A", "4B", "4C"];

export const schoolYears = ["2025-2026"];

export const assignedGroups: AssignedGroup[] = [
  {
    id: 1,
    course: "BSIT",
    section: "4A",
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    groupName: "Project Pulse",
    projectTitle: "Smart Capstone Monitoring System",
    stage: "Alpha Defense",
    adviser: "Anna Cruz",
    lastSubmission: "Today",
    progress: 68,
    status: "Active",
  },
  {
    id: 2,
    course: "BSIT",
    section: "4B",
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    groupName: "CodeCraft",
    projectTitle: "Inventory and Request Tracking System",
    stage: "Proposal Review",
    adviser: "Anna Cruz",
    lastSubmission: "Yesterday",
    progress: 42,
    status: "Pending",
  },
  {
    id: 3,
    course: "BSCS",
    section: "4A",
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    groupName: "AlgorithmX",
    projectTitle: "Automated Scheduling Optimization Tool",
    stage: "Beta Defense",
    adviser: "Anna Cruz",
    lastSubmission: "Apr 26",
    progress: 82,
    status: "Under Review",
  },
  {
    id: 4,
    course: "BSIS",
    section: "4A",
    schoolYear: "2025-2026",
    semester: "2nd Semester",
    groupName: "ArchiveLink",
    projectTitle: "Digital Records Request and Archive System",
    stage: "Alpha Defense",
    adviser: "Anna Cruz",
    lastSubmission: "Apr 24",
    progress: 61,
    status: "Active",
  },
];

export const reviewQueue: ReviewItem[] = [
  {
    id: 1,
    groupId: 1,
    course: "BSIT",
    section: "4A",
    groupName: "Project Pulse",
    projectTitle: "Smart Capstone Monitoring System",
    documentTitle: "Chapter 2: Review of Related Literature",
    version: "v3",
    submittedAt: "Today, 9:15 AM",
    stage: "Alpha Defense",
    status: "Pending",
    comments: [
      "Clarify the scope of local studies.",
      "Add recent sources from 2023 onward.",
    ],
  },
  {
    id: 2,
    groupId: 2,
    course: "BSIT",
    section: "4B",
    groupName: "CodeCraft",
    projectTitle: "Inventory and Request Tracking System",
    documentTitle: "Chapter 1: Introduction",
    version: "v2",
    submittedAt: "Yesterday, 4:20 PM",
    stage: "Proposal Review",
    status: "Under Review",
    comments: ["Revise the statement of the problem."],
  },
  {
    id: 3,
    groupId: 3,
    course: "BSCS",
    section: "4A",
    groupName: "AlgorithmX",
    projectTitle: "Automated Scheduling Optimization Tool",
    documentTitle: "Monitoring Form",
    version: "v1",
    submittedAt: "Apr 26, 2:10 PM",
    stage: "Beta Defense",
    status: "Approved",
    comments: [],
  },
];

export const defenseEndorsements: DefenseEndorsement[] = [
  {
    id: 1,
    groupId: 1,
    course: "BSIT",
    section: "4A",
    groupName: "Project Pulse",
    projectTitle: "Smart Capstone Monitoring System",
    stage: "Alpha Defense",
    schedule: "May 10, 2026 • 9:00 AM",
    completionRate: 68,
    feedbackCompletion: 60,
    requiredFiles: ["Chapter 1", "Chapter 2", "Monitoring Form"],
    status: "Pending",
  },
  {
    id: 2,
    groupId: 3,
    course: "BSCS",
    section: "4A",
    groupName: "AlgorithmX",
    projectTitle: "Automated Scheduling Optimization Tool",
    stage: "Beta Defense",
    schedule: "May 14, 2026 • 1:00 PM",
    completionRate: 82,
    feedbackCompletion: 90,
    requiredFiles: ["Chapters 1-4", "Beta Defense Form"],
    status: "Ready",
  },
];

export const recentSubmissions = [
  {
    id: 1,
    title: "Project Pulse submitted Chapter 2",
    meta: "BSIT 4A",
    date: "Today",
    href: "/adviser/reviews",
  },
  {
    id: 2,
    title: "CodeCraft revised Chapter 1",
    meta: "BSIT 4B",
    date: "Yesterday",
    href: "/adviser/reviews",
  },
  {
    id: 3,
    title: "AlgorithmX uploaded monitoring form",
    meta: "BSCS 4A",
    date: "Apr 26",
    href: "/adviser/reviews",
  },
];

export const notifications: AdviserNotification[] = [
  {
    id: 1,
    title: "Project Pulse submitted Chapter 2 for review.",
    date: "Just now",
  },
  {
    id: 2,
    title: "CodeCraft has unresolved feedback items.",
    date: "Today",
  },
  {
    id: 3,
    title: "AlgorithmX is ready for defense endorsement.",
    date: "Yesterday",
  },
];

export const scheduleItems = [
  {
    id: 1,
    title: "Project Pulse consultation",
    date: "May 02, 2026",
    time: "10:00 AM",
    type: "Consultation",
  },
  {
    id: 2,
    title: "Alpha Defense endorsement review",
    date: "May 08, 2026",
    time: "2:00 PM",
    type: "Defense Check",
  },
  {
    id: 3,
    title: "AlgorithmX Beta Defense",
    date: "May 14, 2026",
    time: "1:00 PM",
    type: "Defense",
  },
];
export type AdviserChatType = "broadcast" | "section" | "group";

export type AdviserChatThread = {
  id: string;
  type: AdviserChatType;
  label: string;
  course?: CourseCode;
  section?: string;
  groupId?: number;
  groupName?: string;
};

export const adviserChatThreads: AdviserChatThread[] = [
  {
    id: "all-assigned",
    type: "broadcast",
    label: "All Assigned Groups",
  },
  {
    id: "bsit-4a",
    type: "section",
    label: "BSIT 4A Announcement",
    course: "BSIT",
    section: "4A",
  },
  {
    id: "bsit-4b",
    type: "section",
    label: "BSIT 4B Announcement",
    course: "BSIT",
    section: "4B",
  },
  {
    id: "bscs-4a",
    type: "section",
    label: "BSCS 4A Announcement",
    course: "BSCS",
    section: "4A",
  },
  {
    id: "bsis-4a",
    type: "section",
    label: "BSIS 4A Announcement",
    course: "BSIS",
    section: "4A",
  },
  ...assignedGroups.map((group) => ({
    id: `group-${group.id}`,
    type: "group" as AdviserChatType,
    label: `${group.course} ${group.section} - ${group.groupName}`,
    course: group.course,
    section: group.section,
    groupId: group.id,
    groupName: group.groupName,
  })),
];
