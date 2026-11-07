"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import StudentShell from "../_components/StudentShell";
import VersionHistory from "../../_components/requirements/VersionHistory";
import { apiFetch, downloadSubmission } from "../../_lib/api";
import { errorMessage, fetchMyGroup } from "../../_lib/groups";
import {
  describeStatus,
  feedbackFor,
  formatDate,
  isOverdue,
  toneDot,
  type ApiRequirement,
  type ApiSubmission,
} from "../../_lib/requirements";
import { PROJECT_STAGES } from "../../_utils/projectWorkflow";

type Tab = "todo" | "review" | "done";

const tabLabels: Record<Tab, string> = {
  todo: "To do",
  review: "In review",
  done: "Done",
};

function tabOf(requirement: ApiRequirement): Tab {
  const submission = requirement.submission;

  if (!submission || submission.status === "Needs Revision") return "todo";

  const { label } = describeStatus(requirement, submission);

  return label === "Under review" || label === "Grammar check" ? "review" : "done";
}

export default function StudentRequirementsPage() {
  const [requirements, setRequirements] = useState<ApiRequirement[]>([]);
  const [hasTitle, setHasTitle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<Tab>("todo");
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const [list, group] = await Promise.all([
        apiFetch<ApiRequirement[]>("/requirements"),
        fetchMyGroup(),
      ]);

      setRequirements(list);
      setHasTitle(Boolean(group?.project?.project_title));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load your requirements."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  const counts = useMemo(() => {
    const result: Record<Tab, number> = { todo: 0, review: 0, done: 0 };

    for (const requirement of requirements) result[tabOf(requirement)] += 1;

    // The project title is always the first requirement.
    result[hasTitle ? "done" : "todo"] += 1;

    return result;
  }, [hasTitle, requirements]);

  const visible = requirements.filter((requirement) => tabOf(requirement) === tab);

  const byStage = PROJECT_STAGES.map((stage) => ({
    stage,
    items: visible.filter((requirement) => requirement.stage === stage),
  })).filter((section) => section.items.length > 0);

  return (
    <StudentShell title="Requirements">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-[#7b877f]">
          Everything your adviser and the department need from your group.
        </p>

        <div className="mt-6 flex gap-6 border-b border-[#edf2ec] text-sm" role="tablist">
          {(Object.keys(tabLabels) as Tab[]).map((id) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 pb-3 transition ${
                tab === id
                  ? "border-[#123f2b] font-semibold text-[#203028]"
                  : "border-transparent text-[#7b877f] hover:text-[#203028]"
              }`}
            >
              {tabLabels[id]}
              <span className="ml-1.5 text-xs text-[#9aa59e]">{counts[id]}</span>
            </button>
          ))}
        </div>

        {error && (
          <p role="alert" className="mt-5 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        {tab !== "review" && (tab === "done") === hasTitle && (
          <Link
            href="/student/project"
            className="mt-6 flex items-center justify-between gap-4 rounded-xl border border-[#edf2ec] px-4 py-3.5 transition hover:bg-[#fbfdfb]"
          >
            <div>
              <p className="text-sm font-semibold text-[#203028]">Project title</p>
              <p className="mt-0.5 text-xs text-[#7b877f]">
                Proposal Defense · {hasTitle ? "Approved by your adviser" : "Submit title proposals to your adviser"}
              </p>
            </div>

            <span className="flex items-center gap-2 text-xs text-[#59645d]">
              <span className={`h-2 w-2 rounded-full ${hasTitle ? toneDot.done : toneDot.idle}`} />
              {hasTitle ? "Approved" : "Not submitted"}
            </span>
          </Link>
        )}

        {loading && <p className="mt-8 text-sm text-[#7b877f]">Loading...</p>}

        {!loading && byStage.length === 0 && (tab === "review" || (tab === "done") !== hasTitle) && (
          <p className="mt-10 text-center text-sm text-[#9aa59e]">
            {tab === "todo"
              ? "Nothing left to do. You are all caught up."
              : tab === "review"
                ? "Nothing is waiting for review."
                : "Approved requirements will show here."}
          </p>
        )}

        {byStage.map((section) => (
          <section key={section.stage} className="mt-8">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#9aa59e]">
              {section.stage}
            </h2>

            <ul className="mt-3 divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec]">
              {section.items.map((requirement) => (
                <RequirementRow
                  key={requirement.requirement_id}
                  requirement={requirement}
                  open={openId === requirement.requirement_id}
                  onToggle={() =>
                    setOpenId((current) =>
                      current === requirement.requirement_id ? null : requirement.requirement_id,
                    )
                  }
                  onSaved={() => void load()}
                />
              ))}
            </ul>
          </section>
        ))}
      </div>
    </StudentShell>
  );
}

function RequirementRow({
  requirement,
  open,
  onToggle,
  onSaved,
}: {
  requirement: ApiRequirement;
  open: boolean;
  onToggle: () => void;
  onSaved: () => void;
}) {
  const submission = requirement.submission ?? null;
  const status = describeStatus(requirement, submission);
  const feedback = feedbackFor(submission);
  const overdue = !submission && isOverdue(requirement.due_date);
  const locked = submission?.status === "Approved";

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
      await downloadSubmission(current.submission_id, current.file_name);
    } catch (err) {
      setMessage(errorMessage(err, "Unable to open the file."));
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition hover:bg-[#fbfdfb]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#203028]">{requirement.title}</p>
          <p className={`mt-0.5 text-xs ${overdue ? "text-[#b42318]" : "text-[#7b877f]"}`}>
            {requirement.due_date ? `Due ${formatDate(requirement.due_date)}` : "No due date"}
            {overdue ? " · overdue" : ""}
            {requirement.submission_type === "Link" ? " · link" : ""}
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-2 text-xs text-[#59645d]">
          <span className={`h-2 w-2 rounded-full ${toneDot[status.tone]}`} />
          {status.label}
        </span>
      </button>

      {open && (
        <div className="space-y-5 border-t border-[#edf2ec] bg-[#fbfdfb] px-4 py-5 text-sm">
          {requirement.description && (
            <p className="leading-6 text-[#59645d]">{requirement.description}</p>
          )}

          {feedback?.text && (
            <div className="border-l-2 border-rose-300 pl-3">
              <p className="text-xs font-semibold text-[#203028]">{feedback.from} says</p>
              <p className="mt-1 leading-6 text-[#59645d]">{feedback.text}</p>
            </div>
          )}

          {submission && (
            <div className="text-xs leading-6 text-[#7b877f]">
              <p>
                Version {submission.version_no} · sent {formatDate(submission.submitted_at)}
                {submission.submitted_by ? ` by ${submission.submitted_by}` : ""}
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
                <p>Received by the Research Coordinator on {formatDate(submission.received_at)}.</p>
              )}

              <div className="pt-1">
                <VersionHistory
                  submissionId={submission.submission_id}
                  versionNo={submission.version_no}
                />
              </div>
            </div>
          )}

          {locked ? (
            <p className="text-xs text-[#7b877f]">This requirement is approved. No further changes are needed.</p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-xs font-semibold text-[#203028]">
                {submission ? "Send a new version" : "Submit"}
              </p>

              {requirement.submission_type === "File" ? (
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.png,.jpg,.jpeg"
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
                  <span className="text-[11px] text-[#9aa59e]">PDF, Word, PowerPoint, ZIP or image, up to 10 MB</span>
                )}
              </div>
            </form>
          )}
        </div>
      )}
    </li>
  );
}
