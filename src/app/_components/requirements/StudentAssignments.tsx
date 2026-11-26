"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import FormsShelf from "./FormsShelf";
import StudentTitleProposals from "../groups/StudentTitleProposals";
import VersionHistory from "./VersionHistory";
import { apiFetch, downloadRequirementAttachment, openSubmissionInTab } from "../../_lib/api";
import { errorMessage, fetchMyGroup, type ApiGroup } from "../../_lib/groups";
import {
  describeFileRules,
  newestAssignmentsFirst,
  submissionMoment,
  describeStatus,
  describeTitleProposal,
  feedbackFor,
  formatDate,
  formatDateTime,
  isOverdue,
  toneDot,
  type ApiRequirement,
  type ApiSubmission,
} from "../../_lib/requirements";
import RowToggle from "../RowToggle";
import { focusId, readFocus, scrollToFocus } from "../../_lib/focus";

type Tab = "todo" | "review" | "done";

// School-style names for the three lists.
const tabLabels: Record<Tab, string> = {
  todo: "Assignments",
  review: "Pending",
  done: "Completed",
};

function tabOf(requirement: ApiRequirement): Tab {
  if (requirement.kind === "Title Proposal") return describeTitleProposal(requirement.title_summary).tab;

  const submission = requirement.submission;

  if (!submission || submission.status === "Needs Revision") return "todo";

  const { label } = describeStatus(requirement, submission);

  return label === "Under review" || label === "Grammar check" ? "review" : "done";
}

// The student's assignments and forms, one list per tab. It sits on the Requirements page, and inside a subject card (then only that subject's:
// AppDev = the adviser's, CAP101-2 = the Dean's).
export default function StudentAssignments({
  subject = null,
  startOnForms = false,
  embedded = false,
}: {
  subject?: "appdev" | "cap" | null;
  startOnForms?: boolean;
  embedded?: boolean;
}) {
  const [requirements, setRequirements] = useState<ApiRequirement[]>([]);
  const [group, setGroup] = useState<ApiGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("todo");
  const [openId, setOpenId] = useState<number | null>(null);
  const [showForms, setShowForms] = useState(startOnForms);

  const load = useCallback(async () => {
    try {
      const [list, myGroup] = await Promise.all([
        apiFetch<ApiRequirement[]>("/requirements"),
        fetchMyGroup(),
      ]);

      setRequirements(list);
      setGroup(myGroup);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load your requirements."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  // A notice may name one assignment (?requirement=5): show the tab it is in, open it and scroll to it, once.
  const focusDone = useRef(false);

  useEffect(() => {
    if (loading || focusDone.current) return;
    focusDone.current = true;

    const wanted = readFocus().requirement;
    const target = wanted ? requirements.find((item) => item.requirement_id === wanted) : undefined;

    if (!target) return;

    queueMicrotask(() => {
      setShowForms(false);
      setTab(tabOf(target));
      setOpenId(target.requirement_id);
    });
    scrollToFocus(focusId.requirement(target.requirement_id));
  }, [loading, requirements]);

  const inSubject = useCallback((item: ApiRequirement) => (subject === "appdev" ? item.scope === "Adviser" : subject === "cap" ? item.scope !== "Adviser" : true), [subject]);

  const counts = useMemo(() => {
    const result: Record<Tab, number> = { todo: 0, review: 0, done: 0 };

    for (const requirement of requirements.filter(inSubject)) result[tabOf(requirement)] += 1;

    return result;
  }, [requirements, inSubject]);

  const visible = showForms ? [] : requirements.filter((requirement) => inSubject(requirement) && tabOf(requirement) === tab);

  // One list, the newest on top: a new assignment first under Assignments; under Pending and Completed, the one sent or reviewed last.
  const ordered =
    tab === "todo"
      ? newestAssignmentsFirst(visible)
      : [...visible].sort(
          (a, b) =>
            submissionMoment(b.submission) - submissionMoment(a.submission) ||
            Date.parse(b.created_at ?? "") - Date.parse(a.created_at ?? "") ||
            b.requirement_id - a.requirement_id,
        );

  return (
    <>
      <div className="w-full">
        {subject && !embedded && (
          <p className="mb-4 text-sm text-[#59645d]">
            Showing the <span className="font-semibold text-[#203028]">{subject === "appdev" ? "AppDev" : "CAP101-2"}</span> assignments and forms.{" "}
            <Link href="/student/requirements" className="font-semibold text-[#4f8f58] hover:underline">
              Show everything
            </Link>
          </p>
        )}
        <p className="text-sm text-[#7b877f]">
          Everything your adviser and the department need from your group.
        </p>

        <div className="mt-6 flex gap-6 border-b border-[#edf2ec] text-sm" role="tablist">
          {(Object.keys(tabLabels) as Tab[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={!showForms && tab === id}
              onClick={() => {
                setShowForms(false);
                setTab(id);
              }}
              className={`-mb-px border-b-2 pb-3 transition ${
                !showForms && tab === id
                  ? "border-[#123f2b] font-semibold text-[#203028]"
                  : "border-transparent text-[#7b877f] hover:text-[#203028]"
              }`}
            >
              {tabLabels[id]}
              <span className="ml-1.5 text-xs text-[#9aa59e]">{counts[id]}</span>
            </button>
          ))}
          {!embedded && (
            <button
              type="button"
              role="tab"
              aria-selected={showForms}
              onClick={() => setShowForms(true)}
              className={`-mb-px border-b-2 pb-3 transition ${
                showForms
                  ? "border-[#123f2b] font-semibold text-[#203028]"
                  : "border-transparent text-[#7b877f] hover:text-[#203028]"
              }`}
            >
              Forms
            </button>
          )}
        </div>

        {showForms && (
          <div className="mt-6 [&>div]:max-w-none">
            <FormsShelf role="Student" from={subject === "appdev" ? "Adviser" : subject === "cap" ? "Dean" : undefined} />
          </div>
        )}

        {error && !showForms && (
          <p role="alert" className="mt-5 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        {loading && !showForms && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

        {!loading && !showForms && ordered.length === 0 && (
          <p className="mt-10 text-center text-sm text-[#9aa59e]">
            {tab === "todo"
              ? "Nothing left to do. You are all caught up."
              : tab === "review"
                ? "Nothing is waiting for review."
                : "Approved assignments will show here."}
          </p>
        )}

        {ordered.length > 0 && (
          <ul className="mt-6 space-y-3">
            {ordered.map((requirement) => (
              <RequirementRow
                key={requirement.requirement_id}
                requirement={requirement}
                group={group}
                open={openId === requirement.requirement_id}
                onToggle={() => setOpenId((current) => (current === requirement.requirement_id ? null : requirement.requirement_id))}
                onSaved={() => void load()}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}

function RequirementRow({
  requirement,
  group,
  open,
  onToggle,
  onSaved,
}: {
  requirement: ApiRequirement;
  group: ApiGroup | null;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const submission = requirement.submission ?? null;
  const isTitle = requirement.kind === "Title Proposal";
  const status = isTitle ? describeTitleProposal(requirement.title_summary) : describeStatus(requirement, submission);
  const feedback = feedbackFor(submission);
  const overdue = (isTitle ? status.tone === "idle" || status.tone === "problem" : !submission) && isOverdue(requirement.due_date);
  const locked = submission?.status === "Approved";
  // Some assignments take one file at a time: no replacing while it waits for review.
  const held = !requirement.allow_resubmission && submission?.status === "Submitted";
  // Every submission (the first and each new version) is one attempt, up to what the adviser or the Dean allowed.
  const attemptsUsed = submission?.version_no ?? 0;
  const outOfAttempts = !isTitle && !locked && attemptsUsed >= requirement.max_attempts;

  const [file, setFile] = useState<File | null>(null);
  const [link, setLink] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");

    try {
      const body = new FormData();
      if (requirement.submission_type === "File" && file) body.append("file", file);
      if (requirement.submission_type === "Link") body.append("link_url", link.trim());
      if (notes.trim()) body.append("notes", notes.trim());

      await apiFetch(`/requirements/${requirement.requirement_id}/submissions`, {
        method: "POST",
        body,
      });

      setFile(null);
      setLink("");
      setNotes("");
      onSaved();
    } catch (err) {
      setMessage(errorMessage(err, "Unable to submit."));
    }

    setSaving(false);
  }

  async function openFile(current: ApiSubmission) {
    try {
      await openSubmissionInTab(current.submission_id, current.file_name);
    } catch (err) {
      setMessage(errorMessage(err, "Unable to open the file."));
    }
  }

  return (
    <li id={focusId.requirement(requirement.requirement_id)} className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="group flex w-full items-center gap-4 px-4 py-3.5 text-left transition hover:bg-[#fbfdfb]"
      >
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#203028]">{requirement.title}</p>
          <p className={`mt-0.5 text-xs ${overdue ? "text-[#b42318]" : "text-[#7b877f]"}`}>
            {requirement.stage} · {requirement.due_date ? `Due ${formatDate(requirement.due_date)}` : "No due date"}
            {overdue ? " · overdue" : ""}
            {requirement.submission_type === "Link" ? " · link" : ""}
          </p>
        </div>

        <span className="flex w-32 shrink-0 items-center gap-2 text-xs text-[#59645d]">
          <span className={`h-2 w-2 shrink-0 rounded-full ${toneDot[status.tone]}`} />
          {status.label}
        </span>
        <RowToggle open={open} />
      </button>

      {open && (
        <div className="space-y-5 border-t border-[#edf2ec] bg-[#fbfdfb] px-4 py-5 text-sm">
          {requirement.description && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa59e]">
                {requirement.created_by ? `From ${requirement.created_by}` : "Instructions"}
              </p>
              <p className="mt-1.5 whitespace-pre-line leading-6 text-[#59645d]">{requirement.description}</p>
            </div>
          )}

          {requirement.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {requirement.attachments.map((file) => (
                <button
                  key={file.attachment_id}
                  type="button"
                  onClick={() => void downloadRequirementAttachment(requirement.requirement_id, file.attachment_id, file.name).catch((err) => setMessage(errorMessage(err, "Unable to open the file.")))}
                  className="flex items-center gap-2 rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                >
                  <span className="text-[#7b877f]">Guide</span>
                  {file.name}
                </button>
              ))}
            </div>
          )}

          {isTitle && group && <StudentTitleProposals group={group} onChanged={onSaved} />}

          {feedback?.text && (
            <div className="border-l-2 border-rose-300 pl-3">
              <p className="text-xs font-semibold text-[#203028]">{feedback.from} says</p>
              <p className="mt-1 leading-6 text-[#59645d]">{feedback.text}</p>
            </div>
          )}

          {submission && (
            <div className="text-xs leading-6 text-[#7b877f]">
              <p>
                Version {submission.version_no} · {submission.submitted_by ? `Submitted by ${submission.submitted_by} · ` : "Submitted "}
                {formatDateTime(submission.submitted_at)}
              </p>

              {submission.has_file && (
                <button
                  type="button"
                  onClick={() => void openFile(submission)}
                  className="font-semibold text-[#4f8f58] hover:underline"
                >
                  {submission.file_name}
                </button>
              )}

              {submission.link_url && (
                <a
                  href={submission.link_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all font-semibold text-[#4f8f58] hover:underline"
                >
                  {submission.link_url}
                </a>
              )}

              {submission.received_at && (
                <p>Received by the Dean&apos;s Secretary on {formatDate(submission.received_at)}.</p>
              )}

              <div className="pt-1">
                <VersionHistory
                  submissionId={submission.submission_id}
                  versionNo={submission.version_no}
                />
              </div>
            </div>
          )}

          {isTitle ? null : outOfAttempts ? (
            <p className="text-xs text-[#7b877f]">
              You have used all {requirement.max_attempts} attempts for this assignment. Ask your adviser if you need another.
            </p>
          ) : held ? (
            <p className="text-xs text-[#7b877f]">
              Your file is waiting for review. You can send a new version if your adviser asks for changes.
            </p>
          ) : locked ? (
            <p className="text-xs text-[#7b877f]">This requirement is approved. No further changes are needed.</p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-xs font-semibold text-[#203028]">
                {submission ? "Send a new version" : "Submit"}
                <span className="ml-2 font-normal text-[#7b877f]">
                  Attempt {attemptsUsed + 1} of {requirement.max_attempts}
                </span>
              </p>

              {requirement.submission_type === "File" ? (
                <input
                  type="file"
                  accept={requirement.allowed_types.map((type) => `.${type}`).join(",")}
                  onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                  className="block w-full text-xs text-[#59645d] file:mr-3 file:rounded-lg file:border file:border-[#dfe8df] file:bg-white file:px-3 file:py-2 file:text-xs file:font-semibold file:text-[#203028] hover:file:bg-[#f3f7f1]"
                />
              ) : (
                <input
                  type="url"
                  value={link}
                  onChange={(event) => setLink(event.target.value)}
                  placeholder="https://"
                  className="w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              )}

              <textarea
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Note for your adviser (optional)"
                rows={2}
                maxLength={1000}
                className="w-full resize-none rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />

              {message && (
                <p role="alert" className="text-xs text-[#b42318]">
                  {message}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={
                    saving ||
                    (requirement.submission_type === "File" ? !file : !link.trim())
                  }
                  className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
                >
                  {saving ? "Sending..." : "Send"}
                </button>

                {requirement.submission_type === "File" && (
                  <span className="text-[11px] text-[#9aa59e]">{describeFileRules(requirement)}</span>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
