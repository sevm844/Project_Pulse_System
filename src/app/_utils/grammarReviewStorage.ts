import {
  getStoredFinalSubmissions,
  updateFinalSubmission,
  type FinalSubmission,
} from "./finalSubmissionStorage";

export type GrammarReviewStatus =
  | "For Grammar Review"
  | "Under Review"
  | "Returned for Revision"
  | "Certified";

export type CertificateStatus = "Not Issued" | "Issued";

export type GrammarReviewAssignment = {
  id: number;
  finalSubmissionId: number;
  groupName: string;
  course: string;
  section: string;
  projectTitle: string;
  adviser: string;
  documentTitle: string;
  manuscriptFile: string;
  sentBy: string;
  sentAt: string;
  assignedGrammarian: string;
  assignedGrammarianEmail: string;
  reviewStatus: GrammarReviewStatus;
  feedback: string;
  certificateStatus: CertificateStatus;
  certificateNumber?: string;
  issuedAt?: string;
  certificateFile?: string;
};

const GRAMMAR_REVIEW_STORAGE_KEY = "project-pulse-grammar-review-assignments";

const defaultAssignments: GrammarReviewAssignment[] = [
  {
    id: 2,
    finalSubmissionId: 2,
    groupName: "ArchiveLink",
    course: "BSIS",
    section: "4A",
    projectTitle: "Digital Records Request and Archive System",
    adviser: "Marco Reyes",
    documentTitle: "Final Manuscript",
    manuscriptFile: "archivelink-final-manuscript.pdf",
    sentBy: "Dean Office",
    sentAt: "May 12, 2026",
    assignedGrammarian: "Grammarian Office",
    assignedGrammarianEmail: "grammarian.office@ub.edu.ph",
    reviewStatus: "Certified",
    feedback: "Minor grammar corrections completed.",
    certificateStatus: "Issued",
    certificateNumber: "GRAM-2026-0002",
    issuedAt: "May 13, 2026",
    certificateFile: "GRAM-2026-0002-certification-of-editing.pdf",
  },
];

export const registeredGrammarians = [
  {
    name: "Grammarian Office",
    email: "grammarian.office@ub.edu.ph",
  },
  {
    name: "Maria Santos",
    email: "maria.santos@ub.edu.ph",
  },
  {
    name: "Liza Reyes",
    email: "liza.reyes@ub.edu.ph",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function splitCourseSection(course: string) {
  const [courseCode, section = ""] = course.split(" ");

  return {
    course: courseCode || course,
    section,
  };
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function getCertificateNumber(id: number) {
  return `GRAM-2026-${String(id).padStart(4, "0")}`;
}

export function getStoredGrammarReviews() {
  if (!canUseStorage()) return defaultAssignments;

  const saved = window.localStorage.getItem(GRAMMAR_REVIEW_STORAGE_KEY);

  if (!saved) {
    saveStoredGrammarReviews(defaultAssignments);
    return defaultAssignments;
  }

  return JSON.parse(saved) as GrammarReviewAssignment[];
}

export function saveStoredGrammarReviews(items: GrammarReviewAssignment[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    GRAMMAR_REVIEW_STORAGE_KEY,
    JSON.stringify(items),
  );
}

export function routeFinalSubmissionToGrammarian(
  submission: FinalSubmission,
  grammarian: { name: string; email: string },
) {
  const assignments = getStoredGrammarReviews();
  const existing = assignments.find(
    (item) => item.finalSubmissionId === submission.id,
  );
  const now = new Date();
  const { course, section } = splitCourseSection(submission.course);

  const assignment: GrammarReviewAssignment = {
    id: existing?.id ?? Date.now(),
    finalSubmissionId: submission.id,
    groupName: submission.groupName,
    course,
    section,
    projectTitle: submission.projectTitle,
    adviser: "Dean routed",
    documentTitle: "Final Manuscript",
    manuscriptFile: submission.finalManuscript,
    sentBy: "Dean Office",
    sentAt: formatDate(now),
    assignedGrammarian: grammarian.name,
    assignedGrammarianEmail: grammarian.email,
    reviewStatus: "For Grammar Review",
    feedback: existing?.feedback || "",
    certificateStatus: "Not Issued",
  };

  const nextAssignments = existing
    ? assignments.map((item) =>
        item.finalSubmissionId === submission.id ? assignment : item,
      )
    : [assignment, ...assignments];

  saveStoredGrammarReviews(nextAssignments);

  updateFinalSubmission(submission.id, {
    assignedGrammarian: grammarian.name,
    assignedGrammarianEmail: grammarian.email,
    grammarReviewStatus: "Sent to Grammarian",
    grammarianCertificateStatus: "Pending",
    status: "Sent to Grammarian",
    remarks: `Routed to ${grammarian.name} for grammar review.`,
  });

  return nextAssignments;
}

export function updateGrammarReview(
  id: number,
  updates: Partial<GrammarReviewAssignment>,
) {
  const assignments = getStoredGrammarReviews().map((item) =>
    item.id === id ? { ...item, ...updates } : item,
  );

  saveStoredGrammarReviews(assignments);
  return assignments;
}

export function returnGrammarReviewForRevision(id: number, feedback: string) {
  const assignment = getStoredGrammarReviews().find((item) => item.id === id);

  if (!assignment) return getStoredGrammarReviews();

  updateFinalSubmission(assignment.finalSubmissionId, {
    grammarReviewStatus: "Returned for Revision",
    status: "Rejected",
    remarks: feedback,
  });

  return updateGrammarReview(id, {
    reviewStatus: "Returned for Revision",
    feedback,
  });
}

export function certifyGrammarReview(id: number, feedback: string) {
  const assignment = getStoredGrammarReviews().find((item) => item.id === id);

  if (!assignment) return getStoredGrammarReviews();

  const certificateNumber =
    assignment.certificateNumber || getCertificateNumber(assignment.id);
  const issuedAt = formatDate(new Date());
  const certificateFile = `${certificateNumber}-certification-of-editing.pdf`;

  updateFinalSubmission(assignment.finalSubmissionId, {
    grammarCertificate: certificateFile,
    grammarReviewStatus: "Certified",
    grammarianCertificateStatus: "Generated",
    status: "Grammar Certified",
    remarks: `Certification of Editing returned by ${assignment.assignedGrammarian}.`,
  });

  return updateGrammarReview(id, {
    reviewStatus: "Certified",
    feedback: feedback || "Manuscript certified by grammarian.",
    certificateStatus: "Issued",
    certificateNumber,
    issuedAt,
    certificateFile,
  });
}

export function syncCertifiedSubmissionsForDean() {
  const assignments = getStoredGrammarReviews();
  const submissions = getStoredFinalSubmissions();

  assignments
    .filter((item) => item.reviewStatus === "Certified")
    .forEach((assignment) => {
      const submission = submissions.find(
        (item) => item.id === assignment.finalSubmissionId,
      );

      if (!submission || submission.grammarianCertificateStatus === "Verified") {
        return;
      }

      updateFinalSubmission(assignment.finalSubmissionId, {
        grammarCertificate: assignment.certificateFile || "",
        grammarReviewStatus: "Certified",
        grammarianCertificateStatus: "Generated",
        status: "Grammar Certified",
      });
    });
}
