export type FinalSubmissionStatus =
  | "Draft"
  | "Submitted"
  | "Incomplete"
  | "For Records Validation"
  | "Records Validated"
  | "For Dean Approval"
  | "Approved"
  | "Rejected";

export type FinalRequirementKey =
  | "finalManuscript"
  | "grammarCertificate"
  | "approvalForm"
  | "recordsClearance";

export type FinalSubmission = {
  id: number;
  groupName: string;
  course: string;
  projectTitle: string;
  submittedBy: string;
  submittedAt: string;
  finalManuscript: string;
  grammarCertificate: string;
  approvalForm: string;
  recordsClearance: string;
  grammarianCertificateStatus: "Pending" | "Uploaded" | "Verified";
  recordsValidation: "Pending" | "Validated" | "Rejected";
  deanApproval: "Pending" | "Approved" | "Rejected";
  status: FinalSubmissionStatus;
  remarks: string;
};

const FINAL_SUBMISSIONS_STORAGE_KEY = "project-pulse-final-submissions";

const defaultFinalSubmissions: FinalSubmission[] = [
  {
    id: 1,
    groupName: "Project Pulse",
    course: "BSIT 4A",
    projectTitle: "Smart Capstone Monitoring System",
    submittedBy: "Student Name",
    submittedAt: "May 10, 2026",
    finalManuscript: "project-pulse-final-manuscript.pdf",
    grammarCertificate: "grammar-certificate.pdf",
    approvalForm: "adviser-approval-form.pdf",
    recordsClearance: "records-clearance.pdf",
    grammarianCertificateStatus: "Uploaded",
    recordsValidation: "Pending",
    deanApproval: "Pending",
    status: "For Records Validation",
    remarks: "",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

export function isFinalSubmissionComplete(submission: FinalSubmission) {
  return Boolean(
    submission.finalManuscript &&
      submission.grammarCertificate &&
      submission.approvalForm &&
      submission.recordsClearance,
  );
}

export function getStoredFinalSubmissions() {
  if (!canUseStorage()) return defaultFinalSubmissions;

  const saved = window.localStorage.getItem(FINAL_SUBMISSIONS_STORAGE_KEY);

  if (!saved) {
    saveStoredFinalSubmissions(defaultFinalSubmissions);
    return defaultFinalSubmissions;
  }

  return JSON.parse(saved) as FinalSubmission[];
}

export function saveStoredFinalSubmissions(submissions: FinalSubmission[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    FINAL_SUBMISSIONS_STORAGE_KEY,
    JSON.stringify(submissions),
  );
}

export function addFinalSubmission(
  submission: Omit<FinalSubmission, "id" | "submittedAt">,
) {
  const submissions = getStoredFinalSubmissions();

  const nextSubmission: FinalSubmission = {
    ...submission,
    id: Date.now(),
    submittedAt: new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };

  saveStoredFinalSubmissions([nextSubmission, ...submissions]);

  return nextSubmission;
}

export function updateFinalSubmission(
  id: number,
  updates: Partial<FinalSubmission>,
) {
  const submissions = getStoredFinalSubmissions().map((submission) =>
    submission.id === id ? { ...submission, ...updates } : submission,
  );

  saveStoredFinalSubmissions(submissions);
  return submissions;
}
