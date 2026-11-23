"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import CollapsibleTitle from "./CollapsibleTitle";
import { apiFetch } from "../../_lib/api";
import { errorMessage, type ApiGroup, type ApiTitleSubmission } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";
import type { JSONContent } from "@tiptap/react";
import ProposalEditor from "./ProposalEditor";
import ProposalView from "./ProposalView";

const emptyForm = { proposed_title: "" };

const inputClass =
  "w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]";

// The student side of the Title Proposal assignment: send up to 3 titles, read the adviser's decisions.
export default function StudentTitleProposals({ group, onChanged }: { group: ApiGroup; onChanged: () => void }) {
  const project = group.project;
  const [titles, setTitles] = useState<ApiTitleSubmission[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [content, setContent] = useState<JSONContent | null>(null);
  const [editorKey, setEditorKey] = useState(0); // a new key starts a blank page after sending
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
          proposal_content: content,
        }),
      });

      setForm(emptyForm);
      setContent(null);
      setEditorKey((key) => key + 1);
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
      {canPropose && project?.dean_return && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
          <p className="text-xs font-semibold text-amber-800">The Dean asked your adviser to look at your titles again</p>
          <p className="mt-1 whitespace-pre-line text-sm text-[#203028]">{project.dean_return.note}</p>
          <p className="mt-1 text-xs text-[#7b877f]">Your adviser may ask you for a new or revised title.</p>
        </div>
      )}

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
        <form onSubmit={submit} className="space-y-3 rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
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

          <ProposalEditor
            key={editorKey}
            onChange={setContent}
            hint="Write your proposal here. For example: the context of your project, who it is for, and the technologies you will use and why."
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

      <div className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
        <p className="text-xs font-semibold text-[#203028]">Your proposals</p>

        {titles.length === 0 && <p className="mt-2 text-xs text-[#9aa59e]">You have not proposed a title yet.</p>}

        <ul className="mt-2 divide-y divide-[#edf2ec]">
          {titles.map((item) => (
            <li key={item.title_id} className="py-3">
              <CollapsibleTitle
                title={item.proposed_title}
                meta={`${item.submitted_by ? `Submitted by ${item.submitted_by.name} · ` : "Sent "}${formatDateTime(item.submitted_at)}`}
                status={item.title_status}
              >
                {item.review_remarks && (
                  <div className="mt-2 border-l-2 border-rose-300 pl-3">
                    <p className="text-xs font-semibold text-[#203028]">Adviser says</p>
                    <p className="mt-0.5 text-xs leading-5 text-[#59645d]">{item.review_remarks}</p>
                  </div>
                )}

                <ProposalView item={item} />
              </CollapsibleTitle>
            </li>
          ))}
        </ul>
      </div>

      {titles.some((item) => item.title_status === "Approved") && (
        <p className="rounded-lg bg-[#f8faf7] p-3 text-xs leading-5 text-[#59645d]">
          <span className="font-semibold text-[#203028]">Next step:</span> do your letter for interview. Download the form from the Forms tab at the top of this page, fill it in, and have it ready before you go to the Dean.
        </p>
      )}
    </div>
  );
}
