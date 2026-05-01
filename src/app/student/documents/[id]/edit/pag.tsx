"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import StudentShell from "../../../_components/StudentShell";
import Card from "../../../_components/Card";
import StatusBadge from "../../../_components/StatusBadge";
import type { DocumentStatus } from "../../../_data/mockStudentData";

type RevisionRecord = {
  id: number;
  revisionNumber: number;
  version: string;
  editedBy: string;
  editedAt: string;
  chapter: string;
  beforeContent: string;
  afterContent: string;
  revisionNote: string;
};

type StoredDocument = {
  id: number;
  title: string;
  documentType: string;
  currentVersion: string;
  currentContent: string;
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  revisions: RevisionRecord[];
};

function getDocuments(): StoredDocument[] {
  const saved = localStorage.getItem("project-pulse-documents");
  return saved ? JSON.parse(saved) : [];
}

function saveDocuments(documents: StoredDocument[]) {
  localStorage.setItem("project-pulse-documents", JSON.stringify(documents));
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, "").trim();
}

export default function EditDocumentPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);

  const [document, setDocument] = useState<StoredDocument | null>(null);
  const [revisionNote, setRevisionNote] = useState("");
  const [selectedRevisionId, setSelectedRevisionId] = useState<number | null>(
    null,
  );
  const [autosaveStatus, setAutosaveStatus] = useState("Autosave ready");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[520px] w-full outline-none leading-7 text-[#203028]",
        style: "font-family: Arial, sans-serif; font-size: 12pt;",
      },
    },
  });

// Load the selected document from local storage.
  useEffect(() => {
    const documents = getDocuments();
    const found = documents.find((item) => item.id === id);

    if (!found) {
      router.push("/student/documents");
      return;
    }

    setDocument(found);
    editor?.commands.setContent(found.currentContent || "");
  }, [editor, id, router]);

  function persistDocument(nextDocument: StoredDocument) {
    const documents = getDocuments();

    const nextDocuments = documents.map((item) =>
      item.id === nextDocument.id ? nextDocument : item,
    );

    saveDocuments(nextDocuments);
    setDocument(nextDocument);
  }

  function saveRevision(note = revisionNote || "Autosaved revision") {
    if (!document || !editor) return;

    const beforeContent = document.currentContent || "";
    const afterContent = editor.getHTML();

    if (stripHtml(beforeContent) === stripHtml(afterContent) && !note) {
      return;
    }

    const nextRevisionNumber = document.revisions.length + 1;
    const nextVersion = `v${nextRevisionNumber}`;

    const revision: RevisionRecord = {
      id: Date.now(),
      revisionNumber: nextRevisionNumber,
      version: nextVersion,
      editedBy: "Student Name",
      editedAt: new Date().toLocaleString(),
      chapter: document.documentType,
      beforeContent,
      afterContent,
      revisionNote: note,
    };

    const nextDocument: StoredDocument = {
      ...document,
      currentVersion: nextVersion,
      currentContent: afterContent,
      status: "Draft",
      updatedAt: new Date().toISOString(),
      revisions: [revision, ...document.revisions],
    };

    persistDocument(nextDocument);
    setRevisionNote("");
    setAutosaveStatus(`Saved ${nextVersion}`);
  }

// Periodically save editor changes as revisions.
  useEffect(() => {
    if (!document || !editor) return;

    const interval = window.setInterval(() => {
      const currentContent = editor.getHTML();

      if (stripHtml(currentContent) !== stripHtml(document.currentContent)) {
        setAutosaveStatus("Autosaving...");
        saveRevision("Autosaved revision");
      }
    }, 10000);

    return () => window.clearInterval(interval);
  }, [document, editor]);

  function submitToAdviser() {
    if (!document) return;

    const nextDocument: StoredDocument = {
      ...document,
      status: "Under Review",
      updatedAt: new Date().toISOString(),
    };

    persistDocument(nextDocument);
  }

  const selectedRevision = useMemo(() => {
    if (!document || !selectedRevisionId) return null;
    return document.revisions.find((item) => item.id === selectedRevisionId);
  }, [document, selectedRevisionId]);

  if (!document) {
    return (
      <StudentShell title="Document Editor">
        <Card className="p-6">
          <p className="text-sm text-[#7b877f]">Loading document...</p>
        </Card>
      </StudentShell>
    );
  }

  return (
    <StudentShell title="Document Editor">
      <div className="space-y-5">
{/* Editor header */}
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight text-[#203028]">
                  {document.title}
                </h1>

                <StatusBadge status={document.status} />
              </div>

              <p className="mt-2 text-sm text-[#7b877f]">
                {document.documentType} • {document.currentVersion} • Arial 12pt
              </p>

              <p className="mt-1 text-xs text-[#7b877f]">{autosaveStatus}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/student/documents"
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
              >
                Back to Documents
              </Link>

              <button
                type="button"
                onClick={() => saveRevision(revisionNote || "Manual save")}
                className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={submitToAdviser}
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
              >
                Submit to Adviser
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
{/* Manuscript editor */}
          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-2 border-b border-[#edf2ec] bg-[#fbfdfb] px-4 py-3">
              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBold().run()}
                className="rounded-md px-3 py-1.5 text-sm font-bold hover:bg-[#f3f7f1]"
              >
                B
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleItalic().run()}
                className="rounded-md px-3 py-1.5 text-sm italic hover:bg-[#f3f7f1]"
              >
                I
              </button>

              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 1 }).run()
                }
                className="rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-[#f3f7f1]"
              >
                H1
              </button>

              <button
                type="button"
                onClick={() =>
                  editor?.chain().focus().toggleHeading({ level: 2 }).run()
                }
                className="rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-[#f3f7f1]"
              >
                H2
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleBulletList().run()}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-[#f3f7f1]"
              >
                Bullet List
              </button>

              <button
                type="button"
                onClick={() => editor?.chain().focus().toggleOrderedList().run()}
                className="rounded-md px-3 py-1.5 text-sm hover:bg-[#f3f7f1]"
              >
                Numbered List
              </button>

              <span className="ml-auto rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-medium text-[#59645d]">
                Arial • 12pt
              </span>
            </div>

            <div className="p-6">
              <EditorContent editor={editor} />
            </div>
          </Card>

          <aside className="space-y-5">
{/* Revision note */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Revision Note
              </h2>

              <p className="mt-1 text-sm text-[#7b877f]">
                Explain what changed before saving.
              </p>

              <textarea
                value={revisionNote}
                onChange={(e) => setRevisionNote(e.target.value)}
                placeholder="Example: Added related studies and revised scope."
                className="mt-4 min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </Card>

{/* Revision history */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Revision History
              </h2>

              <div className="mt-4 space-y-3">
                {document.revisions.length === 0 ? (
                  <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                    No revisions yet. Save the draft to create the first
                    revision record.
                  </p>
                ) : (
                  document.revisions.map((revision) => (
                    <button
                      key={revision.id}
                      type="button"
                      onClick={() => setSelectedRevisionId(revision.id)}
                      className="w-full rounded-xl bg-[#f8faf7] p-4 text-left hover:bg-[#eff6ee]"
                    >
                      <p className="text-sm font-semibold text-[#203028]">
                        {revision.version} • Revision {revision.revisionNumber}
                      </p>

                      <p className="mt-1 text-xs text-[#7b877f]">
                        {revision.editedAt}
                      </p>

                      <p className="mt-2 text-xs text-[#59645d]">
                        {revision.revisionNote}
                      </p>
                    </button>
                  ))
                )}
              </div>
            </Card>
          </aside>
        </div>

{/* Version comparison */}
        {selectedRevision && (
          <Card className="p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-[#203028]">
                  Compare Versions
                </h2>

                <p className="mt-1 text-sm text-[#7b877f]">
                  {selectedRevision.version} • {selectedRevision.editedAt}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedRevisionId(null)}
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
              >
                Close Compare
              </button>
            </div>

            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div className="rounded-xl border border-[#dfe8df] bg-[#f8faf7] p-4">
                <p className="text-sm font-semibold text-[#203028]">
                  Before Save
                </p>

                <div
                  className="mt-3 max-h-80 overflow-auto text-sm leading-7 text-[#59645d]"
                  dangerouslySetInnerHTML={{
                    __html:
                      selectedRevision.beforeContent ||
                      "<p>No previous content.</p>",
                  }}
                />
              </div>

              <div className="rounded-xl border border-[#dfe8df] bg-white p-4">
                <p className="text-sm font-semibold text-[#203028]">
                  After Save
                </p>

                <div
                  className="mt-3 max-h-80 overflow-auto text-sm leading-7 text-[#59645d]"
                  dangerouslySetInnerHTML={{
                    __html: selectedRevision.afterContent,
                  }}
                />
              </div>
            </div>
          </Card>
        )}
      </div>
    </StudentShell>
  );
}
