"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import StudentShell from "../_components/StudentShell";
import StatusBadge from "../_components/StatusBadge";
import { getStoredDocuments } from "../documents/_utils/documentStorage";
import {
  getStoredFeedbackItems,
  updateStoredFeedbackItem,
  type StoredFeedbackItem,
} from "../../_utils/feedbackStorage";

const chapters = [
  "Proposal",
  "Chapter 1",
  "Chapter 2",
  "Chapter 3",
  "Chapter 4",
  "Chapter 5",
  "Monitoring Form",
  "Defense Files",
];

const statuses = ["All", "Pending", "Addressed", "Verified"] as const;

const defaultDocumentLinks: Record<string, string> = {
  Proposal: "/student/documents",
  "Chapter 1": "/student/documents",
  "Chapter 2": "/student/documents",
  "Chapter 3": "/student/documents",
  "Chapter 4": "/student/documents",
  "Chapter 5": "/student/documents",
  "Monitoring Form": "/student/documents",
  "Defense Files": "/student/documents",
};

function chapterTitle(chapter: string) {
  const titles: Record<string, string> = {
    Proposal: "Project Proposal",
    "Chapter 1": "Introduction",
    "Chapter 2": "Review of Related Literature",
    "Chapter 3": "Methodology",
    "Chapter 4": "Results and Discussion",
    "Chapter 5": "Conclusion and Recommendations",
    "Monitoring Form": "Monitoring Form",
    "Defense Files": "Defense Files",
  };

  return `${chapter}: ${titles[chapter] || "Document Workspace"}`;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<StoredFeedbackItem[]>([]);
  const [chapterFilter, setChapterFilter] = useState("All Comments");
  const [statusFilter, setStatusFilter] =
    useState<(typeof statuses)[number]>("All");
  const [responses, setResponses] = useState<Record<number, string>>({});
  const [documentLinks, setDocumentLinks] = useState(defaultDocumentLinks);

  useEffect(() => {
    queueMicrotask(() => {
      setFeedback(getStoredFeedbackItems());

      const documents = getStoredDocuments();
      const nextLinks = { ...defaultDocumentLinks };

      chapters.forEach((chapter) => {
        const document = documents.find(
          (item) =>
            item.documentType.includes(chapter) || item.title.includes(chapter),
        );

        if (document) {
          nextLinks[chapter] = `/student/documents/new?documentId=${
            document.id
          }&type=${encodeURIComponent(document.documentType)}`;
        }
      });

      setDocumentLinks(nextLinks);
    });
  }, []);

  const visibleFeedback = useMemo(() => {
    return feedback.filter((item) => {
      const chapterMatches =
        chapterFilter === "All Comments" || item.chapter === chapterFilter;
      const statusMatches =
        statusFilter === "All" || item.status === statusFilter;

      return chapterMatches && statusMatches;
    });
  }, [chapterFilter, feedback, statusFilter]);

  function countForChapter(chapter: string) {
    return feedback.filter((item) => item.chapter === chapter).length;
  }

  function markAddressed(itemId: number) {
    const response = responses[itemId]?.trim();

    setFeedback(
      updateStoredFeedbackItem(itemId, {
        status: "Addressed",
        studentResponse:
          response || "Student marked this feedback as addressed.",
      }),
    );
  }

  return (
    <StudentShell title="Feedback">
      <div className="rounded-lg border border-[#dfe8df] bg-white p-4 sm:p-6">
        <div className="border-b border-[#edf2ec] pb-5">
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Feedback
          </h2>
          <p className="mt-2 text-sm text-[#59645d]">
            Track adviser comments from Pending to Addressed to Verified.
          </p>
        </div>

        <div className="space-y-5 py-5">
          <div>
            <p className="mb-2 text-xs font-semibold text-[#203028]">
              Filter by chapter
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setChapterFilter("All Comments")}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  chapterFilter === "All Comments"
                    ? "bg-[#123f2b] text-white"
                    : "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                }`}
              >
                All Comments
              </button>

              {chapters.map((chapter) => {
                const count = countForChapter(chapter);
                const isActive = chapterFilter === chapter;

                return (
                  <button
                    key={chapter}
                    type="button"
                    onClick={() => setChapterFilter(chapter)}
                    className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#123f2b] text-white"
                        : "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                    }`}
                  >
                    {chapter}
                    {count > 0 && (
                      <span
                        className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[10px] ${
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-[#d7f7d8] text-[#123f2b]"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap justify-start gap-2 sm:justify-end">
            {statuses.map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                  statusFilter === status
                    ? "bg-[#123f2b] text-white"
                    : "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {visibleFeedback.length === 0 ? (
            <div className="rounded-lg border border-dashed border-[#dfe8df] bg-[#fbfdfb] px-5 py-8 text-center">
              <p className="text-sm font-semibold text-[#203028]">
                No feedback matches these filters.
              </p>
              <p className="mt-2 text-xs text-[#7b877f]">
                Try another chapter or status.
              </p>
            </div>
          ) : (
            visibleFeedback.map((item) => (
              <article
                key={item.id}
                className="rounded-lg border border-[#dfe8df] bg-white p-4 sm:p-5"
              >
                <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(280px,420px)]">
                  <div>
                    <StatusBadge status={item.status} />

                    <h3 className="mt-3 text-base font-semibold text-[#203028]">
                      {item.comment}
                    </h3>

                    <p className="mt-2 text-xs text-[#7b877f]">
                      {item.chapter} / {item.version} / Commented by{" "}
                      {item.adviserName} on {item.date}
                    </p>

                    <p className="mt-4 max-w-3xl text-sm leading-6 text-[#59645d]">
                      {item.detail}
                    </p>

                    <p className="mt-5 text-xs text-[#7b877f]">
                      Opens {chapterTitle(item.chapter)} in the document
                      workspace
                    </p>
                  </div>

                  <div className="border-t border-[#edf2ec] pt-4 xl:border-l xl:border-t-0 xl:pl-5 xl:pt-0">
                    <label className="text-xs font-semibold text-[#203028]">
                      Student response
                      <textarea
                        value={
                          responses[item.id] ?? item.studentResponse ?? ""
                        }
                        onChange={(event) =>
                          setResponses((current) => ({
                            ...current,
                            [item.id]: event.target.value,
                          }))
                        }
                        placeholder="Explain what revision was made..."
                        className="mt-2 min-h-24 w-full resize-none rounded-lg border border-[#dfe8df] px-3 py-3 text-sm font-normal leading-6 text-[#203028] outline-none placeholder:text-[#a0aaa3] focus:ring-2 focus:ring-[#d7f7d8]"
                      />
                    </label>

                    <div className="mt-4 flex flex-wrap justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => markAddressed(item.id)}
                        disabled={item.status === "Verified"}
                        className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] transition hover:bg-[#f3f7f1] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark Addressed
                      </button>

                      <Link
                        href={documentLinks[item.chapter] || "/student/documents"}
                        className="inline-flex rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#0f3324]"
                      >
                        Open Linked Document
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>

        <div className="mt-5 flex flex-col gap-3 border-t border-[#edf2ec] pt-4 text-xs text-[#7b877f] sm:flex-row sm:items-center sm:justify-between">
          <p>
            Showing {visibleFeedback.length === 0 ? 0 : 1} to{" "}
            {visibleFeedback.length} of {visibleFeedback.length} feedback
          </p>

          <div className="flex items-center gap-2">
            <span>Show</span>
            <select className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs outline-none">
              <option>10</option>
            </select>
            <span>per page</span>
          </div>
        </div>
      </div>
    </StudentShell>
  );
}
