"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, downloadRequirementAttachment, downloadSubmission } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import AdviserTitleReview from "../groups/AdviserTitleReview";
import VersionHistory from "./VersionHistory";
import {
  attentionCount,
  attentionLabel,
  describeFileRules,
  describeStatus,
  formatDate,
  isOverdue,
  toneDot,
  type ApiRequirement,
  type ApiSubmission,
  type ApiSubmissionRow,
  type StaffRole,
} from "../../_lib/requirements";
import { REQUIREMENT_STAGES } from "../../_utils/projectWorkflow";
import RequirementDialog from "./RequirementDialog";

const copy: Record<StaffRole, { blurb: string; empty: string }> = {
  Adviser: {
    blurb: "Ask your groups for chapters, forms or links, then review what they send.",
    empty: "No requirements yet. Create one and your groups will see it right away.",
  },
  Dean: {
    blurb: "Set requirements for every group or one course, and watch progress across the program.",
    empty: "No requirements yet. Create one and students will see it right away.",
  },
  Coordinator: {
    blurb: "Final outputs from every group. Mark each one as received once it is approved.",
    empty: "No final outputs yet. They appear when an adviser or the Dean marks a requirement as a final output.",
  },
  Grammarian: {
    blurb: "Documents your advisers approved and flagged for a grammar check.",
    empty: "Nothing to check yet. Requirements flagged for a grammar check will appear here.",
  },
};

function attention(role: StaffRole, requirement: ApiRequirement) {
  return attentionLabel(role, attentionCount(role, requirement));
}

function scopeLabel(requirement: ApiRequirement, role: StaffRole) {
  if (requirement.sections && requirement.sections.length > 0) return requirement.sections.join(", ");
  if (requirement.scope === "Adviser") return role === "Adviser" ? "All my sections" : "One adviser's groups";
  if (requirement.scope === "Course") return `${requirement.course} groups`;
  return "All groups";
}

export default function StaffRequirements({ role }: { role: StaffRole }) {
  const [requirements, setRequirements] = useState<ApiRequirement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [stage, setStage] = useState("All");
  const [openId, setOpenId] = useState<number | null>(null);
  const [rows, setRows] = useState<ApiSubmissionRow[]>([]);
  const [rowsLoading, setRowsLoading] = useState(false);
  const [dialog, setDialog] = useState<{ requirement?: ApiRequirement } | null>(null);

  const canCreate = role === "Adviser" || role === "Dean";

  const loadRequirements = useCallback(async () => {
    try {
      setRequirements(await apiFetch<ApiRequirement[]>("/requirements"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load requirements."));
    }

    setLoading(false);
  }, []);

  const loadRows = useCallback(async (id: number) => {
    setRowsLoading(true);

    try {
      setRows(await apiFetch<ApiSubmissionRow[]>(`/requirements/${id}/submissions`));
    } catch (err) {
      setRows([]);
      setError(errorMessage(err, "Unable to load submissions."));
    }

    setRowsLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void loadRequirements());
  }, [loadRequirements]);

  function toggle(id: number) {
    if (openId === id) {
      setOpenId(null);
      return;
    }

    setOpenId(id);
    setRows([]);
    setNotice("");

    // The Title Proposal has no uploaded files: it shows the title review instead.
    if (requirements.find((item) => item.requirement_id === id)?.kind !== "Title Proposal") void loadRows(id);
  }

  // Called after a review, so the counts and the open table stay accurate.
  async function refresh(message?: string) {
    if (message) setNotice(message);
    const openIsTitle = requirements.find((item) => item.requirement_id === openId)?.kind === "Title Proposal";
    await Promise.all([loadRequirements(), openId && !openIsTitle ? loadRows(openId) : Promise.resolve()]);
  }

  async function remove(requirement: ApiRequirement) {
    if (!window.confirm(`Delete "${requirement.title}"?`)) return;

    try {
      await apiFetch(`/requirements/${requirement.requirement_id}`, { method: "DELETE" });
      setOpenId(null);
      await refresh("Requirement deleted.");
    } catch (err) {
      setError(errorMessage(err, "Unable to delete the requirement."));
    }
  }

  const visible = requirements.filter((item) => stage === "All" || item.stage === stage);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <p className="max-w-xl text-sm leading-6 text-[#7b877f]">{copy[role].blurb}</p>

        {canCreate && (
          <button
            type="button"
            onClick={() => setDialog({})}
            className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
          >
            New requirement
          </button>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between gap-3 border-b border-[#edf2ec] pb-3">
        <p className="text-xs text-[#9aa59e]">
          {visible.length} requirement{visible.length === 1 ? "" : "s"}
        </p>

        <select
          value={stage}
          onChange={(event) => setStage(event.target.value)}
          aria-label="Filter by stage"
          className="rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs text-[#59645d] outline-none"
        >
          {["All", ...REQUIREMENT_STAGES].map((item) => (
            <option key={item} value={item}>
              {item === "All" ? "All stages" : item}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-[#b42318]">
          {error}
        </p>
      )}

      {notice && (
        <p role="status" className="mt-4 text-sm text-[#2f6f3a]">
          {notice}
        </p>
      )}

      {loading && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

      {!loading && visible.length === 0 && !error && (
        <p className="mt-12 text-center text-sm text-[#9aa59e]">
          {requirements.length === 0 ? copy[role].empty : "No requirements for this stage."}
        </p>
      )}

      <ul className="mt-2 divide-y divide-[#edf2ec]">
        {visible.map((requirement) => {
          const stats = requirement.stats;
          const open = openId === requirement.requirement_id;
          const flag = attention(role, requirement);
          const progress = stats && stats.groups > 0 ? Math.round((stats.submitted / stats.groups) * 100) : 0;
          const canEdit = role === "Dean" || (role === "Adviser" && requirement.scope === "Adviser");
          const isTitle = requirement.kind === "Title Proposal";

          return (
            <li key={requirement.requirement_id}>
              <button
                type="button"
                onClick={() => toggle(requirement.requirement_id)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-6 py-4 text-left"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#203028]">{requirement.title}</p>
                  <p className="mt-0.5 text-xs text-[#7b877f]">
                    {requirement.stage}
                    {requirement.due_date ? ` · Due ${formatDate(requirement.due_date)}` : ""}
                    {` · ${scopeLabel(requirement, role)}`}
                    {requirement.needs_grammar_check ? " · Grammar check" : ""}
                    {requirement.is_final_output ? " · Final output" : ""}
                  </p>
                </div>

                <div className="flex shrink-0 items-center gap-5">
                  {flag && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      {flag}
                    </span>
                  )}

                  {stats && (
                    <div className="hidden w-32 sm:block">
                      <div className="h-1 rounded-full bg-[#edf2ec]">
                        <div className="h-1 rounded-full bg-[#4f8f58]" style={{ width: `${progress}%` }} />
                      </div>
                      <p className="mt-1.5 text-right text-[11px] text-[#9aa59e]">
                        {stats.submitted} of {stats.groups} submitted
                      </p>
                    </div>
                  )}
                </div>
              </button>

              {open && (
                <div className="mb-4 rounded-xl border border-[#edf2ec] bg-[#fbfdfb]">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf2ec] px-4 py-3">
                    <p className="max-w-xl text-xs leading-5 text-[#59645d]">
                      {requirement.description || "No instructions were added."}
                      {requirement.created_by ? ` — ${requirement.created_by}` : ""}
                      {requirement.kind === "Standard" && requirement.submission_type === "File" && (
                        <span className="mt-1 block text-[#9aa59e]">{describeFileRules(requirement)}</span>
                      )}
                      {requirement.attachment_name && (
                        <button
                          type="button"
                          onClick={() => void downloadRequirementAttachment(requirement.requirement_id, requirement.attachment_name).catch((err) => setError(errorMessage(err, "Unable to open the file.")))}
                          className="mt-1 block font-semibold text-[#4f8f58] hover:underline"
                        >
                          Template: {requirement.attachment_name}
                        </button>
                      )}
                    </p>

                    {canEdit && (
                      <div className="flex gap-3 text-xs font-semibold">
                        <button type="button" onClick={() => setDialog({ requirement })} className="text-[#4f8f58] hover:underline">
                          Edit
                        </button>
                        {!isTitle && (
                          <button type="button" onClick={() => void remove(requirement)} className="text-[#b42318] hover:underline">
                            Delete
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {isTitle && role === "Adviser" && (
                    <AdviserTitleReview
                      sections={requirement.sections}
                      onChanged={() => void loadRequirements()}
                    />
                  )}

                  {!isTitle && rowsLoading && <p className="px-4 py-6 text-xs text-[#7b877f]">Loading submissions...</p>}

                  {!isTitle && !rowsLoading && rows.length === 0 && (
                    <p className="px-4 py-6 text-xs text-[#9aa59e]">
                      {role === "Grammarian"
                        ? "No approved documents are waiting for a grammar check."
                        : "No groups to show yet."}
                    </p>
                  )}

                  <ul className="divide-y divide-[#edf2ec]">
                    {!isTitle && rows.map((row) => (
                      <SubmissionRow
                        key={row.project_id}
                        role={role}
                        requirement={requirement}
                        row={row}
                        onChanged={(message) => void refresh(message)}
                        onError={setError}
                      />
                    ))}
                  </ul>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {dialog && canCreate && (
        <RequirementDialog
          role={role as "Adviser" | "Dean"}
          requirement={dialog.requirement}
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            void refresh(dialog.requirement ? "Requirement updated." : "Requirement created.");
          }}
        />
      )}
    </div>
  );
}

function SubmissionRow({
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

  async function send(path: string, body: object | null, message: string) {
    setBusy(true);
    onError("");

    try {
      await apiFetch(`/submissions/${submission?.submission_id}/${path}`, {
        method: "PUT",
        body: body ? JSON.stringify(body) : undefined,
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
  const reviewPath =
    role === "Grammarian" ? "grammar-review" : "review";
  const canDecide = Boolean(
    submission &&
      (((role === "Adviser" || role === "Dean") && submission.status === "Submitted") ||
        (role === "Grammarian" &&
          submission.status === "Approved" &&
          submission.grammar_status === null)),
  );
  const canReceive =
    role === "Coordinator" &&
    submission?.status === "Approved" &&
    !submission.received_at &&
    (!requirement.needs_grammar_check || submission.grammar_status === "Approved");

  return (
    <li className="px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#203028]">{row.group_name}</p>
          <p className="mt-0.5 text-xs text-[#7b877f]">
            {row.course} {row.section}
            {role !== "Adviser" && row.adviser ? ` · ${row.adviser}` : ""}
          </p>
        </div>

        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-2 text-xs ${overdue ? "text-[#b42318]" : "text-[#59645d]"}`}>
            <span className={`h-2 w-2 rounded-full ${overdue ? "bg-rose-500" : toneDot[status.tone]}`} />
            {overdue ? "Overdue" : status.label}
          </span>

          {submission?.has_file && (
            <button type="button" onClick={() => void openFile(submission)} className="text-xs font-semibold text-[#4f8f58] hover:underline">
              Open file
            </button>
          )}

          {submission?.link_url && (
            <a href={submission.link_url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-[#4f8f58] hover:underline">
              Open link
            </a>
          )}
        </div>
      </div>

      {submission && (
        <p className="mt-1.5 text-[11px] text-[#9aa59e]">
          Version {submission.version_no} · {formatDate(submission.submitted_at)}
          {submission.submitted_by ? ` · ${submission.submitted_by}` : ""}
          {submission.notes ? ` · “${submission.notes}”` : ""}
        </p>
      )}

      {submission && (
        <div className="mt-1.5">
          <VersionHistory submissionId={submission.submission_id} versionNo={submission.version_no} />
        </div>
      )}

      {submission?.review_remarks && submission.status === "Needs Revision" && (
        <p className="mt-1.5 text-[11px] text-[#7b877f]">Revision asked: {submission.review_remarks}</p>
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
                  onClick={() => void send(reviewPath, { status: "Needs Revision", remarks: remarks.trim() }, "sent back for revision.")}
                  className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-rose-700 hover:bg-rose-100 disabled:opacity-40"
                >
                  Send back
                </button>
                <button type="button" onClick={() => setAsking(false)} className="rounded-lg px-3 py-1.5 text-[#59645d] hover:bg-[#f3f7f1]">
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 text-xs font-semibold">
              <button
                type="button"
                disabled={busy}
                onClick={() => void send(reviewPath, { status: "Approved" }, "approved.")}
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
        <p className="mt-1.5 text-[11px] text-[#2f6f3a]">Received {formatDate(submission.received_at)}</p>
      )}
    </li>
  );
}
