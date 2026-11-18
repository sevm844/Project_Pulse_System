"use client";

import { useState } from "react";
import { apiFetch, downloadSubmission } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import VersionHistory from "./VersionHistory";
import {
  describeStatus,
  formatDate,
  isOverdue,
  toneDot,
  type ApiRequirement,
  type ApiSubmission,
  type ApiSubmissionRow,
  type StaffRole,
} from "../../_lib/requirements";
import { matchesGroupFilter, type GroupFacts, type GroupFilter } from "./GroupFilterBar";

export function rowFacts(
  requirement: ApiRequirement,
  row: ApiSubmissionRow,
): GroupFacts {
  return {
    name: row.group_name,
    course: row.course,
    section: row.section,
    status: describeStatus(requirement, row.submission).label,
  };
}

export function filterRows(
  requirement: ApiRequirement,
  rows: ApiSubmissionRow[],
  filter: GroupFilter,
) {
  return rows.filter((row) =>
    matchesGroupFilter(rowFacts(requirement, row), filter),
  );
}

export default function SubmissionRow({
  role,
  requirement,
  row,
  onChanged,
  onError,
}: {
  role: StaffRole;
  requirement: ApiRequirement;
  row: ApiSubmissionRow;
  onChanged: (message: string) => void;
  onError: (message: string) => void;
}) {
  const submission = row.submission;
  const status = describeStatus(requirement, submission);
  const overdue = !submission && isOverdue(requirement.due_date);

  const [remarks, setRemarks] = useState("");
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  // Every group starts closed, like the Title Proposal list: open only the team you are working on.
  const [expanded, setExpanded] = useState(false);

  async function send(path: string, body: object | null, message: string) {
    setBusy(true);
    onError("");

    try {
      await apiFetch(`/submissions/${submission?.submission_id}/${path}`, {
        method: "PUT",
        // A decision names the version it was made on, so a newer upload is never approved by mistake.
        body: body
          ? JSON.stringify({ ...body, version_no: submission?.version_no })
          : undefined,
      });

      setAsking(false);
      setRemarks("");
      onChanged(`${row.group_name}: ${message}`);
    } catch (err) {
      onError(errorMessage(err, "Unable to save."));
    }

    setBusy(false);
  }

  async function openFile(current: ApiSubmission) {
    try {
      await downloadSubmission(current.submission_id, current.file_name);
    } catch (err) {
      onError(errorMessage(err, "Unable to open the file."));
    }
  }

  // Which decision (if any) belongs to this role for this submission right now.
  const reviewPath = role === "Grammarian" ? "grammar-review" : "review";
  const canDecide = Boolean(
    submission &&
    (((role === "Adviser" || role === "Dean") &&
      submission.status === "Submitted") ||
      (role === "Grammarian" &&
        submission.status === "Approved" &&
        submission.grammar_status === null)),
  );
  const canReceive =
    role === "Coordinator" &&
    submission?.status === "Approved" &&
    !submission.received_at &&
    (!requirement.needs_grammar_check ||
      submission.grammar_status === "Approved");

  return (
    <li className="px-4 py-3.5">
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        className="flex w-full flex-wrap items-center justify-between gap-3 text-left"
      >
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#203028]">
            {row.group_name}
          </p>
          <p className="mt-0.5 text-xs text-[#7b877f]">
            {row.course} {row.section}
            {role !== "Adviser" && row.adviser ? ` · ${row.adviser}` : ""}
            {submission
              ? ` · Version ${submission.version_no}, ${formatDate(submission.submitted_at)}`
              : ""}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`flex items-center gap-2 text-xs ${overdue ? "text-[#b42318]" : "text-[#59645d]"}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${overdue ? "bg-rose-500" : toneDot[status.tone]}`}
            />
            {overdue ? "Overdue" : status.label}
          </span>
          <span className="text-xs font-semibold text-[#4f8f58]">
            {expanded ? "Hide ▲" : "Open ▼"}
          </span>
        </div>
      </button>

      {expanded && (
        <div>
          {(submission?.has_file || submission?.link_url) && (
            <div className="mt-2 flex gap-4">
              {submission?.has_file && (
                <button
                  type="button"
                  onClick={() => void openFile(submission)}
                  className="text-xs font-semibold text-[#4f8f58] hover:underline"
                >
                  Open file
                </button>
              )}
              {submission?.link_url && (
                <a
                  href={submission.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs font-semibold text-[#4f8f58] hover:underline"
                >
                  Open link
                </a>
              )}
            </div>
          )}

          {submission && (submission.submitted_by || submission.notes) && (
            <p className="mt-1.5 text-[11px] text-[#9aa59e]">
              {submission.submitted_by ? `Sent by ${submission.submitted_by}` : ""}
              {submission.submitted_by && submission.notes ? " · " : ""}
              {submission.notes ? `“${submission.notes}”` : ""}
            </p>
          )}

          {submission && (
            <div className="mt-1.5">
              <VersionHistory
                submissionId={submission.submission_id}
                versionNo={submission.version_no}
              />
            </div>
          )}

          {!submission && (
            <p className="mt-2 text-xs text-[#9aa59e]">
              This group has not submitted yet.
            </p>
          )}

          {submission?.review_remarks &&
            submission.status === "Needs Revision" && (
              <p className="mt-1.5 text-[11px] text-[#7b877f]">
                Revision asked: {submission.review_remarks}
              </p>
            )}

          {canDecide && (
            <div className="mt-3">
              {asking ? (
                <div className="space-y-2">
                  <textarea
                    value={remarks}
                    onChange={(event) => setRemarks(event.target.value)}
                    placeholder="What should the students fix? (required)"
                    rows={2}
                    maxLength={2000}
                    className="w-full resize-none rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />
                  <div className="flex gap-2 text-xs font-semibold">
                    <button
                      type="button"
                      disabled={busy || !remarks.trim()}
                      onClick={() =>
                        void send(
                          reviewPath,
                          { status: "Needs Revision", remarks: remarks.trim() },
                          "sent back for revision.",
                        )
                      }
                      className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                    >
                      Send back
                    </button>
                    <button
                      type="button"
                      onClick={() => setAsking(false)}
                      className="rounded-lg px-3 py-1.5 text-[#59645d] hover:bg-[#f3f7f1]"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2 text-xs font-semibold">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() =>
                      void send(reviewPath, { status: "Approved" }, "approved.")
                    }
                    className="rounded-lg bg-[#123f2b] px-3 py-1.5 text-white hover:bg-[#0f3324] disabled:opacity-40"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => setAsking(true)}
                    className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-[#59645d] hover:bg-[#f3f7f1]"
                  >
                    Request revision
                  </button>
                </div>
              )}
            </div>
          )}

          {canReceive && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void send("receive", null, "marked as received.")}
              className="mt-3 rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
            >
              Mark as received
            </button>
          )}

          {role === "Coordinator" && submission?.received_at && (
            <p className="mt-1.5 text-[11px] text-[#2f6f3a]">
              Received {formatDate(submission.received_at)}
            </p>
          )}
        </div>
      )}
    </li>
  );
}
