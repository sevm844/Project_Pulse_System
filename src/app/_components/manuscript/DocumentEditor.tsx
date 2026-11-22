"use client";

import { EditorContent, useEditor } from "@tiptap/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ManuscriptExportDialog from "./ManuscriptExportDialog";
import PagedScroll from "./PagedScroll";
import Toolbar from "./Toolbar";
import { createManuscriptExtensions } from "./extensions";
import { ApiError } from "../../_lib/api";
import { fetchGroupDocument, fetchManuscriptHome, saveGroupDocument, shareGroupDocument, type GroupDocumentFull } from "../../_lib/groupDocuments";
import { errorMessage } from "../../_lib/groups";
import { importWordFile } from "../../_lib/manuscriptImport";
import { formatDateTime } from "../../_lib/requirements";

type SaveState = "loading" | "saved" | "dirty" | "saving" | "error" | "conflict";

const AUTOSAVE_MS = 1500;
const wordCount = (text: string) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;

// One extra document of the group (not the official manuscript): the same editor, saved by itself a moment after typing stops.
// Members write one after another (a newer copy by someone else is offered before it is overwritten); the adviser and the Dean
// read it only when a member shares it with them.
export default function DocumentEditor({ documentId }: { documentId: number }) {
  const [doc, setDoc] = useState<GroupDocumentFull | null>(null);
  const [loadError, setLoadError] = useState("");
  const [state, setState] = useState<SaveState>("loading");
  const [message, setMessage] = useState("");
  const [toolbarError, setToolbarError] = useState("");
  const [title, setTitle] = useState("");
  const [pages, setPages] = useState(1);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [savedBy, setSavedBy] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [adviserName, setAdviserName] = useState<string | null>(null);
  const [shared, setShared] = useState({ adviser: false, dean: false });
  const [importing, setImporting] = useState(false);
  const [removedNote, setRemovedNote] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const [full, setFull] = useState(false);
  const wordFileRef = useRef<HTMLInputElement>(null);

  const revision = useRef(0);
  const dirty = useRef(false);
  const titleDirty = useRef(false);
  const saving = useRef(false);
  const failed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleRef = useRef("");
  const saveRef = useRef<() => Promise<void>>(async () => {});

  const extensions = useMemo(() => createManuscriptExtensions(setPages), []);

  const schedule = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void saveRef.current(), AUTOSAVE_MS);
  }, []);

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: false,
    editorProps: { attributes: { class: "manuscript-sheet", "aria-label": "Document" } },
    onUpdate: () => {
      dirty.current = true;
      failed.current = false;
      setState("dirty");
      schedule();
    },
  });

  const save = useCallback(async () => {
    if (!editor || saving.current || (!dirty.current && !titleDirty.current)) return;

    saving.current = true;
    const sendText = dirty.current;
    const sendTitle = titleDirty.current;
    dirty.current = false;
    titleDirty.current = false;
    setState("saving");

    try {
      const result = await saveGroupDocument(documentId, revision.current, {
        ...(sendText ? { content: editor.getJSON() } : {}),
        ...(sendTitle ? { title: titleRef.current } : {}),
      });
      revision.current = result.revision;
      setSavedAt(result.saved_at);
      setSavedBy(result.saved_by);
      setMessage("");

      if (result.dropped.images + result.dropped.links > 0) {
        setRemovedNote(
          [
            result.dropped.images > 0 && `${result.dropped.images} ${result.dropped.images === 1 ? "picture" : "pictures"} (add pictures with the picture button)`,
            result.dropped.links > 0 && `${result.dropped.links} ${result.dropped.links === 1 ? "link" : "links"} (the words stay)`,
          ]
            .filter(Boolean)
            .join(", "),
        );
      }

      setState(dirty.current || titleDirty.current ? "dirty" : "saved");
    } catch (err) {
      dirty.current = dirty.current || sendText;
      titleDirty.current = titleDirty.current || sendTitle;
      failed.current = true;
      setMessage(errorMessage(err, "Your last changes could not be saved."));
      setState(err instanceof ApiError && err.status === 409 ? "conflict" : "error");
    }

    saving.current = false;

    if ((dirty.current || titleDirty.current) && !failed.current && !timer.current) schedule();
  }, [editor, documentId, schedule]);

  useEffect(() => {
    saveRef.current = async () => {
      timer.current = null;
      await save();
    };
  }, [save]);

  // Open the document.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;

    (async () => {
      try {
        const [loaded, home] = await Promise.all([fetchGroupDocument(documentId), fetchManuscriptHome().catch(() => null)]);
        if (cancelled) return;

        editor.commands.setContent(loaded.content, { emitUpdate: false });
        editor.setEditable(true, false);
        revision.current = loaded.revision;
        titleRef.current = loaded.title;
        dirty.current = false;
        titleDirty.current = false;
        failed.current = false;
        setDoc(loaded);
        setTitle(loaded.title);
        setSavedAt(loaded.saved_at);
        setSavedBy(loaded.saved_by);
        setShared({ adviser: loaded.share_adviser, dean: loaded.share_dean });
        setAdviserName(home?.adviser_name ?? null);
        setMessage("");
        setState("saved");
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err, "Unable to open this document."));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editor, documentId, reloadKey]);

  // Do not lose typing when the page is closed or left.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current || titleDirty.current || saving.current) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);

    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
      if (dirty.current || titleDirty.current) void saveRef.current();
    };
  }, []);

  async function addWordFile(file: File | undefined) {
    if (wordFileRef.current) wordFileRef.current.value = "";
    if (!file || !editor) return;

    setImporting(true);
    setToolbarError("");

    try {
      const imported = await importWordFile(file);

      if (imported.empty) setToolbarError("That Word file has no text or pictures to add.");
      else editor.chain().focus("end").insertContent(imported.html).run();
    } catch (err) {
      setToolbarError(err instanceof Error ? err.message : "That Word file could not be added.");
    }

    setImporting(false);
  }

  async function changeSharing(next: { adviser: boolean; dean: boolean }) {
    const before = shared;
    setShared(next);

    try {
      await shareGroupDocument(documentId, next.adviser, next.dean);
    } catch (err) {
      setShared(before);
      setToolbarError(errorMessage(err, "Unable to change who can read this document."));
    }
  }

  // Escape leaves full screen.
  useEffect(() => {
    if (!full) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  if (loadError) {
    return (
      <div className="space-y-3">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{loadError}</p>
        <Link href="/student/manuscript" className="text-sm font-semibold text-[#123f2b]">← All documents</Link>
      </div>
    );
  }

  const status =
    state === "loading" ? "Opening..." :
    state === "saving" ? "Saving..." :
    state === "dirty" ? "Unsaved changes..." :
    state === "error" ? "Not saved" :
    state === "conflict" ? "Not saved: someone else saved a newer copy" :
    savedAt ? `All changes saved · ${savedBy ?? "someone"}, ${formatDateTime(savedAt)}` : "Nothing typed yet";

  const sharedLabel = shared.adviser && shared.dean ? "Shared with adviser and Dean" : shared.adviser ? "Shared with your adviser" : shared.dean ? "Shared with the Dean" : "Share";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href="/student/manuscript" className="text-xs font-semibold text-[#123f2b] hover:underline">← All documents</Link>
          <input
            value={title}
            disabled={state === "loading"}
            onChange={(event) => {
              setTitle(event.target.value);
              titleRef.current = event.target.value;
              titleDirty.current = event.target.value.trim() !== "";
              failed.current = false;
              if (titleDirty.current) {
                setState("dirty");
                schedule();
              }
            }}
            maxLength={150}
            aria-label="Document name"
            className="mt-1 block w-full max-w-xl rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-semibold text-[#203028] outline-none hover:border-[#dfe8df] focus:border-[#123f2b] focus:bg-white"
          />
          <p role="status" className={`mt-0.5 px-2 text-xs ${state === "error" || state === "conflict" ? "text-red-600" : "text-[#7b877f]"}`}>{status}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={state === "loading"}
            onClick={() => setShareOpen(true)}
            className={`rounded-full px-5 py-2.5 text-xs font-semibold disabled:opacity-50 ${
              shared.adviser || shared.dean ? "border border-[#cfe0d3] bg-[#f3f8f4] text-[#123f2b] hover:bg-[#e8f1ea]" : "bg-[#123f2b] text-white hover:bg-[#0f3324]"
            }`}
          >
            {sharedLabel}
          </button>
        </div>
      </div>

      {(state === "error" || state === "conflict") && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <p>{message}</p>
          {state === "conflict" ? (
            <button type="button" onClick={() => setReloadKey((key) => key + 1)} className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700">
              Load the newer copy
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                failed.current = false;
                void save();
              }}
              className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700"
            >
              Try again
            </button>
          )}
        </div>
      )}

      {removedNote && (
        <div role="status" className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <p>Some of what you pasted cannot be kept and was left out: {removedNote}. The rest of your text was saved.</p>
          <button type="button" onClick={() => setRemovedNote("")} className="rounded-full border border-amber-300 px-3 py-1 font-semibold hover:bg-amber-100">
            Dismiss
          </button>
        </div>
      )}

      {toolbarError && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">{toolbarError}</p>
      )}

      <div className={full ? "fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#eef2ee]" : "overflow-hidden rounded-2xl border border-[#dfe8df] bg-[#eef2ee]"}>
        {editor && <Toolbar editor={editor} onError={setToolbarError} />}
        <PagedScroll pages={pages} outerClassName={full ? "flex min-h-0 flex-1 flex-col" : ""} className={full ? "min-h-0 flex-1 p-5" : "max-h-[82vh] p-5"}>
          <EditorContent editor={editor} />
        </PagedScroll>
        <div className="flex items-center justify-between border-t border-[#dfe8df] bg-white px-4 py-2 text-xs text-[#59645d]">
          <span>{pages} {pages === 1 ? "page" : "pages"}</span>
          <span className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={!editor || state === "loading" || importing}
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
            <button
              type="button"
              disabled={!editor || !doc}
              onClick={() => setExportOpen(true)}
              className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea] disabled:opacity-50"
            >
              Export PDF / Word
            </button>
          </span>
          <span className="flex items-center gap-3">
              <button type="button" onClick={() => setFull((value) => !value)} className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
                {full ? "Exit full screen" : "Full screen"}
              </button>
              {editor ? wordCount(editor.getText()).toLocaleString("en-PH") : 0} words
            </span>
        </div>
      </div>

      {exportOpen && editor && doc && (
        <ManuscriptExportDialog projectId={doc.project_id} loadMyGroup label={title || "Document"} getContent={() => editor.getJSON()} onClose={() => setExportOpen(false)} />
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" aria-label="Share this document" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#203028]">Share &quot;{title || "this document"}&quot;</h3>
            <p className="mt-2 text-sm text-[#59645d]">
              Your group can always open and edit it. Choose who else may read it. They can read but not change it, and you can take it back any time.
            </p>
            <label className="mt-4 flex items-center gap-3 rounded-lg border border-[#dfe8df] px-3 py-3 text-sm text-[#203028]">
              <input type="checkbox" checked={shared.adviser} onChange={(event) => void changeSharing({ ...shared, adviser: event.target.checked })} className="h-4 w-4" />
              <span>
                <span className="block font-semibold">{adviserName ? `${adviserName} (your adviser)` : "Your adviser"}</span>
                <span className="block text-xs text-[#7b877f]">Can read this document</span>
              </span>
            </label>
            <label className="mt-2 flex items-center gap-3 rounded-lg border border-[#dfe8df] px-3 py-3 text-sm text-[#203028]">
              <input type="checkbox" checked={shared.dean} onChange={(event) => void changeSharing({ ...shared, dean: event.target.checked })} className="h-4 w-4" />
              <span>
                <span className="block font-semibold">The Dean</span>
                <span className="block text-xs text-[#7b877f]">Can read this document</span>
              </span>
            </label>
            <p className="mt-3 text-xs text-[#7b877f]">Your official manuscript is not part of this choice: your adviser and the Dean can always read it.</p>
            <div className="mt-5 flex justify-end">
              <button type="button" onClick={() => setShareOpen(false)} className="rounded-full bg-[#123f2b] px-5 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]">
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
