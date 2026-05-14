import {
  getStoredFinalSubmissions,
  type FinalSubmission,
} from "./finalSubmissionStorage";

export type ArchivedProject = {
  id: number;
  groupName: string;
  course: string;
  projectTitle: string;
  adviser: string;
  schoolYear: string;
  archivedAt: string;
  finalManuscript: string;
  grammarCertificate: string;
  approvalForm: string;
  recordsClearance: string;
  status: "Archived" | "Approved";
};

const ARCHIVE_STORAGE_KEY = "project-pulse-archived-projects";

const defaultArchivedProjects: ArchivedProject[] = [
  {
    id: 1,
    groupName: "ArchiveLink",
    course: "BSIS 4A",
    projectTitle: "Digital Records Request and Archive System",
    adviser: "Marco Reyes",
    schoolYear: "2025-2026",
    archivedAt: "May 10, 2026",
    finalManuscript: "archivelink-final-manuscript.pdf",
    grammarCertificate: "archivelink-grammar-certificate.pdf",
    approvalForm: "archivelink-adviser-approval.pdf",
    recordsClearance: "archivelink-records-clearance.pdf",
    status: "Archived",
  },
  {
    id: 2,
    groupName: "AlgorithmX",
    course: "BSCS 4A",
    projectTitle: "Automated Scheduling Optimization Tool",
    adviser: "Anna Cruz",
    schoolYear: "2025-2026",
    archivedAt: "May 08, 2026",
    finalManuscript: "algorithmx-final-manuscript.pdf",
    grammarCertificate: "algorithmx-grammar-certificate.pdf",
    approvalForm: "algorithmx-adviser-approval.pdf",
    recordsClearance: "algorithmx-records-clearance.pdf",
    status: "Archived",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function convertApprovedSubmissionToArchive(
  submission: FinalSubmission,
): ArchivedProject {
  return {
    id: submission.id,
    groupName: submission.groupName,
    course: submission.course,
    projectTitle: submission.projectTitle,
    adviser: "Assigned Adviser",
    schoolYear: "2025-2026",
    archivedAt: submission.submittedAt || "May 10, 2026",
    finalManuscript: submission.finalManuscript,
    grammarCertificate: submission.grammarCertificate,
    approvalForm: submission.approvalForm,
    recordsClearance: submission.recordsClearance,
    status: "Approved",
  };
}

export function getArchivedProjects() {
  const approvedSubmissions = getStoredFinalSubmissions()
    .filter(
      (submission) =>
        submission.status === "Approved" &&
        submission.deanApproval === "Approved",
    )
    .map(convertApprovedSubmissionToArchive);

  if (!canUseStorage()) {
    return [...approvedSubmissions, ...defaultArchivedProjects];
  }

  const saved = window.localStorage.getItem(ARCHIVE_STORAGE_KEY);

  if (!saved) {
    saveArchivedProjects(defaultArchivedProjects);
    return [...approvedSubmissions, ...defaultArchivedProjects];
  }

  const savedProjects = JSON.parse(saved) as ArchivedProject[];
  const savedIds = new Set(savedProjects.map((project) => project.id));
  const newApprovedProjects = approvedSubmissions.filter(
    (project) => !savedIds.has(project.id),
  );

  const archivedProjects = [...newApprovedProjects, ...savedProjects];

  if (newApprovedProjects.length > 0) {
    saveArchivedProjects(archivedProjects);
  }

  return archivedProjects;
}

export function saveArchivedProjects(projects: ArchivedProject[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(ARCHIVE_STORAGE_KEY, JSON.stringify(projects));
}

export function archiveApprovedSubmission(submission: FinalSubmission) {
  const archivedProjects = getArchivedProjects();
  const archivedProject = convertApprovedSubmissionToArchive(submission);

  const exists = archivedProjects.some(
    (project) => project.id === archivedProject.id,
  );

  if (exists) return archivedProjects;

  const nextProjects = [archivedProject, ...archivedProjects];
  saveArchivedProjects(nextProjects);

  return nextProjects;
}
