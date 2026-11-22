import type { JSONContent } from "@tiptap/react";
import { apiFetch } from "./api";
import type { DroppedContent } from "./manuscript";

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
