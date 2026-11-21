"use client";

import { EditorContent, useEditor, type JSONContent } from "@tiptap/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ManuscriptExportDialog from "./ManuscriptExportDialog";
import ManuscriptHistory from "./ManuscriptHistory";
import SimilarityReports from "./SimilarityReports";
import PagedScroll from "./PagedScroll";
import Toolbar from "./Toolbar";
import { createManuscriptExtensions } from "./extensions";
import { ApiError } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { importWordFile } from "../../_lib/manuscriptImport";
import { fetchMyManuscript, saveManuscriptDraft, submitManuscriptVersion, type DroppedContent, type ManuscriptReviewResult } from "../../_lib/manuscript";
import { formatDateTime } from "../../_lib/requirements";

type SaveState = "loading" | "saved" | "dirty" | "saving" | "error" | "conflict";

const AUTOSAVE_MS = 1500;
const wordCount = (text: string) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// The student's manuscript: type here, it saves by itself, and "Submit version" freezes a copy for the adviser and Dean.
export default function ManuscriptEditor() {
  const [state, setState] = useState<SaveState>("loading");
  const [message, setMessage] = useState("");
  const [projectId, setProjectId] = useState<number | null>(null);
  const [info, setInfo] = useState<{ savedAt: string | null; savedBy: string | null; unsubmitted: boolean }>({
    savedAt: null,
    savedBy: null,
    unsubmitted: false,
  });
  const [reloadKey, setReloadKey] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [note, setNote] = useState("");
  const [submitOpen, setSubmitOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [toolbarError, setToolbarError] = useState("");
  const [loadError, setLoadError] = useState("");
  const [pages, setPages] = useState(1);
  const [removed, setRemoved] = useState<DroppedContent | null>(null);
  const [importing, setImporting] = useState(false);
  const [importNote, setImportNote] = useState("");
  const [latestVersion, setLatestVersion] = useState(0);
  // The adviser's decision on the latest submitted version.
  const [latestReview, setLatestReview] = useState<ManuscriptReviewResult | null>(null);
  const wordFileRef = useRef<HTMLInputElement>(null);
  const extensions = useMemo(() => createManuscriptExtensions(setPages), []);

  const revision = useRef(0);
  const dirty = useRef(false);
  const saving = useRef(false);
  const conflict = useRef(false);
  // The last save was refused: wait for the next edit or the Try again button instead of retrying in a loop.
  const failed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const editor = useEditor({
    extensions,
    content: "",
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: false,
    editorProps: { attributes: { class: "manuscript-sheet", "aria-label": "Manuscript" } },
    onUpdate: () => {
      dirty.current = true;
      failed.current = false;
      if (conflict.current) return;

      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void saveRef.current(), AUTOSAVE_MS);
    },
  });

  const save = useCallback(async () => {
    if (!editor || conflict.current) return;
    if (saving.current) return;
    if (!dirty.current) return;

    saving.current = true;
    dirty.current = false;
    setState("saving");

    try {
      const result = await saveManuscriptDraft(editor.getJSON(), revision.current);
      revision.current = result.draft_revision;
      setInfo({ savedAt: result.saved_at, savedBy: result.saved_by, unsubmitted: result.has_unsubmitted_changes });
      setMessage("");
      setState(dirty.current ? "dirty" : "saved");

      // Pasted pictures from other sites, odd links and styles cannot be kept. Show what is really saved.
      if (result.dropped.images + result.dropped.links + result.dropped.styles > 0) {
        // Only pictures and links are worth telling the student about; odd style values just fall back to the default.
        if (result.dropped.images + result.dropped.links > 0) setRemoved(result.dropped);
        if (result.content && !dirty.current) {
          const at = editor.state.selection.from;
          editor.commands.setContent(result.content, { emitUpdate: false });
          editor.commands.setTextSelection(Math.min(at, editor.state.doc.content.size));
        }
      }
    } catch (err) {
      dirty.current = true;

      if (err instanceof ApiError && err.status === 409) {
        conflict.current = true;
        setMessage(err.message);
        setState("conflict");
      } else {
        failed.current = true;
        setMessage(errorMessage(err, "Your last changes could not be saved."));
        setState("error");
      }
    }

    saving.current = false;

    // More typing arrived while saving: save again soon (unless something is wrong).
    if (dirty.current && !conflict.current && !failed.current && !timer.current) {
      timer.current = setTimeout(() => void saveRef.current(), AUTOSAVE_MS);
    }
  }, [editor]);

  useEffect(() => {
    saveRef.current = async () => {
      timer.current = null;
      await save();
    };
  }, [save]);

  // Load the draft once the editor exists.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;

    fetchMyManuscript()
      .then((loaded) => {
        if (cancelled) return;
        editor.commands.setContent(loaded.draft, { emitUpdate: false });
        editor.setEditable(true, false);
        revision.current = loaded.draft_revision;
        setProjectId(loaded.project_id);
        setLatestVersion(loaded.versions.reduce((highest, item) => Math.max(highest, item.version_no), 0));
        setLatestReview([...loaded.versions].sort((a, b) => b.version_no - a.version_no)[0]?.review ?? null);
        setInfo({ savedAt: loaded.saved_at, savedBy: loaded.saved_by, unsubmitted: loaded.has_unsubmitted_changes });
        setState("saved");
      })
      .catch((err) => {
        if (!cancelled) setLoadError(errorMessage(err, "Unable to open the manuscript."));
      });

    return () => {
      cancelled = true;
    };
  }, [editor]);

  // Do not lose typing when the page is closed or left.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current || saving.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);

    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
      if (dirty.current) void saveRef.current();
    };
  }, []);

  // Save what is typed now and wait until the server has it.
  async function flush() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    while (saving.current) await sleep(100);
    if (dirty.current) await save();
    while (saving.current) await sleep(100);

    return !dirty.current && !conflict.current;
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");

    try {
      if (!(await flush())) {
        setSubmitError("Your latest changes are not saved yet. Fix the problem shown above, then try again.");
        setSubmitting(false);
        return;
      }

      const frozen = await submitManuscriptVersion(revision.current, note);
      setLatestVersion((current) => Math.max(current, frozen.version_no ?? current + 1));
      setLatestReview(null);
      setInfo((current) => ({ ...current, unsubmitted: false }));
      setReloadKey((key) => key + 1);
      setSubmitOpen(false);
      setNote("");
    } catch (err) {
      setSubmitError(errorMessage(err, "Unable to submit this version."));
    }

    setSubmitting(false);
  }

  async function reloadLatest() {
    if (!editor) return;

    try {
      const latest = await fetchMyManuscript();
      editor.commands.setContent(latest.draft, { emitUpdate: false });
      revision.current = latest.draft_revision;
      dirty.current = false;
      conflict.current = false;
      setInfo({ savedAt: latest.saved_at, savedBy: latest.saved_by, unsubmitted: latest.has_unsubmitted_changes });
      setMessage("");
      setState("saved");
    } catch (err) {
      setMessage(errorMessage(err, "Unable to reload the manuscript."));
    }
  }

  // A Word file is added at the end of the draft (nothing is replaced; Undo takes it back). It saves like any other typing.
  async function addWordFile(file: File | undefined) {
    if (wordFileRef.current) wordFileRef.current.value = "";
    if (!file || !editor || conflict.current) return;

    setImporting(true);
    setImportNote("");
    setToolbarError("");

    try {
      const imported = await importWordFile(file);

      if (imported.empty) {
        setToolbarError("That Word file has no text or pictures to add.");
      } else {
        editor.chain().focus("end").insertContent(imported.html).run();
        setImportNote(
          `Added "${file.name}" at the end of your draft. Check the headings, lists and tables, then adjust fonts and spacing if you need to.` +
            (imported.skippedPictures > 0
              ? ` ${imported.skippedPictures} ${imported.skippedPictures === 1 ? "picture" : "pictures"} could not be brought in; add ${imported.skippedPictures === 1 ? "it" : "them"} with the picture button.`
              : ""),
        );
      }
    } catch (err) {
      setToolbarError(err instanceof Error ? err.message : "That Word file could not be added.");
    }

    setImporting(false);
  }

  function useVersionAsDraft(content: JSONContent) {
    if (!editor || conflict.current) return;
    editor.commands.setContent(content, { emitUpdate: true });
  }

  if (loadError) {
    return <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</p>;
  }

  const hasNewerChanges = info.unsubmitted || state === "dirty" || state === "saving";

  const status =
    state === "loading" ? "Opening..." :
    state === "saving" ? "Saving..." :
    state === "dirty" ? "Unsaved changes..." :
    state === "error" ? "Not saved" :
    state === "conflict" ? "Out of date" :
    info.savedAt ? `All changes saved · ${info.savedBy ?? "someone"}, ${formatDateTime(info.savedAt)}` : "Nothing typed yet";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[#203028]">Manuscript</h2>
          {state !== "loading" && (
            <p className={`mt-0.5 text-xs font-semibold ${latestVersion === 0 || hasNewerChanges || latestReview?.decision === "Needs Changes" ? "text-amber-700" : "text-[#1f7a4a]"}`}>
              {latestVersion === 0
                ? "Draft · nothing submitted to your adviser yet"
                : `Version ${latestVersion} ${
                    latestReview?.decision === "Approved"
                      ? "approved by your adviser"
                      : latestReview?.decision === "Needs Changes"
                        ? "needs changes: see your adviser's note in Versions"
                        : "submitted, waiting for your adviser"
                  }${hasNewerChanges ? " · your draft has newer changes your adviser cannot see yet" : ""}`}
            </p>
          )}
          <p role="status" className={`mt-0.5 text-xs ${state === "error" || state === "conflict" ? "text-red-600" : "text-[#7b877f]"}`}>
            {status}
          </p>
        </div>
        <button
          type="button"
          disabled={state === "loading" || state === "conflict" || !(info.unsubmitted || state === "dirty" || state === "saving")}
          onClick={() => {
            setSubmitError("");
            setSubmitOpen(true);
          }}
          className="rounded-full bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
        >
          Submit version
        </button>
      </div>

      {state === "conflict" && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p>{message} What you typed since then has not been saved.</p>
          <button type="button" onClick={() => void reloadLatest()} className="rounded-full bg-amber-700 px-4 py-1.5 font-semibold text-white hover:bg-amber-800">
            Load the latest draft
          </button>
        </div>
      )}

      {state === "error" && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <p>{message}</p>
          <button
            type="button"
            onClick={() => {
              failed.current = false;
              void save();
            }}
            className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700">
            Try again
          </button>
        </div>
      )}

      {removed && (
        <div role="status" className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p>
            Some of what you pasted cannot be kept in the document and was left out:{" "}
            {[
              removed.images > 0 && `${removed.images} ${removed.images === 1 ? "picture" : "pictures"} (add pictures with the picture button in the toolbar)`,
              removed.links > 0 && `${removed.links} ${removed.links === 1 ? "link" : "links"} (the words stay)`,
            ]
              .filter(Boolean)
              .join(", ")}
            . The rest of your text was saved.
          </p>
          <button type="button" onClick={() => setRemoved(null)} className="rounded-full border border-amber-300 px-3 py-1 font-semibold hover:bg-amber-100">
            Dismiss
          </button>
        </div>
      )}

      {importNote && (
        <div role="status" className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-[#cfe0d3] bg-[#f3f8f4] px-4 py-3 text-xs text-[#123f2b]">
          <p>{importNote}</p>
          <button type="button" onClick={() => setImportNote("")} className="rounded-full border border-[#cfe0d3] px-3 py-1 font-semibold hover:bg-[#e8f1ea]">
            Dismiss
          </button>
        </div>
      )}

      {toolbarError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          {toolbarError}
        </p>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-[#eef2ee]">
          {editor && <Toolbar editor={editor} onError={setToolbarError} />}
          <PagedScroll pages={pages} className="max-h-[75vh] p-5">
            <EditorContent editor={editor} />
          </PagedScroll>
          <div className="flex items-center justify-between border-t border-[#dfe8df] bg-white px-4 py-2 text-xs text-[#59645d]">
            <span>{pages} {pages === 1 ? "page" : "pages"}</span>
            <span className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={!editor || state === "loading" || state === "conflict" || importing}
                onClick={() => wordFileRef.current?.click()}
                className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-50"
              >
                {importing ? "Reading the file..." : "Import from Word"}
              </button>
              <input
                ref={wordFileRef}
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="sr-only"
                aria-label="Choose a Word file"
                onChange={(event) => void addWordFile(event.target.files?.[0])}
              />
              <button type="button" disabled={!editor || projectId === null} onClick={() => setExportOpen(true)} className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-50">
                Export PDF / Word
              </button>
            </span>
            <span>{editor ? wordCount(editor.getText()).toLocaleString("en-PH") : 0} words</span>
          </div>
        </div>

        <aside className="space-y-4 rounded-2xl border border-[#dfe8df] bg-white p-4">
          {projectId !== null && <SimilarityReports projectId={projectId} reloadKey={reloadKey} />}
          <h3 className="text-base font-semibold text-[#203028]">Versions</h3>
          <p className="mb-3 mt-1 text-xs text-[#7b877f]">
            Each version is frozen when you submit it. Your adviser and the Dean read these, not your draft.
          </p>
          {projectId !== null && <ManuscriptHistory projectId={projectId} reloadKey={reloadKey} onUseAsDraft={useVersionAsDraft} />}
        </aside>
      </div>

      {exportOpen && editor && projectId !== null && (
        <ManuscriptExportDialog projectId={projectId} loadMyGroup label="Draft" getContent={() => editor.getJSON()} onClose={() => setExportOpen(false)} />
      )}

      {submitOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" aria-label="Submit version" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#203028]">Submit a version</h3>
            <p className="mt-2 text-sm text-[#59645d]">
              This freezes what you have now as the next version. It cannot be changed afterwards, and you can keep editing your draft.
            </p>
            <label className="mt-4 block text-xs font-semibold text-[#203028]">
              What changed? (optional)
              <textarea
                value={note}
                onChange={(event) => setNote(event.target.value)}
                rows={3}
                maxLength={300}
                placeholder="For example: Revised Chapter 2 based on the adviser's comments"
                className="mt-2 w-full rounded-lg border border-[#dfe8df] px-3 py-2.5 text-sm outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>
            {submitError && (
              <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
                {submitError}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setSubmitOpen(false)} className="rounded-full border border-[#dfe8df] px-5 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void submit()}
                className="rounded-full bg-[#123f2b] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit version"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
