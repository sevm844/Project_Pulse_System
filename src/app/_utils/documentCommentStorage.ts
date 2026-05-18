export type DocumentCommentAuthorRole = "Student" | "Adviser";
export type DocumentCommentStatus = "Open" | "Addressed" | "Resolved";

export type StoredDocumentComment = {
  id: string;
  documentId: number;
  version: string;
  groupName: string;
  course: string;
  section: string;
  documentTitle: string;
  selectedText: string;
  startOffset: number;
  endOffset: number;
  prefix: string;
  suffix: string;
  comment: string;
  authorName: string;
  authorRole: DocumentCommentAuthorRole;
  status: DocumentCommentStatus;
  createdAt: string;
  updatedAt: string;
};

const DOCUMENT_COMMENT_STORAGE_KEY = "project-pulse-document-comments";
export const DOCUMENT_COMMENTS_UPDATED_EVENT =
  "project-pulse-document-comments-updated";

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function isStoredDocumentComment(value: unknown): value is StoredDocumentComment {
  if (!value || typeof value !== "object") return false;

  const comment = value as Partial<StoredDocumentComment>;

  return (
    typeof comment.id === "string" &&
    typeof comment.documentId === "number" &&
    typeof comment.version === "string" &&
    typeof comment.selectedText === "string" &&
    typeof comment.startOffset === "number" &&
    typeof comment.endOffset === "number" &&
    typeof comment.comment === "string"
  );
}

export function getStoredDocumentComments() {
  if (!canUseStorage()) return [];

  const saved = window.localStorage.getItem(DOCUMENT_COMMENT_STORAGE_KEY);
  if (!saved) return [];

  try {
    const parsed = JSON.parse(saved) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter(isStoredDocumentComment);
    }

    if (parsed && typeof parsed === "object") {
      const values = Object.values(parsed);
      const comments = values.filter(isStoredDocumentComment);

      if (comments.length > 0) {
        saveStoredDocumentComments(comments);
        return comments;
      }
    }
  } catch {
    // Fall through and reset the invalid cache below.
  }

  window.localStorage.setItem(DOCUMENT_COMMENT_STORAGE_KEY, "[]");
  return [];
}

export function saveStoredDocumentComments(comments: StoredDocumentComment[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    DOCUMENT_COMMENT_STORAGE_KEY,
    JSON.stringify(comments),
  );
  window.dispatchEvent(new Event(DOCUMENT_COMMENTS_UPDATED_EVENT));
}

export function getDocumentComments(documentId: number, version?: string) {
  return getStoredDocumentComments().filter(
    (comment) =>
      comment.documentId === documentId &&
      (!version || comment.version === version),
  );
}

export function addStoredDocumentComment(
  comment: Omit<
    StoredDocumentComment,
    "id" | "status" | "createdAt" | "updatedAt"
  >,
) {
  const now = new Date().toISOString();
  const nextComment: StoredDocumentComment = {
    ...comment,
    id: `doc-comment-${Date.now()}`,
    status: "Open",
    createdAt: now,
    updatedAt: now,
  };

  saveStoredDocumentComments([
    nextComment,
    ...getStoredDocumentComments().filter(
      (item) => item.id !== nextComment.id,
    ),
  ]);

  return nextComment;
}
