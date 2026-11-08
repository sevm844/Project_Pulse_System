export type SubmissionStatus = "Submitted" | "Needs Revision" | "Approved";

export type ApiSubmission = {
  submission_id: number;
  requirement_id: number;
  project_id: number;
  status: SubmissionStatus;
  version_no: number;
  file_name: string | null;
  has_file: boolean;
  link_url: string | null;
  notes: string | null;
  submitted_at: string | null;
  submitted_by: string | null;
  review_remarks: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  grammar_status: "Approved" | "Needs Revision" | null;
  grammar_remarks: string | null;
  received_at: string | null;
};

// Where a group stands in the Title Proposal assignment (students only).
export type TitleSummary = {
  stage: string;
  total: number;
  pending: number;
  approved: number;
  needs_revision: number;
};

export type ApiRequirement = {
  requirement_id: number;
  title: string;
  description: string | null;
  stage: string;
  submission_type: "File" | "Link";
  due_date: string | null;
  course: string | null;
  scope: "Adviser" | "Course" | "Program";
  // 'Title Proposal' is the built-in first assignment; everything else is 'Standard'.
  kind: "Standard" | "Title Proposal";
  // "BSIT 4A" style labels the assignment is limited to (null = all of the adviser's groups).
  sections: string[] | null;
  // What students may upload for it.
  allowed_types: string[];
  max_file_mb: number;
  allow_resubmission: boolean;
  // A file from the adviser (template, guide) students can download.
  attachment_name: string | null;
  needs_grammar_check: boolean;
  is_final_output: boolean;
  created_by: string | null;
  created_at: string | null;
  // Students get their own group's submission; staff get counts.
  submission?: ApiSubmission | null;
  title_summary?: TitleSummary;
  stats?: {
    groups: number;
    submitted: number;
    awaiting_review: number;
    needs_revision: number;
    approved: number;
    awaiting_grammar: number;
    received: number;
  };
};

export type ApiSubmissionRow = {
  project_id: number;
  group_id: number;
  group_name: string;
  course: string;
  section: string;
  adviser: string | null;
  submission: ApiSubmission | null;
};

export type StatusTone = "idle" | "waiting" | "problem" | "done";

export const toneDot: Record<StatusTone, string> = {
  idle: "bg-[#c5cdc7]",
  waiting: "bg-amber-400",
  problem: "bg-rose-500",
  done: "bg-emerald-500",
};

// The one label a student sees for a requirement, plus how it should look.
export function describeStatus(
  requirement: Pick<ApiRequirement, "needs_grammar_check" | "is_final_output">,
  submission: ApiSubmission | null | undefined,
): { label: string; tone: StatusTone } {
  if (!submission) return { label: "Not submitted", tone: "idle" };

  if (submission.status === "Needs Revision") {
    return { label: "Needs revision", tone: "problem" };
  }

  if (submission.status === "Submitted") {
    return { label: "Under review", tone: "waiting" };
  }

  if (requirement.needs_grammar_check && submission.grammar_status === null) {
    return { label: "Grammar check", tone: "waiting" };
  }

  if (requirement.is_final_output) {
    return submission.received_at
      ? { label: "Received", tone: "done" }
      : { label: "Approved", tone: "done" };
  }

  return { label: "Approved", tone: "done" };
}

// The one label a student sees for the Title Proposal, and which tab it belongs in.
export function describeTitleProposal(summary: TitleSummary | undefined): {
  label: string;
  tone: StatusTone;
  tab: "todo" | "review" | "done";
} {
  if (!summary || summary.total === 0) return { label: "Not started", tone: "idle", tab: "todo" };

  if (summary.stage === "Ready for Proposal Defense") return { label: "Done", tone: "done", tab: "done" };
  if (summary.stage === "Dean's Endorsement") return { label: "With the Dean", tone: "waiting", tab: "review" };
  if (summary.stage === "Client Consultation") return { label: "Client consultation", tone: "waiting", tab: "review" };

  if (summary.pending > 0) return { label: "Under review", tone: "waiting", tab: "review" };
  if (summary.approved > 0) return { label: "Approved by adviser", tone: "waiting", tab: "review" };

  return { label: "Needs revision", tone: "problem", tab: "todo" };
}

export const FILE_TYPES = ["pdf", "doc", "docx", "ppt", "pptx", "zip", "png", "jpg", "jpeg"];

// "PDF, DOCX · up to 5 MB" (every type is shown as "Any file type").
export function describeFileRules(requirement: Pick<ApiRequirement, "allowed_types" | "max_file_mb">) {
  const types =
    requirement.allowed_types.length >= FILE_TYPES.length
      ? "Any file type"
      : requirement.allowed_types.map((type) => type.toUpperCase()).join(", ");

  return `${types} · up to ${requirement.max_file_mb} MB`;
}

// "BSIT 4A, BSIT 4B" or "All sections".
export function sectionsLabel(sections: string[] | null | undefined) {
  return sections && sections.length > 0 ? sections.join(", ") : "All sections";
}

// What a reviewer wrote that the student should read.
export function feedbackFor(submission: ApiSubmission | null | undefined) {
  if (!submission || submission.status !== "Needs Revision") return null;

  return submission.grammar_status === "Needs Revision"
    ? { from: "Grammarian", text: submission.grammar_remarks }
    : { from: "Adviser", text: submission.review_remarks };
}

export function formatDate(value: string | null) {
  if (!value) return "";

  // A plain date (due date) is read as local time so it never shifts a day.
  const date = /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? new Date(`${value}T00:00:00`)
    : new Date(value);

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "Asia/Manila",
  });
}

export function isOverdue(dueDate: string | null) {
  if (!dueDate) return false;

  return new Date(`${dueDate}T23:59:59`).getTime() < Date.now();
}

export type ApiSubmissionVersion = {
  version_no: number;
  file_name: string | null;
  has_file: boolean;
  link_url: string | null;
  notes: string | null;
  submitted_at: string | null;
  outcome: SubmissionStatus;
  remarks: string | null;
};

export type StaffRole = "Adviser" | "Dean" | "Coordinator" | "Grammarian";

// How many groups are waiting on this role for one requirement.
export function attentionCount(role: StaffRole, requirement: ApiRequirement) {
  const stats = requirement.stats;
  if (!stats) return 0;

  if (role === "Grammarian") return stats.awaiting_grammar;

  if (role === "Coordinator") {
    return Math.max(stats.approved - stats.received - stats.awaiting_grammar, 0);
  }

  return stats.awaiting_review;
}

export function attentionLabel(role: StaffRole, count: number) {
  if (count <= 0) return null;
  if (role === "Grammarian") return `${count} to check`;
  if (role === "Coordinator") return `${count} to receive`;
  return `${count} to review`;
}
