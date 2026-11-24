import { Editor, type JSONContent } from "@tiptap/react";
import { createManuscriptExtensions } from "../_components/manuscript/extensions";
import { apiFetch, postForBlob } from "./api";
import { fetchMyManuscript, saveManuscriptDraft, submitManuscriptVersion, type ManuscriptVersion } from "./manuscript";
import { importWordFile } from "./manuscriptImport";

// The manuscript in Google Docs (only when the server switch MANUSCRIPT_EDITOR=google is on and the Google key is set).
export type GoogleManuscriptStatus = { enabled: boolean; doc_url: string | null; last_synced_at: string | null };
export type GoogleCheck = { enabled: boolean; key_present: boolean; service_email: string | null; folder_set: boolean; problems: string[] };

export const fetchGoogleManuscript = () => apiFetch<GoogleManuscriptStatus>("/my-manuscript/google");
export const openGoogleManuscript = () => apiFetch<{ doc_url: string }>("/my-manuscript/google/open", { method: "POST" });

export const fetchGoogleCheck = () => apiFetch<GoogleCheck>("/google-check");
export const testGoogleConnection = () => apiFetch<{ ok: boolean; message: string }>("/google-check/test", { method: "POST" });

// ---- Submit version from Google Docs: the Google Doc is fetched as a Word file (through our server), turned into the editor's text in the browser, and frozen
// with the same draft + Submit version routes the system's own editor uses, so review, comments, compare and sharing with advisers work unchanged.
const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// The editor's own rules decide what is kept (the same as when a Word file is imported in the editor). Built off-screen, without the page-drawing plugin.
function htmlToEditorJson(html: string): JSONContent {
  const editor = new Editor({
    element: document.createElement("div"),
    extensions: createManuscriptExtensions().filter((extension) => extension.name !== "pagination"),
    content: html,
  });
  const json = editor.getJSON();
  editor.destroy();

  return json;
}

export type GoogleSubmitResult = { version: ManuscriptVersion; skippedPictures: number; hasPdf: boolean };

export async function submitVersionFromGoogle(note: string): Promise<GoogleSubmitResult> {
  const blob = await postForBlob("/my-manuscript/google/export");
  const imported = await importWordFile(new File([blob], "manuscript.docx", { type: DOCX_TYPE }));

  if (imported.empty) throw new Error("The Google Doc is empty. Write something in it before submitting a version.");

  const current = await fetchMyManuscript();
  const saved = await saveManuscriptDraft(htmlToEditorJson(imported.html), current.draft_revision);
  const version = await submitManuscriptVersion(saved.draft_revision, note);
  const attached = await apiFetch<{ attached: boolean }>("/my-manuscript/google/attach-pdf", { method: "POST", body: JSON.stringify({ version_no: version.version_no }) }).catch(() => ({ attached: false }));

  return { version, skippedPictures: imported.skippedPictures, hasPdf: attached.attached };
}
