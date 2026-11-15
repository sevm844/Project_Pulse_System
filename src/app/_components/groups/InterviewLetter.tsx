"use client";

import type { JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ApiError } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { fetchInterviewLetter, saveInterviewLetter, type InterviewLetterState } from "../../_lib/interviewLetter";
import { formatDateTime } from "../../_lib/requirements";
import ProposalEditor from "./ProposalEditor";

type Given = Extract<InterviewLetterState, { given: true }>;

// The student's side of the letter for interview. Nothing shows until the adviser gives it. Then the group rewrites it for its own
// project (replacing the [brackets]), saves it, and downloads it as a PDF to print before the adviser sends the group to the Dean.
export default function InterviewLetter({ groupId, groupName }: { groupId: number; groupName: string }) {
  const [letter, setLetter] = useState<Given | null>(null);
  // What the page started with. It changes only when the letter is (re)loaded, never when the student saves: handing the editor
  // a new document after every save would reset what is being typed.
  const [start, setStart] = useState<JSONContent | null>(null);
  const [editorKey, setEditorKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [stale, setStale] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const draft = useRef<JSONContent | null>(null);

  const loaded = useRef(false);

  // Loads the letter once. A later answer must never replace what the student is typing, so only the "Load the latest version"
  // button (force) may load again.
  const load = useCallback(
    async (force = false) => {
      try {
        if (loaded.current && !force) return;
        const state = await fetchInterviewLetter(groupId);
        if (loaded.current && !force) return;

        if (state.given) {
          loaded.current = true;
          setLetter(state);
          setStart(state.content);
          draft.current = state.content;
          setEditorKey((key) => key + 1);
          setDirty(false);
          setStale(false);
        }
      } catch {
        // The letter is optional until the adviser gives it; a failed check simply shows nothing.
      }
    },
    [groupId],
  );

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  if (!letter) return null;

  // Saves what is on the page. Returns the content that was saved (or null when it could not be).
  async function save(): Promise<JSONContent | null> {
    if (!letter || !draft.current) return null;

    setSaving(true);
    setError("");
    setNotice("");

    try {
      const state = await saveInterviewLetter(groupId, draft.current, letter.revision);

      if (state.given) {
        setLetter(state);
        setDirty(false);
        setNotice("Saved.");
      }

      setSaving(false);

      return draft.current;
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) setStale(true);
      setError(errorMessage(err, "Unable to save the letter."));
      setSaving(false);

      return null;
    }
  }

  async function download() {
    setBusy(true);
    setError("");

    try {
      // What is printed is always what is saved: save any new typing first.
      const content = dirty ? await save() : (draft.current ?? letter?.content ?? null);

      if (content) {
        const { downloadLetterPdf } = await import("../../_lib/manuscriptExport/letter");
        await downloadLetterPdf(content, `Letter for interview ${groupName}`);
      }
    } catch (err) {
      setError(errorMessage(err, "The PDF could not be made. Please try again."));
    }

    setBusy(false);
  }

  const canEdit = letter.can_edit;

  return (
    <section aria-label="Letter for interview" className="rounded-xl border border-[#dfe8df] bg-white p-4">
      <h3 className="text-sm font-semibold text-[#203028]">Letter for interview</h3>
      <p className="mt-1 text-xs leading-5 text-[#59645d]">
        Your adviser gave you this letter. Replace everything in [square brackets] with your own details and rewrite any part for your project. Then
        download it as a PDF and print it. Bring the printed letter to the Dean&apos;s office once your adviser sends you there.
      </p>

      <div className="mt-3">
        <ProposalEditor
          key={editorKey}
          initial={start ?? letter.content}
          keepEmpty
          label="Letter for interview"
          onChange={(content) => {
            draft.current = content;
            setDirty(true);
            setNotice("");
          }}
        />
      </div>

      {error && (
        <p role="alert" className="mt-3 text-xs text-[#b42318]">
          {error}
        </p>
      )}

      {stale && (
        <button type="button" onClick={() => void load(true)} className="mt-2 text-xs font-semibold text-[#123f2b] underline">
          Load the latest version
        </button>
      )}

      {notice && !error && (
        <p role="status" className="mt-3 text-xs text-[#2f6f3a]">
          {notice}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {canEdit && (
          <button
            type="button"
            disabled={saving || busy || !dirty}
            onClick={() => void save()}
            className="rounded-lg border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-40"
          >
            {saving ? "Saving..." : "Save letter"}
          </button>
        )}
        <button
          type="button"
          disabled={saving || busy}
          onClick={() => void download()}
          className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-40"
        >
          {busy ? "Making the PDF..." : "Download PDF"}
        </button>
        <span className="text-[11px] text-[#9aa59e]">
          {dirty
            ? "You have changes that are not saved yet."
            : letter.edited_at
              ? `Last saved by ${letter.edited_by ?? "a member"} on ${formatDateTime(letter.edited_at)}`
              : `Given by ${letter.given_by ?? "your adviser"} on ${formatDateTime(letter.given_at)}`}
        </span>
      </div>
    </section>
  );
}
