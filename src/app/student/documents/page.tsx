"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import type { DocumentStatus } from "../_data/mockStudentData";
import {
  getStoredDocuments,
  saveStoredDocuments,
  type StoredDocument,
} from "./_utils/documentStorage";

type ChapterWorkspace = {
  key: string;
  title: string;
  description: string;
  defaultVersion: string;
  defaultStatus: DocumentStatus;
  defaultReviewer: string;
  defaultEditedAt: string;
};

type ChapterRow = ChapterWorkspace & {
  document: StoredDocument;
};

const DELETED_CHAPTER_WORKSPACES_KEY =
  "project-pulse-deleted-chapter-workspaces";

const chapterWorkspaces: ChapterWorkspace[] = [
  {
    key: "Proposal",
    title: "Proposal: Project Proposal",
    description:
      "Initial capstone concept, problem overview, objectives, scope, and proposed solution.",
    defaultVersion: "v0.1",
    defaultStatus: "Draft",
    defaultReviewer: "Adviser",
    defaultEditedAt: "2026-05-01T08:00:00.000Z",
  },
  {
    key: "Chapter 1",
    title: "Chapter 1: Introduction",
    description:
      "Background of the study, problem statement, objectives, and significance.",
    defaultVersion: "v2.1",
    defaultStatus: "Approved",
    defaultReviewer: "Adviser",
    defaultEditedAt: "2026-05-05T08:00:00.000Z",
  },
  {
    key: "Chapter 2",
    title: "Chapter 2: Review of Related Literature",
    description: "Synthesis of related studies and theoretical framework.",
    defaultVersion: "v1.3",
    defaultStatus: "Under Review",
    defaultReviewer: "Adviser",
    defaultEditedAt: "2026-05-03T08:00:00.000Z",
  },
  {
    key: "Chapter 3",
    title: "Chapter 3: Methodology",
    description: "Research design, participants, instruments, and procedures.",
    defaultVersion: "v1.0",
    defaultStatus: "Draft",
    defaultReviewer: "Not assigned",
    defaultEditedAt: "2026-05-06T08:00:00.000Z",
  },
  {
    key: "Chapter 4",
    title: "Chapter 4: Results and Discussion",
    description: "Presentation, analysis, and interpretation of results.",
    defaultVersion: "v0.1",
    defaultStatus: "Draft",
    defaultReviewer: "Not assigned",
    defaultEditedAt: "2026-04-30T08:00:00.000Z",
  },
  {
    key: "Chapter 5",
    title: "Chapter 5: Conclusion and Recommendations",
    description:
      "Summary of findings, conclusions, and recommendations for future studies.",
    defaultVersion: "v0.1",
    defaultStatus: "Draft",
    defaultReviewer: "Not assigned",
    defaultEditedAt: "2026-04-29T08:00:00.000Z",
  },
];

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function buildChapterContent(chapter: ChapterWorkspace) {
  return `
    <h1>${chapter.title}</h1>
    <p>${chapter.description}</p>
    <h2>Draft Notes</h2>
    <p>Use this workspace to write, revise, review comments, and save chapter versions.</p>
  `;
}

function createChapterDocument(
  chapter: ChapterWorkspace,
  id: number,
): StoredDocument {
  const currentContent = buildChapterContent(chapter);

  return {
    id,
    title: chapter.title,
    documentType: chapter.key,
    currentVersion: chapter.defaultVersion,
    currentContent,
    createdAt: chapter.defaultEditedAt,
    updatedAt: chapter.defaultEditedAt,
    status: chapter.defaultStatus,
    reviewer: chapter.defaultReviewer,
    revisions: [
      {
        id,
        revisionNumber: Number(chapter.defaultVersion.replace("v", "")) || 1,
        version: chapter.defaultVersion,
        editedBy: "Student Name",
        editedAt: formatDate(chapter.defaultEditedAt),
        chapter: chapter.key,
        beforeContent: "",
        afterContent: currentContent,
        revisionNote: "Initial chapter workspace",
      },
    ],
  };
}

function findChapterDocument(
  documents: StoredDocument[],
  chapter: ChapterWorkspace,
) {
  return documents.find(
    (document) =>
      document.documentType.includes(chapter.key) ||
      document.title.includes(chapter.key),
  );
}

function findChapterWorkspace(document: StoredDocument) {
  return (
    chapterWorkspaces.find(
      (chapter) =>
        document.documentType.includes(chapter.key) ||
        document.title.includes(chapter.key),
    ) || chapterWorkspaces[0]
  );
}

function getLatestUploadedFileName(document: StoredDocument) {
  if (document.latestUploadedFileName) return document.latestUploadedFileName;

  const uploadedRevision = document.revisions.find(
    (revision) => revision.uploadedFileName,
  );

  if (uploadedRevision?.uploadedFileName) {
    return uploadedRevision.uploadedFileName;
  }

  const uploadNote = document.revisions.find((revision) =>
    revision.revisionNote.includes("Uploaded new chapter version ("),
  )?.revisionNote;

  const match = uploadNote?.match(/Uploaded new chapter version \((.+)\)$/);

  return match?.[1] || "";
}

function getDeletedChapterKeys() {
  if (typeof window === "undefined") return new Set<string>();

  const saved = window.localStorage.getItem(DELETED_CHAPTER_WORKSPACES_KEY);
  return new Set(saved ? (JSON.parse(saved) as string[]) : []);
}

function saveDeletedChapterKeys(keys: Set<string>) {
  window.localStorage.setItem(
    DELETED_CHAPTER_WORKSPACES_KEY,
    JSON.stringify([...keys]),
  );
}

function getChapterRows() {
  const documents = getStoredDocuments();
  const nextDocuments = [...documents];
  const deletedChapterKeys = getDeletedChapterKeys();
  let nextId = Math.max(1000, ...documents.map((document) => document.id)) + 1;

  chapterWorkspaces.forEach((chapter) => {
    let document = findChapterDocument(nextDocuments, chapter);

    if (!document && !deletedChapterKeys.has(chapter.key)) {
      document = createChapterDocument(chapter, nextId);
      nextId += 1;
      nextDocuments.push(document);
    }
  });

  const rows = nextDocuments
    .filter((document) => !deletedChapterKeys.has(String(document.id)))
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    )
    .map((document) => {
      const workspace = findChapterWorkspace(document);

      return {
        ...workspace,
        key: String(document.id),
        title: document.title || workspace.title,
        description: document.notes || workspace.description,
        document,
      };
    });

  if (nextDocuments.length !== documents.length) {
    saveStoredDocuments(nextDocuments);
  }

  return rows;
}

function metricCardClasses(status: string) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700";
  if (status === "Under Review") return "bg-amber-50 text-amber-700";
  if (status === "Needs Revision") return "bg-orange-50 text-orange-700";
  return "bg-blue-50 text-blue-700";
}

function documentProgress(status: DocumentStatus) {
  if (status === "Approved") return 100;
  if (status === "Under Review") return 72;
  if (status === "Needs Revision") return 45;
  return 30;
}

function getDocumentVersion(document: StoredDocument) {
  const revisionCount = document.revisions.length;

  if (revisionCount > 0) return `v${revisionCount}`;

  return document.currentVersion || "v1";
}

export default function DocumentsPage() {
  const [chapters, setChapters] = useState<ChapterRow[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => setChapters(getChapterRows()));
  }, []);

  function deleteChapter(chapter: ChapterRow) {
    const confirmed = window.confirm(
      `Delete ${chapter.title}? This removes the workspace from your documents overview.`,
    );

    if (!confirmed) return;

    const nextDocuments = getStoredDocuments().filter(
      (document) => document.id !== chapter.document.id,
    );

    const deletedChapterKeys = getDeletedChapterKeys();
    deletedChapterKeys.add(String(chapter.document.id));

    saveStoredDocuments(nextDocuments);
    saveDeletedChapterKeys(deletedChapterKeys);

    setChapters((current) =>
      current.filter((item) => item.document.id !== chapter.document.id),
    );
    setOpenMenu(null);
  }

  const metrics = [
    {
      label: "Drafting",
      value: chapters.filter((chapter) => chapter.document.status === "Draft")
        .length,
      caption: "Chapters in progress",
      status: "Draft",
      icon: "Doc",
    },
    {
      label: "Under Review",
      value: chapters.filter(
        (chapter) => chapter.document.status === "Under Review",
      ).length,
      caption: "Awaiting reviewer feedback",
      status: "Under Review",
      icon: "Clock",
    },
    {
      label: "Approved",
      value: chapters.filter((chapter) => chapter.document.status === "Approved")
        .length,
      caption: "Chapters approved",
      status: "Approved",
      icon: "OK",
    },
    {
      label: "Needs Revision",
      value: chapters.filter(
        (chapter) => chapter.document.status === "Needs Revision",
      ).length,
      caption: "Revisions requested",
      status: "Needs Revision",
      icon: "!",
    },
  ];

  return (
    <StudentShell title="Documents Overview">
      <div className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
              Documents
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
              Submit, store, review, compare, and restore document versions
              across your capstone chapters.
            </p>
          </div>

          <Link
            href="/student/documents/new"
            className="inline-flex items-center justify-center rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
          >
            Add Chapter Workspace
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <Card key={metric.label} className="p-5">
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-2xl text-xs font-bold ${metricCardClasses(
                    metric.status,
                  )}`}
                >
                  {metric.icon}
                </div>
                <div>
                  <p className="text-sm text-[#59645d]">{metric.label}</p>
                  <p className="mt-1 text-2xl font-semibold text-[#203028]">
                    {metric.value}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {metric.caption}
                  </p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h3 className="text-base font-semibold text-[#203028]">
              Submitted Documents
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1100px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Document</th>
                  <th className="px-5 py-3 font-medium">Current Version</th>
                  <th className="px-5 py-3 font-medium">Last Edited</th>
                  <th className="px-5 py-3 font-medium">Reviewer</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                  <th className="px-5 py-3 font-medium">More</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {chapters.map((chapter) => (
                  <tr key={chapter.document.id} className="hover:bg-[#fbfdfb]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${metricCardClasses(
                            chapter.document.status,
                          )}`}
                        >
                          Doc
                        </div>

                        <div>
                          <p className="font-semibold text-[#203028]">
                            {chapter.title}
                          </p>
                          <p className="mt-1 max-w-md text-xs leading-5 text-[#59645d]">
                            {chapter.description}
                          </p>

                          {getLatestUploadedFileName(chapter.document) && (
                            <p className="mt-2 inline-flex rounded-md bg-[#eefaf0] px-2 py-1 text-[11px] font-semibold text-[#4f8f58]">
                              Uploaded:{" "}
                              {getLatestUploadedFileName(chapter.document)}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4 text-[#59645d]">
                      <p>{getDocumentVersion(chapter.document)}</p>

                      {getLatestUploadedFileName(chapter.document) && (
                        <p className="mt-1 max-w-40 truncate text-[11px] text-[#4f8f58]">
                          {getLatestUploadedFileName(chapter.document)}
                        </p>
                      )}
                    </td>

                    <td className="px-5 py-4 text-[#59645d]">
                      {formatDate(chapter.document.updatedAt)}
                    </td>

                    <td className="px-5 py-4 text-[#59645d]">
                      {chapter.document.reviewer}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex min-w-32 items-center gap-3">
                        <div className="h-2 flex-1 rounded-full bg-[#edf2ec]">
                          <div
                            className="h-2 rounded-full bg-[#94d29a]"
                            style={{
                              width: `${documentProgress(
                                chapter.document.status,
                              )}%`,
                            }}
                          />
                        </div>
                        <span className="w-9 text-xs font-semibold text-[#203028]">
                          {documentProgress(chapter.document.status)}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={chapter.document.status} />
                    </td>

                    <td className="px-5 py-4">
                      <Link
                        href={`/student/documents/new?documentId=${
                          chapter.document.id
                        }&type=${encodeURIComponent(
                          chapter.document.documentType,
                        )}`}
                        className="inline-flex rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
                      >
                        Open Workspace
                      </Link>
                    </td>

                    <td className="relative px-5 py-4">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu((current) =>
                            current === chapter.key ? null : chapter.key,
                          )
                        }
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        More
                      </button>

                      {openMenu === chapter.key && (
                        <div className="absolute right-5 top-12 z-20 w-44 overflow-hidden rounded-lg border border-[#dfe8df] bg-white text-xs shadow-lg">
                          <button
                            type="button"
                            onClick={() => deleteChapter(chapter)}
                            className="block w-full px-4 py-2.5 text-left text-red-600 hover:bg-red-50"
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {chapters.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-5 py-10 text-center text-sm text-[#7b877f]"
                    >
                      No documents yet. Add a chapter workspace to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="border-t border-[#edf2ec] px-5 py-4 text-xs text-[#7b877f]">
            Showing {chapters.length === 0 ? 0 : 1} to {chapters.length} of{" "}
            {chapters.length} submitted documents
          </div>
        </Card>
      </div>
    </StudentShell>
  );
}
