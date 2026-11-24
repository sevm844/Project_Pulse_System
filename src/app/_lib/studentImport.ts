import { apiFetch } from "./api";

// Bulk import of the official enrolled-student list (an AppDev adviser or the Dean). Step 1 checks a file and saves nothing; step 2 creates the accounts.
export type ImportRow = {
  row: number;
  number: string;
  name: string;
  email: string | null;
  course: string | null;
  section: string | null;
  status: "create" | "update" | "skip" | "fail";
  reason: string | null;
  warnings: string[];
};

export type ImportPreview = {
  token: string;
  file_name: string;
  total: number;
  will_create: number;
  will_update: number;
  will_skip: number;
  will_fail: number;
  ignored_columns: string[];
  can_import: boolean;
  sample: ImportRow[];
  problems: ImportRow[];
};

export type ImportResult = { batch_id: number; created: number; updated: number; skipped: number; failed: number; invited: number; waiting_for_invitation: number };

export type ImportBatch = {
  batch_id: number;
  file_name: string;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  imported_by: string;
  created_at: string;
  undone: boolean;
  waiting_for_invitation: number;
};

export function previewStudentImport(file: File) {
  const body = new FormData();
  body.append("file", file);

  return apiFetch<ImportPreview>("/students/import/preview", { method: "POST", body });
}

export const confirmStudentImport = (token: string) => apiFetch<ImportResult>("/students/import", { method: "POST", body: JSON.stringify({ token }) });
export const sendImportInvitations = (batchId: number) => apiFetch<{ invited: number; failed: number; waiting_for_invitation: number }>(`/students/import/${batchId}/invite`, { method: "POST" });
export const undoStudentImport = (batchId: number) => apiFetch<{ removed: number; kept: number }>(`/students/import/${batchId}`, { method: "DELETE" });
export const fetchImportBatches = () => apiFetch<ImportBatch[]>("/students/import/batches");
