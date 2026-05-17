export type GrammarReviewStatus =
  | "For Grammar Review"
  | "Reviewed"
  | "Returned for Revision";

export type CertificateStatus = "Not Issued" | "Issued";

export type GrammarReview = {
  id: number;
  groupName: string;
  course: string;
  section: string;
  projectTitle: string;
  adviser: string;
  documentTitle: string;
  submittedAt: string;
  reviewStatus: GrammarReviewStatus;
  feedback: string;
  certificateStatus: CertificateStatus;
  certificateNumber?: string;
  issuedAt?: string;
};

export const grammarReviews: GrammarReview[] = [
  {
    id: 1,
    groupName: "WBS Test Group",
    course: "BSIT",
    section: "4A",
    projectTitle: "WBS Group Management System",
    adviser: "Anna Cruz",
    documentTitle: "Final Manuscript Draft",
    submittedAt: "May 15, 2026",
    reviewStatus: "For Grammar Review",
    feedback: "",
    certificateStatus: "Not Issued",
  },
  {
    id: 2,
    groupName: "ArchiveLink",
    course: "BSIS",
    section: "4A",
    projectTitle: "Digital Records Request and Archive System",
    adviser: "Marco Reyes",
    documentTitle: "Final Manuscript",
    submittedAt: "May 12, 2026",
    reviewStatus: "Reviewed",
    feedback: "Minor grammar corrections completed.",
    certificateStatus: "Issued",
    certificateNumber: "GRAM-2026-0002",
    issuedAt: "May 13, 2026",
  },
];

export function getGrammarSummary(items = grammarReviews) {
  return {
    forReview: items.filter((item) => item.reviewStatus === "For Grammar Review")
      .length,
    feedbackProvided: items.filter((item) => item.feedback.trim()).length,
    certificatesIssued: items.filter(
      (item) => item.certificateStatus === "Issued",
    ).length,
    returned: items.filter(
      (item) => item.reviewStatus === "Returned for Revision",
    ).length,
  };
}
