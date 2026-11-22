"use client";

import { isChangeOrigin } from "@tiptap/extension-collaboration";
import { EditorContent, useEditor } from "@tiptap/react";
import { prosemirrorJSONToYDoc } from "@tiptap/y-tiptap";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import * as Y from "yjs";
import ManuscriptExportDialog from "./ManuscriptExportDialog";
import PagedScroll from "./PagedScroll";
import Toolbar from "./Toolbar";
import ZoomBox from "./ZoomBox";
import { createManuscriptExtensions } from "./extensions";
import { CollabProvider, cursorColor, type CollabStatus } from "../../_lib/collab";
import {
  fetchGroupDocument,
  fetchManuscriptHome,
  renameGroupDocument,
  saveGroupDocumentSnapshot,
  shareGroupDocument,
  type GroupDocumentFull,
} from "../../_lib/groupDocuments";
import { errorMessage } from "../../_lib/groups";
import { importWordFile } from "../../_lib/manuscriptImport";
import { formatDateTime } from "../../_lib/requirements";
import { getStoredUserName, getStoredUserUid } from "../../_utils/authStorage";

type SaveState = "loading" | "saved" | "dirty" | "saving" | "error";

const AUTOSAVE_MS = 1500;
const ZOOMS = [0.5, 0.75, 0.9, 1, 1.25, 1.5, 2];
const wordCount = (text: string) => (text.match(/[\p{L}\p{N}][\p{L}\p{N}'’-]*/gu) ?? []).length;
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// One extra document of the group (not the official manuscript), written together like Google Docs: every member types in the same live document,
// changes travel through the server about once a second and merge in each browser, and each member sees the others' coloured cursors. The server
// also keeps a readable copy (saved a moment after typing stops) that the adviser and the Dean read when a member shared the document with them.
export default function DocumentEditor({ documentId }: { documentId: number }) {
  const [provider, setProvider] = useState<CollabProvider | null>(null);
  const [collabStatus, setCollabStatus] = useState<CollabStatus>("connecting");
  const [fatal, setFatal] = useState("");

  useEffect(() => {
    const created = new CollabProvider({ onStatus: setCollabStatus, onFatal: setFatal, basePath: `/my-documents/${documentId}` });
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProvider(created);

    return () => created.destroy();
  }, [documentId]);

  if (fatal) {
    return (
      <div className="space-y-3">
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">{fatal}</p>
        <Link href="/student/manuscript" className="text-sm font-semibold text-[#123f2b]">← All documents</Link>
      </div>
    );
  }

  if (!provider) return <p className="text-sm text-[#7b877f]">Opening the document...</p>;

  return <DocumentEditorBody documentId={documentId} provider={provider} collabStatus={collabStatus} />;
}

function DocumentEditorBody({ documentId, provider, collabStatus }: { documentId: number; provider: CollabProvider; collabStatus: CollabStatus }) {
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
  const [others, setOthers] = useState<string[]>([]);
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(1);
  const wordFileRef = useRef<HTMLInputElement>(null);

  const dirty = useRef(false);
  const saving = useRef(false);
  const failed = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const titleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveRef = useRef<() => Promise<void>>(async () => {});

  // Who I am on the screen: the name and the colour of my cursor (the same colour on every screen).
  const user = useMemo(() => {
    const userId = Number(getStoredUserUid() ?? 0);

    return { name: getStoredUserName() || "A member", userId, color: cursorColor(userId) };
  }, []);
  const extensions = useMemo(() => createManuscriptExtensions(setPages, { provider, user }), [provider, user]);

  // The zoom is a per-browser convenience.
  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem("pulse-manuscript-zoom"));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (ZOOMS.includes(saved)) setZoom(saved);
    } catch {
      /* the zoom just starts at 100% */
    }
  }, []);

  // Escape leaves full screen.
  useEffect(() => {
    if (!full) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFull(false);
    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [full]);

  const editor = useEditor({
    extensions,
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    editable: false,
    editorProps: { attributes: { class: "manuscript-sheet", "aria-label": "Document" } },
    onUpdate: ({ transaction }) => {
      // What another member typed is saved by their browser; only my own typing starts a save here.
      if (isChangeOrigin(transaction)) return;

      dirty.current = true;
      failed.current = false;
      setState("dirty");
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => void saveRef.current(), AUTOSAVE_MS);
    },
  });

  // The readable copy of the document. It says which change of the live document it includes.
  const save = useCallback(async () => {
    if (!editor || saving.current || !dirty.current) return;

    saving.current = true;
    dirty.current = false;
    setState("saving");

    try {
      const result = await saveGroupDocumentSnapshot(documentId, editor.getJSON(), provider.cursor);
      setSavedAt(result.saved_at);
      setSavedBy(result.saved_by);
      setMessage("");

      // A copy that is behind what the server already has is ignored: try again after this browser has caught up.
      if (result.stale) dirty.current = true;

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

      setState(dirty.current ? "dirty" : "saved");
    } catch (err) {
      dirty.current = true;
      failed.current = true;
      setMessage(errorMessage(err, "Your last changes could not be saved."));
      setState("error");
    }

    saving.current = false;

    if (dirty.current && !failed.current && !timer.current) {
      timer.current = setTimeout(() => void saveRef.current(), AUTOSAVE_MS);
    }
  }, [editor, documentId, provider]);

  useEffect(() => {
    saveRef.current = async () => {
      timer.current = null;
      await save();
    };
  }, [save]);

  // Open the document: read the saved text, join the live document (the first member to open it adds the starting text) and let people type.
  useEffect(() => {
    if (!editor) return;
    let cancelled = false;

    (async () => {
      try {
        const [loaded, home] = await Promise.all([fetchGroupDocument(documentId), fetchManuscriptHome().catch(() => null)]);
        if (cancelled) return;

        await provider.start(() => Y.encodeStateAsUpdate(prosemirrorJSONToYDoc(editor.schema, loaded.content, "default")));
        if (cancelled) return;

        editor.setEditable(true, false);
        setDoc(loaded);
        setTitle(loaded.title);
        setSavedAt(loaded.saved_at);
        setSavedBy(loaded.saved_by);
        setShared({ adviser: loaded.share_adviser, dean: loaded.share_dean });
        setAdviserName(home?.adviser_name ?? null);
        setState("saved");
      } catch (err) {
        if (!cancelled) setLoadError(errorMessage(err, "Unable to open this document."));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [editor, documentId, provider]);

  // Who else is editing: read from the shared cursors.
  useEffect(() => {
    const read = () => {
      const names = [...provider.awareness.getStates().entries()]
        .filter(([clientId, value]) => clientId !== provider.doc.clientID && (value as { user?: { name?: string } }).user?.name)
        .map(([, value]) => (value as { user: { name: string } }).user.name);
      setOthers([...new Set(names)]);
    };
    provider.awareness.on("change", read);

    return () => provider.awareness.off("change", read);
  }, [provider]);

  // Do not lose typing when the page is closed or left.
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (dirty.current || saving.current || provider.pending) event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);

    return () => {
      window.removeEventListener("beforeunload", warn);
      if (timer.current) clearTimeout(timer.current);
      if (titleTimer.current) clearTimeout(titleTimer.current);
      if (dirty.current) void saveRef.current();
    };
  }, [provider]);

  // The name is saved on its own a moment after typing stops.
  function changeTitle(value: string) {
    setTitle(value);
    if (titleTimer.current) clearTimeout(titleTimer.current);
    if (value.trim() === "") return;

    titleTimer.current = setTimeout(() => {
      renameGroupDocument(documentId, value.trim())
        .then((saved) => {
          setSavedAt(saved.saved_at);
          setSavedBy(saved.saved_by);
        })
        .catch((err) => setToolbarError(errorMessage(err, "Unable to rename the document.")));
    }, AUTOSAVE_MS);
  }

  // A Word file is added at the end of the document (nothing is replaced; Undo takes it back). It saves like any other typing.
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

  async function retry() {
    failed.current = false;
    while (saving.current) await sleep(100);
    await save();
  }

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
    collabStatus === "offline" ? "No connection: your changes are kept here and are sent when it is back" :
    state === "saving" ? "Saving..." :
    state === "dirty" ? "Unsaved changes..." :
    state === "error" ? "Not saved" :
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
            onChange={(event) => changeTitle(event.target.value)}
            maxLength={150}
            aria-label="Document name"
            className="mt-1 block w-full max-w-xl rounded-lg border border-transparent bg-transparent px-2 py-1 text-xl font-semibold text-[#203028] outline-none hover:border-[#dfe8df] focus:border-[#123f2b] focus:bg-white"
          />
          <p role="status" className={`mt-0.5 px-2 text-xs ${state === "error" ? "text-red-600" : collabStatus === "offline" ? "text-amber-700" : "text-[#7b877f]"}`}>{status}</p>
          {others.length > 0 && (
            <p className="mt-0.5 px-2 text-xs font-semibold text-[#1f7a4a]">
              {others.join(", ")} {others.length === 1 ? "is" : "are"} also editing now
            </p>
          )}
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

      {state === "error" && (
        <div role="alert" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700">
          <p>{message}</p>
          <button type="button" onClick={() => void retry()} className="rounded-full bg-red-600 px-4 py-1.5 font-semibold text-white hover:bg-red-700">
            Try again
          </button>
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

      {(() => {
        const card = (
          <div className={full ? "fixed inset-0 z-[70] flex flex-col overflow-hidden bg-[#eef2ee]" : "overflow-hidden rounded-2xl border border-[#dfe8df] bg-[#eef2ee]"}>
            {editor && <Toolbar editor={editor} onError={setToolbarError} />}
            <PagedScroll pages={pages} zoom={zoom} outerClassName={full ? "flex min-h-0 flex-1 flex-col" : ""} className={full ? "min-h-0 flex-1 p-5" : "max-h-[82vh] p-5"}>
              <ZoomBox zoom={zoom}>
                <EditorContent editor={editor} />
              </ZoomBox>
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
                <select
                  aria-label="Zoom"
                  value={zoom}
                  onChange={(event) => {
                    const next = Number(event.target.value);
                    setZoom(next);
                    try {
                      localStorage.setItem("pulse-manuscript-zoom", String(next));
                    } catch {
                      /* not saved, still applied */
                    }
                  }}
                  className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-2 py-1 text-xs font-semibold text-[#123f2b]"
                >
                  {ZOOMS.map((value) => (
                    <option key={value} value={value}>
                      {Math.round(value * 100)}%
                    </option>
                  ))}
                </select>
                <button type="button" onClick={() => setFull((value) => !value)} className="rounded-full border border-[#cfe0d3] bg-[#f3f8f4] px-3 py-1 text-xs font-semibold text-[#123f2b] hover:bg-[#e8f1ea]">
                  {full ? "Exit full screen" : "Full screen"}
                </button>
                {editor ? wordCount(editor.getText()).toLocaleString("en-PH") : 0} words
              </span>
            </div>
          </div>
        );

        return full ? createPortal(card, document.body) : card;
      })()}

      {exportOpen && editor && doc && (
        <ManuscriptExportDialog projectId={doc.project_id} loadMyGroup label={title || "Document"} getContent={() => editor.getJSON()} onClose={() => setExportOpen(false)} />
      )}

      {shareOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div role="dialog" aria-modal="true" aria-label="Share this document" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[#203028]">Share &quot;{title || "this document"}&quot;</h3>
            <p className="mt-2 text-sm text-[#59645d]">
              Your group can always open and edit it together. Choose who else may read it. They can read but not change it, and you can take it back any time.
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
