import { apiFetch } from "./api";

// The manuscript in Google Docs (only when the server switch MANUSCRIPT_EDITOR=google is on and the Google key is set).
export type GoogleManuscriptStatus = { enabled: boolean; doc_url: string | null; last_synced_at: string | null };
export type GoogleCheck = { enabled: boolean; key_present: boolean; service_email: string | null; folder_set: boolean; problems: string[] };

export const fetchGoogleManuscript = () => apiFetch<GoogleManuscriptStatus>("/my-manuscript/google");
export const openGoogleManuscript = () => apiFetch<{ doc_url: string }>("/my-manuscript/google/open", { method: "POST" });

export const fetchGoogleCheck = () => apiFetch<GoogleCheck>("/google-check");
export const testGoogleConnection = () => apiFetch<{ ok: boolean; message: string }>("/google-check/test", { method: "POST" });
