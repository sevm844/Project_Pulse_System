import type { JSONContent } from "@tiptap/react";
import { apiFetch } from "./api";

// One frozen version of the manuscript (the list leaves the content out; opening one brings it).
export type ManuscriptVersion = {
  version_no: number;
  word_count: number;
  note: string | null;
  saved_by: string | null;
  // Everyone who saved the draft since the previous version.
  editors: string[];
  saved_at: string | null;
  content?: JSONContent;
};

// The group's private draft.
export type ManuscriptDraft = {
  manuscript_id: number;
  project_id: number;
  draft?: JSONContent;
  draft_revision: number;
  has_unsubmitted_changes: boolean;
  saved_at: string | null;
  saved_by: string | null;
  versions?: ManuscriptVersion[];
};

export const fetchMyManuscript = () => apiFetch<ManuscriptDraft & { draft: JSONContent; versions: ManuscriptVersion[] }>("/my-manuscript");

// Every save names the revision it started from; the server answers 409 when a group member saved a newer draft.
// What the server could not keep from pasted content (pictures from other sites, odd links and styles), and, when
// anything was removed, the document as it was really saved.
export type DroppedContent = { images: number; links: number; styles: number };

export const saveManuscriptDraft = (content: JSONContent, baseRevision: number) =>
  apiFetch<ManuscriptDraft & { dropped: DroppedContent; content?: JSONContent }>("/my-manuscript/draft", {
    method: "PUT",
    body: JSON.stringify({ content, base_revision: baseRevision }),
  });

export const submitManuscriptVersion = (baseRevision: number, note: string) =>
  apiFetch<ManuscriptVersion>("/my-manuscript/versions", {
    method: "POST",
    body: JSON.stringify({ base_revision: baseRevision, note: note.trim() || undefined }),
  });

export const fetchManuscriptVersions = (projectId: number) => apiFetch<ManuscriptVersion[]>(`/projects/${projectId}/manuscript/versions`);

export const fetchManuscriptVersion = (projectId: number, versionNo: number) =>
  apiFetch<ManuscriptVersion & { content: JSONContent }>(`/projects/${projectId}/manuscript/versions/${versionNo}`);

export const FONT_FAMILIES = ["Arial", "Times New Roman", "Calibri", "Cambria", "Georgia", "Verdana", "Courier New"];
export const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 36];
export const DEFAULT_FONT = "Arial";
export const DEFAULT_SIZE = 11;
export const LINE_SPACINGS = ["1", "1.15", "1.5", "2"];
