"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import StudentShell from "../../_components/StudentShell";
import Card from "../../_components/Card";
import type { DocumentStatus } from "../../_data/mockStudentData";

const documentTypes = [
  "Chapter 1",
  "Chapter 2",
  "Chapter 3",
  "Chapter 4",
  "Chapter 5",
  "Proposal",
  "Final Manuscript",
];

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
  notes?: string;
  createdAt: string;
  updatedAt: string;
  status: DocumentStatus;
  revisions: RevisionRecord[];
};

function saveDocumentToStorage(document: Omit<StoredDocument, "id">) {
  const existing = localStorage.getItem("project-pulse-documents");
  const documents: StoredDocument[] = existing ? JSON.parse(existing) : [];

  documents.unshift({
    id: Date.now(),
    ...document,
  });

  localStorage.setItem("project-pulse-documents", JSON.stringify(documents));
}

export default function NewDocumentPage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"create" | "upload">("create");
  const [title, setTitle] = useState("");
  const [documentType, setDocumentType] = useState("Chapter 1");
  const [notes, setNotes] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: "",
    editorProps: {
      attributes: {
        class: "min-h-[360px] w-full outline-none leading-7 text-[#203028]",
        style: "font-family: Arial, sans-serif; font-size: 12pt;",
      },
    },
  });

  function createDocument() {
    const now = new Date().toISOString();
    const content = editor?.getHTML() || "";

    saveDocumentToStorage({
      title: title || documentType,
      documentType,
      currentContent: content,
      currentVersion: "v1",
      createdAt: now,
      updatedAt: now,
      status: "Draft",
      revisions: [
        {
          id: Date.now(),
          revisionNumber: 1,
          version: "v1",
          editedBy: "Student Name",
          editedAt: new Date().toLocaleString(),
          chapter: documentType,
          beforeContent: "",
          afterContent: content,
          revisionNote: "Initial document created",
        },
      ],
    });

    router.push("/student/documents");
  }

  function uploadDocument() {
    const now = new Date().toISOString();

    saveDocumentToStorage({
      title: title || "Uploaded Document",
      documentType,
      currentContent: "",
      notes,
      currentVersion: "v1",
      createdAt: now,
      updatedAt: now,
      status: "Submitted",
      revisions: [
        {
          id: Date.now(),
          revisionNumber: 1,
          version: "v1",
          editedBy: "Student Name",
          editedAt: new Date().toLocaleString(),
          chapter: documentType,
          beforeContent: "",
          afterContent: "",
          revisionNote: notes || "Initial file uploaded",
        },
      ],
    });

    router.push("/student/documents");
  }

  return (
    <StudentShell title="Add Document">
      <div className="space-y-5">
{/* Page header */}
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-[#203028]">
            Add Document
          </h1>

          <p className="mt-2 text-sm leading-6 text-[#59645d]">
            Add a new document to the project workspace. Create a document using
            the built-in editor or upload an existing file.
          </p>
        </div>

        <Card className="overflow-hidden">
{/* Create/upload mode switch */}
          <div className="flex border-b border-[#edf2ec]">
            <button
              type="button"
              onClick={() => setActiveTab("create")}
              className={`px-6 py-4 text-sm font-semibold ${
                activeTab === "create"
                  ? "border-b-2 border-[#202823] text-[#203028]"
                  : "text-[#7b877f] hover:text-[#203028]"
              }`}
            >
              Create Document
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`px-6 py-4 text-sm font-semibold ${
                activeTab === "upload"
                  ? "border-b-2 border-[#202823] text-[#203028]"
                  : "text-[#7b877f] hover:text-[#203028]"
              }`}
            >
              Upload File
            </button>
          </div>

          <div className="p-6">
{/* Document title */}
            <div className="mb-5">
              <label className="text-sm font-semibold text-[#203028]">
                Document Title <span className="text-red-500">*</span>
              </label>

              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title e.g. Chapter 1: Introduction"
                className="mt-2 w-full rounded-lg border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </div>

            <div className="grid gap-5 lg:grid-cols-[220px_1fr]">
{/* Chapter/type selector */}
              <div>
                <label className="text-sm font-semibold text-[#203028]">
                  Document Type <span className="text-red-500">*</span>
                </label>

                <div className="mt-2 overflow-hidden rounded-xl border border-[#dfe8df] bg-white">
                  {documentTypes.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setDocumentType(type)}
                      className={`block w-full px-4 py-3 text-left text-sm transition ${
                        documentType === type
                          ? "bg-[#202823] font-semibold text-white"
                          : "text-[#59645d] hover:bg-[#f3f7f1]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === "create" ? (
/* Built-in manuscript editor */
                <div className="overflow-hidden rounded-xl border border-[#dfe8df] bg-white">
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
                      onClick={() =>
                        editor?.chain().focus().toggleItalic().run()
                      }
                      className="rounded-md px-3 py-1.5 text-sm italic hover:bg-[#f3f7f1]"
                    >
                      I
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 1 })
                          .run()
                      }
                      className="rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-[#f3f7f1]"
                    >
                      H1
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        editor
                          ?.chain()
                          .focus()
                          .toggleHeading({ level: 2 })
                          .run()
                      }
                      className="rounded-md px-3 py-1.5 text-sm font-semibold hover:bg-[#f3f7f1]"
                    >
                      H2
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleBulletList().run()
                      }
                      className="rounded-md px-3 py-1.5 text-sm hover:bg-[#f3f7f1]"
                    >
                      Bullet List
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        editor?.chain().focus().toggleOrderedList().run()
                      }
                      className="rounded-md px-3 py-1.5 text-sm hover:bg-[#f3f7f1]"
                    >
                      Numbered List
                    </button>

                    <span className="ml-auto rounded-full border border-[#dfe8df] bg-white px-3 py-1 text-xs font-medium text-[#59645d]">
                      Arial • 12pt
                    </span>
                  </div>

                  <div className="p-5">
                    <EditorContent editor={editor} />
                  </div>
                </div>
              ) : (
/* File upload mode */
                <div className="rounded-xl border border-[#dfe8df] bg-white p-5">
                  <div className="rounded-xl border border-dashed border-[#dfe8df] bg-[#f8faf7] p-8 text-center">
                    <p className="text-sm font-semibold text-[#203028]">
                      Select PDF, DOCX, or document file
                    </p>

                    <p className="mt-2 text-xs text-[#7b877f]">
                      In deployment, this will upload to file storage and create
                      a document version record.
                    </p>

                    <input
                      type="file"
                      className="mt-5 text-sm"
                      accept=".pdf,.doc,.docx"
                    />
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Optional notes: What is this file for?"
                    className="mt-5 min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />
                </div>
              )}
            </div>
          </div>

{/* Form actions */}
          <div className="flex justify-end gap-3 border-t border-[#edf2ec] bg-[#fbfdfb] px-6 py-4">
            <button
              type="button"
              onClick={() => router.push("/student/documents")}
              className="rounded-lg border border-[#dfe8df] px-5 py-2.5 text-sm font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={activeTab === "create" ? createDocument : uploadDocument}
              className="rounded-lg bg-[#202823] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#303a33]"
            >
              {activeTab === "create" ? "Create Document" : "Upload File"}
            </button>
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
