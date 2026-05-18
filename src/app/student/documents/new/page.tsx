"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import StudentShell from "../../_components/StudentShell";
import HighlightCommentEditor from "../../_components/HighlightCommentEditor";
import {
  getStoredDocuments,
  saveStoredDocuments,
  type StoredDocument,
} from "../_utils/documentStorage";

const chapters = [
  ["Proposal", "Project Proposal"],
  ["Chapter 1", "Introduction"],
  ["Chapter 2", "Review of Related Literature"],
  ["Chapter 3", "Methodology"],
  ["Chapter 4", "Results and Discussion"],
  ["Chapter 5", "Conclusion and Recommendations"],
] as const;

type ChapterType = (typeof chapters)[number][0];

const fontSizes = ["12", "14", "16", "18", "20", "24", "28", "32"];
const DELETED_CHAPTER_WORKSPACES_KEY =
  "project-pulse-deleted-chapter-workspaces";

function buildStarterContent(chapter: string, subtitle: string) {
  return `
    <h1>${chapter}: ${subtitle}</h1>
    <p><br></p>
    <h2>Section Heading</h2>
    <p>Start writing your capstone chapter here.</p>
    <p><br></p>
    <p>This workspace supports rich text formatting, autosave drafts, and version creation for adviser review.</p>
  `;
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function restoreChapterWorkspace(documentId: number, documentType: string) {
  if (typeof window === "undefined") return;

  const saved = window.localStorage.getItem(DELETED_CHAPTER_WORKSPACES_KEY);
  if (!saved) return;

  const deletedKeys = new Set(JSON.parse(saved) as string[]);
  deletedKeys.delete(String(documentId));
  deletedKeys.delete(documentType);

  window.localStorage.setItem(
    DELETED_CHAPTER_WORKSPACES_KEY,
    JSON.stringify([...deletedKeys]),
  );
}

export default function NewDocumentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editorRef = useRef<HTMLDivElement | null>(null);

  const initialType = searchParams.get("type") || "Chapter 1";
  const initialDocumentId = Number(searchParams.get("documentId")) || null;
  const initialChapter =
    chapters.find(([chapter]) => chapter === initialType) || chapters[1];

  const [documentType, setDocumentType] = useState(initialChapter[0]);
  const [title, setTitle] = useState(
    `${initialChapter[0]}: ${initialChapter[1]}`,
  );
  const [reviewer, setReviewer] = useState("Anna Cruz (Adviser)");
  const [status, setStatus] = useState<"Draft" | "Under Review">("Draft");
  const [fontSize, setFontSize] = useState("16");
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<number | null>(
    initialDocumentId,
  );
  const [activeVersion, setActiveVersion] = useState("v1");
  const [content, setContent] = useState(
    buildStarterContent(initialChapter[0], initialChapter[1]),
  );

  const selectedChapter = useMemo(() => {
    return chapters.find(([chapter]) => chapter === documentType) || chapters[0];
  }, [documentType]);

  useEffect(() => {
    const documents = getStoredDocuments();
    const existingDocument =
      (initialDocumentId
        ? documents.find((document) => document.id === initialDocumentId)
        : null) ||
      documents.find((document) => document.documentType === initialType);

    if (!existingDocument) return;

    queueMicrotask(() => {
      setActiveDocumentId(existingDocument.id);
      setActiveVersion(existingDocument.currentVersion);
      setDocumentType(existingDocument.documentType as ChapterType);
      setTitle(existingDocument.title);
      setReviewer(existingDocument.reviewer);
      setStatus(
        existingDocument.status === "Under Review" ? "Under Review" : "Draft",
      );
      setContent(existingDocument.currentContent);

      if (!editorRef.current) return;

      editorRef.current.innerHTML = existingDocument.currentContent;
      forceEditorDirection();
    });
  }, [initialDocumentId, initialType]);

  function forceEditorDirection() {
    if (!editorRef.current) return;

    editorRef.current.setAttribute("dir", "ltr");
    editorRef.current.style.direction = "ltr";
    editorRef.current.style.unicodeBidi = "normal";
    editorRef.current.style.writingMode = "horizontal-tb";
    editorRef.current.style.transform = "none";
  }

  function focusEditor() {
    if (!editorRef.current) return;

    editorRef.current.focus();

    const selection = window.getSelection();
    if (!selection) return;

    if (selection.rangeCount === 0) {
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  }

  function getCurrentBlock() {
    const editor = editorRef.current;
    const selection = window.getSelection();

    if (!editor || !selection || selection.rangeCount === 0) return null;

    let node = selection.anchorNode;

    if (!node) return null;

    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentElement;
    }

    if (!(node instanceof HTMLElement)) return null;

    const block = node.closest("p, h1, h2, h3, div, li");

    if (!block || !editor.contains(block)) return null;

    return block as HTMLElement;
  }

  function placeCursorInside(element: HTMLElement) {
    const selection = window.getSelection();
    const range = document.createRange();

    range.selectNodeContents(element);
    range.collapse(false);

    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  function applyList(type: "ul" | "ol") {
    focusEditor();
    forceEditorDirection();

    const command =
      type === "ul" ? "insertUnorderedList" : "insertOrderedList";

    document.execCommand(command, false);

    setTimeout(() => {
      const editor = editorRef.current;
      if (!editor) return;

      const block = getCurrentBlock();
      const alreadyInList = block?.closest("ul") || block?.closest("ol");

      if (alreadyInList) {
        forceEditorDirection();
        return;
      }

      const currentBlock = block || editor;
      const list = document.createElement(type);
      const item = document.createElement("li");
      const text = currentBlock.textContent?.trim();

      if (currentBlock === editor || !text) {
        item.innerHTML = "<br>";
      } else {
        item.innerHTML = currentBlock.innerHTML;
      }

      list.appendChild(item);

      if (currentBlock === editor) {
        editor.appendChild(list);
      } else {
        currentBlock.replaceWith(list);
      }

      placeCursorInside(item);
      forceEditorDirection();
    }, 0);
  }

  function runCommand(command: string, value?: string) {
    focusEditor();
    forceEditorDirection();

    setTimeout(() => {
      document.execCommand(command, false, value);
      forceEditorDirection();
    }, 0);
  }

  function toolbarAction(
    event: MouseEvent<HTMLButtonElement>,
    command: string,
    value?: string,
  ) {
    event.preventDefault();
    runCommand(command, value);
  }

  function listAction(event: MouseEvent<HTMLButtonElement>, type: "ul" | "ol") {
    event.preventDefault();
    applyList(type);
  }

  function changeChapter(nextChapter: string) {
    const chapter = chapters.find(([item]) => item === nextChapter);
    if (!chapter) return;

    const nextContent = buildStarterContent(chapter[0], chapter[1]);

    setDocumentType(chapter[0]);
    setTitle(`${chapter[0]}: ${chapter[1]}`);
    setContent(nextContent);
    setActiveDocumentId(null);
    setActiveVersion("v1");
    setStatus("Draft");

    queueMicrotask(() => {
      if (editorRef.current) {
        editorRef.current.innerHTML = nextContent;
        forceEditorDirection();
      }
    });
  }

  function handleEditorInput() {
    forceEditorDirection();
  }

  function createWorkspace(nextStatus: StoredDocument["status"] = status) {
    const now = new Date().toISOString();
    const editorContent = editorRef.current?.innerHTML || content;
    const documents = getStoredDocuments();
    const existingDocument =
      (activeDocumentId
        ? documents.find((document) => document.id === activeDocumentId)
        : null) ||
      documents.find((document) => document.documentType === documentType);
    const timestampId = Date.parse(now);
    const id = existingDocument?.id || timestampId;
    const nextRevisionNumber = (existingDocument?.revisions.length || 0) + 1;
    const nextVersion = `v${nextRevisionNumber}`;

    const nextRevision = {
      id: timestampId,
      revisionNumber: nextRevisionNumber,
      version: nextVersion,
      editedBy: "Student Name",
      editedAt: formatDateTime(now),
      chapter: documentType,
      beforeContent: existingDocument?.currentContent || "",
      afterContent: editorContent,
      revisionNote:
        nextStatus === "Under Review"
          ? "Workspace submitted for review"
          : "Workspace draft saved",
    };

    const newDocument: StoredDocument = {
      ...(existingDocument || {}),
      id,
      title: title.trim() || `${selectedChapter[0]}: ${selectedChapter[1]}`,
      documentType,
      currentVersion: nextVersion,
      currentContent: editorContent,
      createdAt: existingDocument?.createdAt || now,
      updatedAt: now,
      status: nextStatus,
      reviewer: nextStatus === "Under Review" ? reviewer : reviewer,
      notes: existingDocument?.notes || "",
      revisions: [...(existingDocument?.revisions || []), nextRevision],
    };

    const nextDocuments = existingDocument
      ? documents.map((document) =>
          document.id === existingDocument.id ? newDocument : document,
        )
      : [newDocument, ...documents];

    saveStoredDocuments(nextDocuments);
    setActiveDocumentId(id);
    setActiveVersion(nextVersion);
    restoreChapterWorkspace(id, documentType);
    setLastSavedAt(now);

    router.push("/student/documents");
  }

  function saveDraft() {
    createWorkspace("Draft");
  }

  function submitForReview() {
    createWorkspace("Under Review");
  }

  return (
    <StudentShell title="Create Workspace">
      <div className="min-h-[calc(100vh-130px)] rounded-2xl border border-[#dfe8df] bg-[#f8faf7] shadow-sm">
        <div className="border-b border-[#dfe8df] bg-white px-5 py-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#7b877f]">
                <Link href="/student/documents" className="hover:text-[#203028]">
                  Documents
                </Link>
                <span>/</span>
                <span>Create Workspace</span>
              </div>

              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-2 w-full min-w-0 bg-transparent text-2xl font-semibold tracking-tight text-[#203028] outline-none"
              />

              <p className="mt-1 text-xs text-[#7b877f]">
                {lastSavedAt
                  ? `Saved ${formatDateTime(lastSavedAt)}`
                  : "Unsaved workspace"}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href="/student/documents"
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2.5 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
              >
                Cancel
              </Link>

              <button
                type="button"
                onClick={saveDraft}
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2.5 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
              >
                Save Draft
              </button>

              <button
                type="button"
                onClick={submitForReview}
                className="rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
              >
                Submit for Review
              </button>
            </div>
          </div>
        </div>

        <div className="border-b border-[#dfe8df] bg-white px-5 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={documentType}
              onChange={(event) => changeChapter(event.target.value)}
              className="h-9 rounded-lg border border-[#dfe8df] bg-white px-3 text-xs font-semibold outline-none"
            >
              {chapters.map(([chapter, subtitle]) => (
                <option key={chapter} value={chapter}>
                  {chapter}: {subtitle}
                </option>
              ))}
            </select>

            <select
              value={reviewer}
              onChange={(event) => setReviewer(event.target.value)}
              className="h-9 rounded-lg border border-[#dfe8df] bg-white px-3 text-xs font-semibold outline-none"
            >
              <option>Anna Cruz (Adviser)</option>
              <option>Coordinator Review</option>
              <option>Not assigned</option>
            </select>

            <select
              value={fontSize}
              onChange={(event) => {
                setFontSize(event.target.value);
                runCommand("fontSize", "3");
              }}
              className="h-9 rounded-lg border border-[#dfe8df] bg-white px-3 text-xs font-semibold outline-none"
            >
              {fontSizes.map((size) => (
                <option key={size} value={size}>
                  {size}px
                </option>
              ))}
            </select>

            <div className="mx-1 h-7 w-px bg-[#dfe8df]" />

            {[
              ["B", "bold"],
              ["I", "italic"],
              ["U", "underline"],
            ].map(([label, command]) => (
              <button
                key={command}
                type="button"
                onMouseDown={(event) => toolbarAction(event, command)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-xs font-bold hover:bg-[#f3f7f1]"
              >
                {label}
              </button>
            ))}

            <div className="mx-1 h-7 w-px bg-[#dfe8df]" />

            {[
              ["H1", "formatBlock", "h1"],
              ["H2", "formatBlock", "h2"],
              ["P", "formatBlock", "p"],
            ].map(([label, command, value]) => (
              <button
                key={label}
                type="button"
                onMouseDown={(event) => toolbarAction(event, command, value)}
                className="h-9 rounded-lg border border-[#dfe8df] bg-white px-3 text-xs font-bold hover:bg-[#f3f7f1]"
              >
                {label}
              </button>
            ))}

            <div className="mx-1 h-7 w-px bg-[#dfe8df]" />

            <button
              type="button"
              title="Align left"
              aria-label="Align left"
              onMouseDown={(event) => toolbarAction(event, "justifyLeft")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-[#203028] hover:bg-[#eaf3ff]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6H20M4 10H15M4 14H20M4 18H15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <button
              type="button"
              title="Align center"
              aria-label="Align center"
              onMouseDown={(event) => toolbarAction(event, "justifyCenter")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-[#203028] hover:bg-[#eaf3ff]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6H20M7 10H17M4 14H20M7 18H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <button
              type="button"
              title="Align right"
              aria-label="Align right"
              onMouseDown={(event) => toolbarAction(event, "justifyRight")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-[#203028] hover:bg-[#eaf3ff]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6H20M9 10H20M4 14H20M9 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <button
              type="button"
              title="Justify"
              aria-label="Justify"
              onMouseDown={(event) => toolbarAction(event, "justifyFull")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-[#203028] hover:bg-[#eaf3ff]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 6H20M4 10H20M4 14H20M4 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            <div className="mx-1 h-7 w-px bg-[#dfe8df]" />

            <button
              type="button"
              title="Bullet list"
              aria-label="Bullet list"
              onMouseDown={(event) => listAction(event, "ul")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-[#203028] hover:bg-[#f3f7f1]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M9 6H20M9 12H20M9 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <circle cx="5" cy="6" r="1.5" fill="currentColor" />
                <circle cx="5" cy="12" r="1.5" fill="currentColor" />
                <circle cx="5" cy="18" r="1.5" fill="currentColor" />
              </svg>
            </button>

            <button
              type="button"
              title="Numbered list"
              aria-label="Numbered list"
              onMouseDown={(event) => listAction(event, "ol")}
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-[#203028] hover:bg-[#f3f7f1]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path
                  d="M10 6H20M10 12H20M10 18H20"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M4.5 5.5H6V8M4.5 12H6.5M4.5 16.5H6.5L4.5 19H6.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5">
          <div className="overflow-auto rounded-xl bg-[#e9eee9] px-4 py-8">
            <HighlightCommentEditor
              ref={editorRef}
              content={content}
              fontSize={fontSize}
              documentId={activeDocumentId}
              version={activeVersion}
              onInput={handleEditorInput}
              onFocus={forceEditorDirection}
              onKeyDown={forceEditorDirection}
            />
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
