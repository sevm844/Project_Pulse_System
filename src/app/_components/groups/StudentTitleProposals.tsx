"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { titleStatusClass } from "../ProposalStage";
import { apiFetch } from "../../_lib/api";
import { errorMessage, type ApiGroup, type ApiTitleSubmission } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";

const emptyForm = { proposed_title: "", project_description: "", technology_stack: "" };

const inputClass =
  "w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]";

// The student side of the Title Proposal assignment: send up to 3 titles, read the adviser's decisions.
export default function StudentTitleProposals({ group, onChanged }: { group: ApiGroup; onChanged: () => void }) {
  const project = group.project;
  const [titles, setTitles] = useState<ApiTitleSubmission[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!project) return;

    try {
      setTitles(await apiFetch<ApiTitleSubmission[]>(`/projects/${project.project_id}/titles`));
    } catch (err) {
      setError(errorMessage(err, "Unable to load your title proposals."));
    }
  }, [project]);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!project) return;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      await apiFetch(`/projects/${project.project_id}/titles`, {
        method: "POST",
        body: JSON.stringify({
          proposed_title: form.proposed_title.trim(),
          project_description: form.project_description.trim() || null,
          technology_stack: form.technology_stack.trim() || null,
        }),
      });

      setForm(emptyForm);
      setNotice("Sent to your adviser for review.");
      await load();
      onChanged();
    } catch (err) {
      setError(errorMessage(err, "Unable to submit the title proposal."));
    }

    setSaving(false);
  }

  const stage = project?.proposal_stage ?? "Title Proposal";
  const canPropose = stage === "Title Proposal" && group.group_status === "Active";
  const inPlay = titles.filter((item) => item.title_status === "Pending" || item.title_status === "Approved").length;

  return (
    <div className="space-y-5">
      {!canPropose && (
        <p className="text-xs text-[#7b877f]">
          {group.group_status !== "Active"
            ? "This group is no longer active."
            : "Title proposals are closed. Your adviser already sent your approved titles to the Dean."}
        </p>
      )}

      {canPropose && inPlay >= 3 && (
        <p className="text-xs text-[#7b877f]">
          You already have 3 titles waiting for a decision or approved. Your adviser decides which to send to the Dean.
        </p>
      )}

      {canPropose && inPlay < 3 && (
        <form onSubmit={submit} className="space-y-3">
          <p className="text-xs font-semibold text-[#203028]">Propose a title ({3 - inPlay} left)</p>

          <input
            required
            maxLength={255}
            value={form.proposed_title}
            onChange={(event) => setForm((current) => ({ ...current, proposed_title: event.target.value }))}
            placeholder="Proposed title"
            aria-label="Proposed Title"
            className={inputClass}
          />

          <textarea
            rows={3}
            maxLength={5000}
            value={form.project_description}
            onChange={(event) => setForm((current) => ({ ...current, project_description: event.target.value }))}
            placeholder="What will it do? (optional)"
            aria-label="Description"
            className={`${inputClass} resize-none leading-6`}
          />

          <input
            maxLength={255}
            value={form.technology_stack}
            onChange={(event) => setForm((current) => ({ ...current, technology_stack: event.target.value }))}
            placeholder="Technology stack, e.g. Next.js, Laravel, PostgreSQL (optional)"
            aria-label="Technology Stack"
            className={inputClass}
          />

          {error && (
            <p role="alert" className="text-xs text-[#b42318]">
              {error}
            </p>
          )}

          {notice && (
            <p role="status" className="text-xs text-[#2f6f3a]">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={saving || !form.proposed_title.trim()}
            className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
          >
            {saving ? "Sending..." : "Send to Adviser"}
          </button>
        </form>
      )}

      {!canPropose && error && (
        <p role="alert" className="text-xs text-[#b42318]">
          {error}
        </p>
      )}

      <div>
        <p className="text-xs font-semibold text-[#203028]">Your proposals</p>

        {titles.length === 0 && <p className="mt-2 text-xs text-[#9aa59e]">You have not proposed a title yet.</p>}

        <ul className="mt-2 divide-y divide-[#edf2ec]">
          {titles.map((item) => (
            <li key={item.title_id} className="py-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#203028]">{item.proposed_title}</p>
                  <p className="mt-0.5 text-[11px] text-[#9aa59e]">
                    Sent {formatDate(item.submitted_at)}
                    {item.technology_stack ? ` · ${item.technology_stack}` : ""}
                  </p>
                </div>

                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${titleStatusClass[item.title_status]}`}>
                  {item.title_status}
                </span>
              </div>

              {item.project_description && (
                <p className="mt-2 text-xs leading-5 text-[#59645d]">{item.project_description}</p>
              )}

              {item.review_remarks && (
                <div className="mt-2 border-l-2 border-rose-300 pl-3">
                  <p className="text-xs font-semibold text-[#203028]">Adviser says</p>
                  <p className="mt-0.5 text-xs leading-5 text-[#59645d]">{item.review_remarks}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
