"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent,
} from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  courses,
  reviewQueue,
  sections,
  type CourseCode,
  type GroupStage,
  type ReviewItem,
  type ReviewStatus,
} from "../_data/mockAdviserData";
import {
  addStoredFeedbackItem,
  getChapterFromDocumentTitle,
} from "../../_utils/feedbackStorage";
import {
  getStoredDocuments,
  saveStoredDocuments,
  type StoredDocument,
} from "../../student/documents/_utils/documentStorage";
import { getStoredStudentGroup } from "../../student/_utils/studentGroupStorage";
import {
  addStoredDocumentComment,
  getDocumentComments,
  type StoredDocumentComment,
} from "../../_utils/documentCommentStorage";

const stages: GroupStage[] = [
  "Proposal Review",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
];

function getStageFromDocument(document: StoredDocument): GroupStage {
  if (document.documentType === "Proposal") return "Proposal Review";
  return "Alpha Defense";
}

function normalizeGroupStage(
  value: string | undefined,
  fallback: GroupStage,
): GroupStage {
  if (
    value === "Proposal Review" ||
    value === "Alpha Defense" ||
    value === "Beta Defense" ||
    value === "Final Defense"
  ) {
    return value;
  }

  return fallback;
}

function shouldShowForAnnaCruz(document: StoredDocument) {
  const reviewer = document.reviewer.toLowerCase();

  return (
    ["Submitted", "Under Review", "Approved", "Needs Revision"].includes(
      document.status,
    ) &&
    (reviewer.includes("anna cruz") || reviewer.includes("adviser"))
  );
}

function getSubmittedAt(document: StoredDocument) {
  return new Date(document.updatedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getReviewStatusFromDocument(document: StoredDocument): ReviewStatus {
  if (document.status === "Approved") return "Approved";
  if (document.status === "Needs Revision") return "Needs Revision";
  return "Pending";
}

function getDocumentStatusFromReview(
  status: ReviewStatus,
): StoredDocument["status"] {
  if (status === "Approved") return "Approved";
  if (status === "Needs Revision" || status === "Rejected") {
    return "Needs Revision";
  }

  return "Under Review";
}

function mapDocumentToReview(document: StoredDocument): ReviewItem {
  const studentGroup = getStoredStudentGroup();
  const fallbackStage = getStageFromDocument(document);

  return {
    id: document.id,
    documentId: document.id,
    groupId: 1,
    course: studentGroup?.course || "BSIT",
    section: studentGroup?.section || "4A",
    groupName: studentGroup?.groupName || "Project Pulse",
    projectTitle:
      studentGroup?.projectTitle || "Smart Capstone Monitoring System",
    documentTitle: document.title,
    version: document.currentVersion,
    submittedAt: getSubmittedAt(document),
    stage: normalizeGroupStage(studentGroup?.stage, fallbackStage),
    status: getReviewStatusFromDocument(document),
    comments: [],
  };
}

function mergeReviewsWithStudentSubmissions(
  baseReviews: ReviewItem[],
  documents: StoredDocument[],
) {
  const submittedReviews = documents
    .filter(shouldShowForAnnaCruz)
    .map(mapDocumentToReview);

  const baseWithoutDuplicates = baseReviews.filter(
    (review) =>
      !submittedReviews.some(
        (submitted) =>
          submitted.id === review.id ||
          submitted.documentTitle === review.documentTitle,
      ),
  );

  return [...submittedReviews, ...baseWithoutDuplicates];
}

function updateStoredDocumentStatus(reviewId: number, status: ReviewStatus) {
  const documents = getStoredDocuments();

  const nextDocuments = documents.map((document) =>
    document.id === reviewId
      ? {
          ...document,
          status: getDocumentStatusFromReview(status),
          updatedAt: new Date().toISOString(),
        }
      : document,
  );

  saveStoredDocuments(nextDocuments);
}

function getSelectedDocumentContent(selected: ReviewItem) {
  if (!selected.documentId) {
    return `
      <p><strong>${selected.projectTitle}</strong></p>
      <p>This is a sample adviser document item. No student document content is linked to this mock submission.</p>
    `;
  }

  const document = getStoredDocuments().find(
    (item) => item.id === selected.documentId,
  );

  if (!document) {
    return `
      <p><strong>${selected.projectTitle}</strong></p>
      <p>The linked student document could not be found in local storage.</p>
    `;
  }

  return (
    document.currentContent ||
    `
      <p><strong>${document.title}</strong></p>
      <p>This submitted document has no written content yet.</p>
    `
  );
}

type TextSelectionAnchor = {
  selectedText: string;
  startOffset: number;
  endOffset: number;
  prefix: string;
  suffix: string;
};

function getTextOffset(
  root: HTMLElement,
  targetNode: Node,
  targetOffset: number,
) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;

  while (walker.nextNode()) {
    const node = walker.currentNode;

    if (node === targetNode) {
      return offset + targetOffset;
    }

    offset += node.textContent?.length || 0;
  }

  return offset;
}

function captureTextSelection(root: HTMLElement): TextSelectionAnchor | null {
  const selection = window.getSelection();

  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }

  const range = selection.getRangeAt(0);

  if (!root.contains(range.commonAncestorContainer)) {
    return null;
  }

  const selectedText = selection.toString().trim();
  if (!selectedText) return null;

  const startOffset = getTextOffset(root, range.startContainer, range.startOffset);
  const endOffset = getTextOffset(root, range.endContainer, range.endOffset);
  const fullText = root.innerText;

  return {
    selectedText,
    startOffset,
    endOffset,
    prefix: fullText.slice(Math.max(0, startOffset - 40), startOffset),
    suffix: fullText.slice(endOffset, endOffset + 40),
  };
}

function wrapTextRange(root: HTMLElement, comment: StoredDocumentComment) {
  if (comment.endOffset <= comment.startOffset) return;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let offset = 0;
  const textNodes: Text[] = [];

  while (walker.nextNode()) {
    textNodes.push(walker.currentNode as Text);
  }

  textNodes.forEach((node) => {
    const length = node.textContent?.length || 0;
    const nodeStart = offset;
    const nodeEnd = offset + length;
    offset = nodeEnd;

    if (comment.endOffset <= nodeStart || comment.startOffset >= nodeEnd) {
      return;
    }

    const start = Math.max(0, comment.startOffset - nodeStart);
    const end = Math.min(length, comment.endOffset - nodeStart);

    if (end <= start) return;

    const range = document.createRange();
    range.setStart(node, start);
    range.setEnd(node, end);

    const mark = document.createElement("mark");
    mark.dataset.documentCommentId = comment.id;
    mark.dataset.selectedText = comment.selectedText;
    mark.dataset.comment = comment.comment;
    mark.className = "adviser-document-highlight";
    mark.title = "Click to view adviser comment";

    try {
      range.surroundContents(mark);
    } catch {
      const selectedContent = range.extractContents();
      mark.appendChild(selectedContent);
      range.insertNode(mark);
    }
  });
}

export default function ReviewsPage() {
  const viewerRef = useRef<HTMLDivElement | null>(null);
  const [reviews, setReviews] = useState<ReviewItem[]>(reviewQueue);
  const [selected, setSelected] = useState<ReviewItem>(reviewQueue[0]);
  const [documentComments, setDocumentComments] = useState<
    StoredDocumentComment[]
  >([]);
  const [selectedAnchor, setSelectedAnchor] =
    useState<TextSelectionAnchor | null>(null);
  const [activeDocumentComment, setActiveDocumentComment] =
    useState<StoredDocumentComment | null>(null);

  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [section, setSection] = useState("All");
  const [stage, setStage] = useState<"All" | GroupStage>("All");

  const [comment, setComment] = useState("");
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const documents = getStoredDocuments();
    const nextReviews = mergeReviewsWithStudentSubmissions(
      reviewQueue,
      documents,
    );

    queueMicrotask(() => {
      setReviews(nextReviews);
      setSelected(nextReviews[0] || reviewQueue[0]);
    });
  }, []);

  const filteredReviews = useMemo(() => {
    return reviews.filter((review) => {
      const matchesCourse = course === "All" || review.course === course;
      const matchesSection = section === "All" || review.section === section;
      const matchesStage = stage === "All" || review.stage === stage;

      return matchesCourse && matchesSection && matchesStage;
    });
  }, [course, section, stage, reviews]);

  const selectedDocumentContent = useMemo(
    () => getSelectedDocumentContent(selected),
    [selected],
  );

  useEffect(() => {
    const documentId = selected.documentId;

    if (!documentId) {
      queueMicrotask(() => {
        setDocumentComments([]);
        setSelectedAnchor(null);
        setActiveDocumentComment(null);
      });
      return;
    }

    queueMicrotask(() => {
      setDocumentComments(getDocumentComments(documentId, selected.version));
      setSelectedAnchor(null);
      setActiveDocumentComment(null);
    });
  }, [selected]);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    viewer.innerHTML = selectedDocumentContent;
    documentComments.forEach((item) => wrapTextRange(viewer, item));
  }, [documentComments, selectedDocumentContent]);

  function updateStatus(status: ReviewItem["status"]) {
    const nextSelected = { ...selected, status };

    setReviews((current) =>
      current.map((review) =>
        review.id === selected.id ? nextSelected : review,
      ),
    );

    setSelected(nextSelected);
    updateStoredDocumentStatus(selected.id, status);
    setRejectReason("");
  }

  function addComment() {
    const nextComment = comment.trim();
    if (!nextComment) return;

    const nextReview: ReviewItem = {
      ...selected,
      comments: [...selected.comments, nextComment],
      status: "Needs Revision",
    };

    setReviews((current) =>
      current.map((review) =>
        review.id === selected.id ? nextReview : review,
      ),
    );

    updateStoredDocumentStatus(selected.id, "Needs Revision");

    let anchoredComment: StoredDocumentComment | null = null;

    if (selected.documentId && selectedAnchor) {
      anchoredComment = addStoredDocumentComment({
        documentId: selected.documentId,
        version: selected.version,
        groupName: selected.groupName,
        course: selected.course,
        section: selected.section,
        documentTitle: selected.documentTitle,
        selectedText: selectedAnchor.selectedText,
        startOffset: selectedAnchor.startOffset,
        endOffset: selectedAnchor.endOffset,
        prefix: selectedAnchor.prefix,
        suffix: selectedAnchor.suffix,
        comment: nextComment,
        authorName: "Anna Cruz",
        authorRole: "Adviser",
      });
    }

    addStoredFeedbackItem({
      reviewId: selected.id,
      groupName: selected.groupName,
      course: selected.course,
      section: selected.section,
      projectTitle: selected.projectTitle,
      documentTitle: selected.documentTitle,
      chapter: getChapterFromDocumentTitle(selected.documentTitle),
      version: selected.version,
      comment: nextComment,
      documentCommentId: anchoredComment?.id,
      selectedText: anchoredComment?.selectedText,
      startOffset: anchoredComment?.startOffset,
      endOffset: anchoredComment?.endOffset,
      detail:
        anchoredComment
          ? `Highlighted text: "${anchoredComment.selectedText}". Please revise this exact part in the linked document, then mark the feedback as addressed.`
          : "Please revise the linked document based on the adviser comment, then mark the feedback as addressed after updating the chapter workspace.",
      adviserName: "Anna Cruz",
    });

    setSelected(nextReview);
    setComment("");
    setSelectedAnchor(null);
    setActiveDocumentComment(anchoredComment);

    if (selected.documentId) {
      setDocumentComments(
        getDocumentComments(selected.documentId, selected.version),
      );
    }
  }

  function handleViewerMouseUp() {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const anchor = captureTextSelection(viewer);
    if (!anchor) return;

    setSelectedAnchor(anchor);
    setActiveDocumentComment(null);
  }

  function handleViewerClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target;

    if (!(target instanceof HTMLElement)) return;

    const highlight = target.closest("mark[data-document-comment-id]");
    if (!(highlight instanceof HTMLElement)) return;

    const found = documentComments.find(
      (item) => item.id === highlight.dataset.documentCommentId,
    );

    if (found) {
      setActiveDocumentComment(found);
      setSelectedAnchor(null);
    }
  }

  return (
    <AdviserShell title="Documents">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Course
              </label>
              <select
                value={course}
                onChange={(e) =>
                  setCourse(e.target.value as "All" | CourseCode)
                }
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {courses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {sections.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as "All" | GroupStage)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {stages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[340px_1fr]">
          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Document Queue
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Select a submitted document by course, section, or stage.
              </p>
            </div>

            <div className="max-h-[720px] space-y-2 overflow-y-auto p-3">
              {filteredReviews.map((review) => (
                <button
                  key={review.id}
                  type="button"
                  onClick={() => setSelected(review)}
                  className={`w-full rounded-xl p-4 text-left transition ${
                    selected.id === review.id
                      ? "bg-[#d7f7d8]"
                      : "bg-[#f8faf7] hover:bg-[#eff6ee]"
                  }`}
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-[#4f8f58]">
                      {review.course} {review.section}
                    </p>
                    <StatusBadge status={review.status} />
                  </div>

                  <p className="text-sm font-semibold text-[#203028]">
                    {review.groupName}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {review.documentTitle}
                  </p>
                  <p className="mt-2 text-xs text-[#7b877f]">
                    {review.stage} • {review.version}
                  </p>
                </button>
              ))}

              {filteredReviews.length === 0 && (
                <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                  No documents found for the selected filters.
                </p>
              )}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-xl font-semibold text-[#203028]">
                      {selected.documentTitle}
                    </h2>
                    <StatusBadge status={selected.status} />
                  </div>

                  <p className="mt-2 text-sm text-[#7b877f]">
                    {selected.course} {selected.section} • {selected.groupName}{" "}
                    • {selected.stage}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {selected.version} • Submitted {selected.submittedAt}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus("Approved")}
                    className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    onClick={() => updateStatus("Needs Revision")}
                    className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                  >
                    Request Revision
                  </button>
                </div>
              </div>
            </Card>

            <div className="grid gap-5 lg:grid-cols-[1fr_340px]">
              <Card className="p-6">
                <h3 className="text-lg font-semibold text-[#203028]">
                  Document Viewer
                </h3>

                <style jsx global>{`
                  .adviser-document-highlight {
                    background: #fef08a;
                    border-radius: 3px;
                    cursor: pointer;
                    padding: 0 2px;
                  }

                  .adviser-document-highlight:hover {
                    background: #fde047;
                  }
                `}</style>

                <div
                  ref={viewerRef}
                  onMouseUp={handleViewerMouseUp}
                  onClick={handleViewerClick}
                  className="mt-5 min-h-[520px] rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-6 text-sm leading-7 text-[#59645d]"
                />
              </Card>

              <aside className="space-y-5">
                <Card className="p-5">
                  <h3 className="text-lg font-semibold text-[#203028]">
                    Comment Sidebar
                  </h3>

                  <div className="mt-4 space-y-3">
                    {selectedAnchor && (
                      <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#16a34a]">
                          Selected text
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#203028]">
                          {selectedAnchor.selectedText}
                        </p>
                      </div>
                    )}

                    {activeDocumentComment && (
                      <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-yellow-700">
                          Linked highlight
                        </p>
                        <p className="mt-2 text-sm leading-6 text-[#203028]">
                          {activeDocumentComment.selectedText}
                        </p>
                        <p className="mt-3 text-sm leading-6 text-[#59645d]">
                          {activeDocumentComment.comment}
                        </p>
                      </div>
                    )}

                    {selected.comments.length === 0 ? (
                      <p className="rounded-xl bg-[#f8faf7] p-4 text-sm text-[#7b877f]">
                        No comments added yet.
                      </p>
                    ) : (
                      selected.comments.map((item, index) => (
                        <div key={index} className="rounded-xl bg-[#f8faf7] p-4">
                          <p className="text-sm text-[#59645d]">{item}</p>
                        </div>
                      ))
                    )}
                  </div>

                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      selectedAnchor
                        ? "Write a comment for the highlighted text..."
                        : "Add adviser comment..."
                    }
                    className="mt-4 min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <button
                    type="button"
                    onClick={addComment}
                    className="mt-3 w-full rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                  >
                    Add Comment
                  </button>
                </Card>

                <Card className="p-5">
                  <h3 className="text-lg font-semibold text-[#203028]">
                    Reject Submission
                  </h3>

                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Reason is required before rejecting."
                    className="mt-4 min-h-20 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  />

                  <button
                    type="button"
                    onClick={() => {
                      if (rejectReason.trim()) updateStatus("Rejected");
                    }}
                    className="mt-3 w-full rounded-lg border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-semibold text-rose-700 hover:bg-rose-100"
                  >
                    Reject
                  </button>
                </Card>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </AdviserShell>
  );
}
