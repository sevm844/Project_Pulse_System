export type RequirementStatus = "Missing" | "Submitted" | "Checked" | "Returned";

export type FinalRequirement = {
  id: number;
  name: string;
  description: string;
};

export type GroupFolder = {
  id: number;
  groupName: string;
  course: string;
  section: string;
  adviser: string;
  projectTitle: string;
  lastSubmission: string;
  lastMessage: string;
  requirements: Record<string, RequirementStatus>;
};

export const finalRequirements: FinalRequirement[] = [
  { id: 1, name: "Final Manuscript", description: "Final revised document after grammar review." },
  { id: 2, name: "Working System", description: "Final working system or deployment/archive file." },
  { id: 3, name: "Softcopy Poster", description: "Final approved poster file." },
  { id: 4, name: "Grammarian Certificate", description: "Certificate issued after grammar checking." },
  { id: 5, name: "Government ID", description: "Government-issued identification." },
  { id: 6, name: "Student ID", description: "Student identification card copy." },
  { id: 7, name: "User Manual", description: "Final user manual for the system." },
  { id: 8, name: "Journal IMRAD", description: "Journal format document using IMRAD structure." },
  { id: 9, name: "Diploma", description: "Diploma requirement copy if required." },
  { id: 10, name: "TOR", description: "Transcript of Records requirement copy if required." },
];

export const groupFolders: GroupFolder[] = [
  {
    id: 1,
    groupName: "Project Pulse",
    course: "BSIT",
    section: "4A",
    adviser: "Anna Cruz",
    projectTitle: "Smart Capstone Monitoring System",
    lastSubmission: "Today",
    lastMessage: "Today",
    requirements: {
      "Final Manuscript": "Checked",
      "Working System": "Submitted",
      "Softcopy Poster": "Submitted",
      "Grammarian Certificate": "Checked",
      "Government ID": "Missing",
      "Student ID": "Submitted",
      "User Manual": "Missing",
      "Journal IMRAD": "Submitted",
      Diploma: "Missing",
      TOR: "Missing",
    },
  },
  {
    id: 2,
    groupName: "ArchiveLink",
    course: "BSIS",
    section: "4A",
    adviser: "Marco Reyes",
    projectTitle: "Digital Records Request and Archive System",
    lastSubmission: "Yesterday",
    lastMessage: "May 12, 2026",
    requirements: {
      "Final Manuscript": "Checked",
      "Working System": "Checked",
      "Softcopy Poster": "Checked",
      "Grammarian Certificate": "Checked",
      "Government ID": "Checked",
      "Student ID": "Checked",
      "User Manual": "Checked",
      "Journal IMRAD": "Checked",
      Diploma: "Checked",
      TOR: "Checked",
    },
  },
];

export function getRequirementCounts(folder: GroupFolder) {
  const values = Object.values(folder.requirements);
  const checked = values.filter((status) => status === "Checked").length;
  const submitted = values.filter((status) => status === "Submitted").length;
  const returned = values.filter((status) => status === "Returned").length;
  const missing = values.filter((status) => status === "Missing").length;

  return {
    total: values.length,
    checked,
    submitted,
    returned,
    missing,
    progress: Math.round((checked / values.length) * 100),
  };
}
