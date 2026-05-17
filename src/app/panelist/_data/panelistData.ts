export type PanelistDefense = {
  id: number;
  groupName: string;
  course: string;
  section: string;
  projectTitle: string;
  stage: string;
  date: string;
  time: string;
  venue: string;
  adviser: string;
  documentTitle: string;
  documentStatus: "Available" | "Pending";
  evaluationStatus: "Pending" | "Submitted";
  submittedAt?: string;
  scores: {
    presentation: number;
    documentation: number;
    systemDemo: number;
    response: number;
  };
  remarks: string;
};

export const panelistDefenses: PanelistDefense[] = [
  {
    id: 1,
    groupName: "WBS Test Group",
    course: "BSIT",
    section: "4A",
    projectTitle: "WBS Group Management System",
    stage: "Proposal Defense",
    date: "May 20, 2026",
    time: "10:00 AM",
    venue: "H205",
    adviser: "Anna Cruz",
    documentTitle: "Chapter Manuscript",
    documentStatus: "Available",
    evaluationStatus: "Pending",
    scores: {
      presentation: 0,
      documentation: 0,
      systemDemo: 0,
      response: 0,
    },
    remarks: "",
  },
  {
    id: 2,
    groupName: "ArchiveLink",
    course: "BSIS",
    section: "4A",
    projectTitle: "Digital Records Request and Archive System",
    stage: "Final Defense",
    date: "May 22, 2026",
    time: "1:00 PM",
    venue: "H208",
    adviser: "Marco Reyes",
    documentTitle: "Final Manuscript",
    documentStatus: "Available",
    evaluationStatus: "Submitted",
    submittedAt: "May 12, 2026",
    scores: {
      presentation: 88,
      documentation: 91,
      systemDemo: 90,
      response: 87,
    },
    remarks: "Clear presentation and complete documentation.",
  },
];

export function computeAverage(defense: PanelistDefense) {
  const scores = Object.values(defense.scores);
  const total = scores.reduce((sum, score) => sum + Number(score || 0), 0);
  return Math.round(total / scores.length);
}
