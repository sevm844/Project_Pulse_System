import type { JSONContent } from "@tiptap/react";
import { apiFetch } from "./api";
import type { CommentAnchor, DroppedContent, ManuscriptComment } from "./manuscript";

// Extra documents of a group, beside the official manuscript (the Manuscript home).
export type GroupDocument = {
  document_id: number;
  project_id: number;
  title: string;
  revision: number;
  share_adviser: boolean;
  share_dean: boolean;
  saved_at: string;
  saved_by: string | null;
};

export type GroupDocumentFull = GroupDocument & { content: JSONContent };

export type ManuscriptHome = {
  project_id: number;
  official: { saved_at: string | null; saved_by: string | null; latest_version: number };
  adviser_name: string | null;
  documents: GroupDocument[];
};

export const fetchManuscriptHome = () => apiFetch<ManuscriptHome>("/my-documents");

export const createGroupDocument = (title?: string) =>
  apiFetch<GroupDocumentFull>("/my-documents", { method: "POST", body: JSON.stringify({ title: title ?? "" }) });

export const fetchGroupDocument = (id: number) => apiFetch<GroupDocumentFull>(`/my-documents/${id}`);

export const saveGroupDocument = (id: number, baseRevision: number, change: { content?: JSONContent; title?: string }) =>
  apiFetch<GroupDocument & { dropped: DroppedContent; content?: JSONContent }>(`/my-documents/${id}`, {
    method: "PUT",
    body: JSON.stringify({ ...change, base_revision: baseRevision }),
  });

export const shareGroupDocument = (id: number, adviser: boolean, dean: boolean) =>
  apiFetch<GroupDocument>(`/my-documents/${id}/sharing`, { method: "PUT", body: JSON.stringify({ adviser, dean }) });

export const deleteGroupDocument = (id: number) => apiFetch<{ message: string }>(`/my-documents/${id}`, { method: "DELETE" });

// What the adviser and the Dean may read: only documents a member shared with them.
export const fetchSharedDocuments = (projectId: number) => apiFetch<GroupDocument[]>(`/projects/${projectId}/shared-documents`);

export const fetchSharedDocument = (id: number) => apiFetch<GroupDocumentFull>(`/shared-documents/${id}`);

// The readable copy of the live document (what the adviser and the Dean read when it is shared). `seq` is the last change of the live document it includes.
export const saveGroupDocumentSnapshot = (id: number, content: JSONContent, seq: number) =>
  apiFetch<GroupDocument & { dropped: DroppedContent; stale: boolean }>(`/my-documents/${id}/snapshot`, {
    method: "PUT",
    body: JSON.stringify({ content, seq }),
  });

// A rename never conflicts with typing.
export const renameGroupDocument = (id: number, title: string) =>
  apiFetch<GroupDocument>(`/my-documents/${id}`, { method: "PUT", body: JSON.stringify({ title }) });

// Step 2: a member sends a frozen copy of a shared document for review. The adviser and the Dean comment on the copy; the adviser decides.
export type DocumentReview = {
  review_id: number;
  document_id: number;
  review_no: number;
  word_count: number;
  note: string | null;
  sent_by: string;
  sent_at: string;
  comments_total: number;
  comments_open: number;
  decision: "Approved" | "Needs Changes" | null;
  decision_note: string | null;
  decided_by: string | null;
  decided_at: string | null;
};

export const fetchDocumentReviews = (documentId: number) => apiFetch<DocumentReview[]>(`/documents/${documentId}/reviews`);

export const sendDocumentForReview = (documentId: number, note: string) =>
  apiFetch<DocumentReview>(`/my-documents/${documentId}/reviews`, { method: "POST", body: JSON.stringify({ note: note.trim() || null }) });

export const fetchDocumentReview = (reviewId: number) =>
  apiFetch<DocumentReview & { content: JSONContent; comments: ManuscriptComment[] }>(`/document-reviews/${reviewId}`);

export const addDocumentComment = (reviewId: number, body: string, anchor?: CommentAnchor) =>
  apiFetch<ManuscriptComment>(`/document-reviews/${reviewId}/comments`, { method: "POST", body: JSON.stringify({ body, ...anchor }) });

export const replyToDocumentComment = (commentId: number, body: string) =>
  apiFetch<ManuscriptComment>(`/document-comments/${commentId}/replies`, { method: "POST", body: JSON.stringify({ body }) });

export const setDocumentCommentStatus = (commentId: number, status: "Open" | "Resolved") =>
  apiFetch<ManuscriptComment>(`/document-comments/${commentId}/status`, { method: "PUT", body: JSON.stringify({ status }) });

export const decideDocumentReview = (reviewId: number, decision: "Approved" | "Needs Changes", note: string) =>
  apiFetch<DocumentReview>(`/document-reviews/${reviewId}/decision`, { method: "PUT", body: JSON.stringify({ decision, note }) });
