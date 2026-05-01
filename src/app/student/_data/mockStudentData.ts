export type DocumentStatus =
  | "Draft"
  | "Submitted"
  | "Under Review"
  | "Approved"
  | "Needs Revision";

export type FeedbackStatus = "Pending" | "Addressed" | "Verified";

export type GroupMember = {
  name: string;
  role: string;
  email: string;
};

export type DocumentItem = {
  id: number;
  type: string;
  version: string;
  updated: string;
  status: DocumentStatus;
  reviewer: string;
};

export type FeedbackItem = {
  id: number;
  comment: string;
  chapter: string;
  by: string;
  date: string;
  version: string;
  status: FeedbackStatus;
};

export type TaskItem = {
  id: number;
  title: string;
  section: string;
  deadline: string;
  status: string;
  action: string;
};

export type ActivityItem = {
  id: number;
  title: string;
  date: string;
  href: string;
};

export type DefenseSchedule = {
  stage: string;
  date: string;
  time: string;
  venue: string;
  panelists: string[];
  deadline: string;
};

export type NotificationItem = {
  id: number;
  title: string;
  date: string;
};

/* Project overview */

export const project = {
  groupName: "Project Pulse",
  groupCode: "PP-DEMO01",
  title: "Smart Capstone Monitoring System",
  abstract:
    "A centralized monitoring system designed to support capstone document submissions, adviser feedback, defense tracking, and academic workflow management.",
  adviser: "Dr. Elena Rivera",
  stage: "Alpha Defense",
  lastSubmission: "Today",
  completion: 68,
  chapters: [
    {
      title: "Chapter 1",
      status: "Approved" as DocumentStatus,
      progress: 100,
    },
    {
      title: "Chapter 2",
      status: "Needs Revision" as DocumentStatus,
      progress: 72,
    },
    {
      title: "Chapter 3",
      status: "Draft" as DocumentStatus,
      progress: 45,
    },
    {
      title: "Defense Files",
      status: "Pending",
      progress: 30,
    },
  ],
};

/* Team */

export const members: GroupMember[] = [
  {
    name: "Student Name",
    role: "Group Leader",
    email: "1234567@ub.edu.ph",
  },
  {
    name: "Maria Santos",
    role: "Member",
    email: "maria.santos@ub.edu.ph",
  },
  {
    name: "John Reyes",
    role: "Member",
    email: "john.reyes@ub.edu.ph",
  },
];

/* Documents */

export const documents: DocumentItem[] = [
  {
    id: 1,
    type: "Chapter 1: Introduction",
    version: "v2",
    updated: "Apr 20",
    status: "Approved",
    reviewer: "Adviser",
  },
  {
    id: 2,
    type: "Chapter 2: RRL",
    version: "v3",
    updated: "Apr 23",
    status: "Needs Revision",
    reviewer: "Adviser",
  },
  {
    id: 3,
    type: "Monitoring Form",
    version: "v1",
    updated: "Today",
    status: "Submitted",
    reviewer: "Coordinator",
  },
  {
    id: 4,
    type: "Alpha Defense Files",
    version: "v1",
    updated: "Apr 26",
    status: "Draft",
    reviewer: "Panel",
  },
];

/* Adviser feedback */

export const feedbackItems: FeedbackItem[] = [
  {
    id: 1,
    comment: "Clarify the scope of the study and define the target users.",
    chapter: "Chapter 1",
    by: "Dr. Rivera",
    date: "Apr 22",
    version: "v2",
    status: "Pending",
  },
  {
    id: 2,
    comment: "Add more recent local related studies.",
    chapter: "Chapter 2",
    by: "Dr. Rivera",
    date: "Apr 23",
    version: "v3",
    status: "Pending",
  },
  {
    id: 3,
    comment: "Revise the research objectives into measurable statements.",
    chapter: "Chapter 1",
    by: "Dr. Rivera",
    date: "Apr 19",
    version: "v1",
    status: "Addressed",
  },
];

/* Checklist */

export const tasks: TaskItem[] = [
  {
    id: 1,
    title: "Upload revised Chapter 2",
    section: "Missing Deliverable",
    deadline: "Apr 30",
    status: "Pending",
    action: "Upload required document",
  },
  {
    id: 2,
    title: "Address pending adviser comments",
    section: "Adviser Approval",
    deadline: "May 02",
    status: "In Progress",
    action: "Respond to feedback items",
  },
  {
    id: 3,
    title: "Prepare Alpha Defense files",
    section: "Stage Requirement",
    deadline: "May 05",
    status: "Upcoming",
    action: "Complete defense checklist",
  },
  {
    id: 4,
    title: "Submit final monitoring form",
    section: "Final Requirement",
    deadline: "May 08",
    status: "Pending",
    action: "Upload signed form",
  },
];

/* Defense */

export const defenseSchedule: DefenseSchedule = {
  stage: "Alpha Defense",
  date: "May 10, 2026",
  time: "9:00 AM",
  venue: "Room 402",
  panelists: ["Dr. Santos", "Prof. Lim", "Ms. Cruz"],
  deadline: "May 08, 2026",
};

/* Timeline */

export const activities: ActivityItem[] = [
  {
    id: 1,
    title: "Chapter 2 submitted for adviser review",
    date: "Today",
    href: "/student/documents",
  },
  {
    id: 2,
    title: "Adviser added feedback to Chapter 2",
    date: "Yesterday",
    href: "/student/feedback",
  },
  {
    id: 3,
    title: "Checklist updated for Alpha Defense",
    date: "Apr 24",
    href: "/student/checklist",
  },
  {
    id: 4,
    title: "Defense schedule waiting for confirmation",
    date: "Apr 22",
    href: "/student/defense",
  },
];

/* Support content */

export const resources = [
  "Capstone manuscript format guide",
  "Alpha Defense requirements",
  "Monitoring form template",
  "Panel evaluation rubric",
  "Document submission policy",
];

export const notifications: NotificationItem[] = [
  {
    id: 1,
    title: "Adviser commented on Chapter 2.",
    date: "Just now",
  },
  {
    id: 2,
    title: "Chapter 2 is now under review.",
    date: "Today",
  },
  {
    id: 3,
    title: "Alpha Defense requirement deadline is approaching.",
    date: "2 days ago",
  },
  {
    id: 4,
    title: "Coordinator updated the defense schedule.",
    date: "3 days ago",
  },
];
