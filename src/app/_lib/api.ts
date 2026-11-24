import type { UserRole } from "./types";
import { clearStoredUserSession, getStoredToken } from "../_utils/authStorage";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export class ApiError extends Error {
  status: number;
  // The server's whole answer, for the few screens that need more than the message (the schedule sheet reads row_errors).
  data: unknown;

  constructor(message: string, status: number, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

export type ApiUser = {
  user_id: number;
  role_id: number;
  role: string;
  roles: string[];
  extra_role_ids: number[];
  fname: string;
  lname: string;
  email: string;
  account_status: string;
  created_at: string | null;
  // Only in the paged list: has this person ever signed in? (An account that never did, and has no records, can be deleted.)
  has_activity?: boolean;
};

// One page of the Dean's user list.
export type ApiUserPage = {
  items: ApiUser[];
  total: number;
  page: number;
  last_page: number;
  per_page: number;
  inactive_total: number;
};

export type ApiRole = {
  role_id: number;
  role_name: string;
  role_description: string | null;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  // A FormData body (file upload) needs the browser to set its own multipart Content-Type.
  if (options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getStoredToken();
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Please check that the backend is running.",
      0,
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    // Expired or revoked login: clear the session and go back to the login page.
    if (
      response.status === 401 &&
      token &&
      path !== "/login" &&
      typeof window !== "undefined"
    ) {
      clearStoredUserSession();
      window.location.href = "/login";
    }

    if (response.status === 429) {
      throw new ApiError(
        "Too many attempts. Please wait a minute and try again.",
        429,
      );
    }

    const firstFieldError = data?.errors
      ? (Object.values(data.errors as Record<string, string[]>)[0]?.[0] ??
        undefined)
      : undefined;

    throw new ApiError(
      firstFieldError ?? data?.message ?? "Something went wrong.",
      response.status,
      data,
    );
  }

  return data as T;
}

// Files are private: they are fetched with the login token, then saved or shown from memory.
async function fetchPrivateFile(path: string): Promise<Blob> {
  const token = getStoredToken();
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
  } catch {
    throw new ApiError(
      "Cannot reach the server. Please check that the backend is running.",
      0,
    );
  }

  if (!response.ok) {
    throw new ApiError(
      "This file is not available or you do not have access to it.",
      response.status,
    );
  }

  return response.blob();
}

function saveBlob(blob: Blob, fileName: string | null) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName || "file";
  link.click();

  URL.revokeObjectURL(url);
}

export async function downloadSubmission(
  submissionId: number,
  fileName: string | null,
  version?: number,
) {
  const path =
    version === undefined
      ? `/submissions/${submissionId}/download`
      : `/submissions/${submissionId}/versions/${version}/download`;

  saveBlob(await fetchPrivateFile(path), fileName);
}

// Every current file of a group's submissions in one ZIP (the server checks each file with the same rule as a single download).
export async function downloadProjectDocuments(projectId: number, groupName: string) {
  saveBlob(await fetchPrivateFile(`/projects/${projectId}/documents.zip`), `${groupName} - documents.zip`);
}

// A template or guide file attached to an assignment (up to 3 per assignment).
export async function downloadRequirementAttachment(requirementId: number, attachmentId: number, fileName: string | null) {
  saveBlob(await fetchPrivateFile(`/requirements/${requirementId}/attachment/${attachmentId}`), fileName);
}

// A form from the Forms shelf (Requirements page).
export async function downloadSharedForm(formId: number, fileName: string | null) {
  saveBlob(await fetchPrivateFile(`/forms/${formId}/file`), fileName);
}

// A temporary address for showing a submitted file in the browser. Call URL.revokeObjectURL when done.
export async function previewSubmission(submissionId: number, mimeType: string, version?: number): Promise<string> {
  const blob = await fetchPrivateFile(
    version === undefined ? `/submissions/${submissionId}/download` : `/submissions/${submissionId}/versions/${version}/download`,
  );

  // The type is set here (PDF or image only), so a file can never be shown as a web page.
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
}

// The kinds of file a browser tab can show by itself (the type is forced here, so a submitted file can never be shown as a web page).
const TAB_TYPES: Record<string, string> = { pdf: "application/pdf", png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };
export const DOCX_TYPE = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// A submitted file opens in a NEW TAB, never in the download list: a PDF or picture straight in the tab, a Word (.docx) file in the website's own
// reading page (/view/submission/...). Only kinds a browser cannot show at all (older .doc, PowerPoint, ZIP) are saved to the computer.
// The tab is opened first, while the click is still fresh, or the browser blocks it as a pop-up.
export async function openSubmissionInTab(submissionId: number, fileName: string | null, version?: number) {
  const extension = (fileName ?? "").split(".").pop()?.toLowerCase() ?? "";
  const type = TAB_TYPES[extension];

  if (extension === "docx") {
    const query = new URLSearchParams({ name: fileName ?? "document.docx" });
    if (version !== undefined) query.set("v", String(version));

    if (!window.open(`/view/submission/${submissionId}?${query}`, "_blank")) await downloadSubmission(submissionId, fileName, version);
    return;
  }

  if (!type) {
    await downloadSubmission(submissionId, fileName, version);
    return;
  }

  const tab = window.open("", "_blank");

  try {
    const url = await previewSubmission(submissionId, type, version);
    if (tab) tab.location.href = url;
    else await downloadSubmission(submissionId, fileName, version);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

// The Dean's similarity report (a PDF): saved to the computer, or opened in the browser (the type is forced to PDF, never a web page).
export async function downloadSimilarityReport(reportId: number, fileName: string | null) {
  saveBlob(await fetchPrivateFile(`/similarity-reports/${reportId}/file`), fileName);
}

export async function previewSimilarityReport(reportId: number): Promise<string> {
  const blob = await fetchPrivateFile(`/similarity-reports/${reportId}/file`);

  return URL.createObjectURL(new Blob([blob], { type: "application/pdf" }));
}

// The database says "Dean's Secretary"; the website's own key for that role is "Secretary" (it also names its folder and addresses).
export function toAppRole(roleName: string): UserRole {
  return (roleName === "Dean's Secretary"
    ? "Secretary"
    : roleName) as UserRole;
}

// The other way round: the name the server uses for a role.
export function toServerRole(role: UserRole): string {
  return role === "Secretary" ? "Dean's Secretary" : role;
}

// Revokes the token on the server, then clears the saved session in the browser.
export async function logoutFromApi() {
  try {
    await apiFetch("/logout", { method: "POST" });
  } catch {
    // The token may already be gone; the browser session is cleared either way.
  }

  clearStoredUserSession();
}
// A form from the Forms shelf, read into memory (to show it, or to copy a Word form into a group's own document).
export async function fetchSharedFormBlob(formId: number): Promise<Blob> {
  return fetchPrivateFile(`/forms/${formId}/file`);
}

// A temporary address for showing a form in the browser. The type is set here, so a file can never be shown as a web page. Call URL.revokeObjectURL when done.
export async function previewSharedForm(formId: number, mimeType: string): Promise<string> {
  return URL.createObjectURL(new Blob([await fetchPrivateFile(`/forms/${formId}/file`)], { type: mimeType }));
}

// A scanned Capstone Monitoring Form opens in a NEW TAB (a PDF or a picture; the type is forced from the file name, never a web page).
export async function openMonitoringForm(scanId: number, fileName: string | null) {
  const type = TAB_TYPES[(fileName ?? "").split(".").pop()?.toLowerCase() ?? ""] ?? "application/pdf";
  const tab = window.open("", "_blank");

  try {
    const url = URL.createObjectURL(new Blob([await fetchPrivateFile(`/monitoring-forms/${scanId}/file`)], { type }));
    if (tab) tab.location.href = url;
    else saveBlob(await fetchPrivateFile(`/monitoring-forms/${scanId}/file`), fileName);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

// The exact PDF a version frozen from Google Docs keeps: opened in a NEW TAB (the type is forced to PDF, never a web page).
export async function openVersionPdf(projectId: number, versionNo: number) {
  const tab = window.open("", "_blank");

  try {
    const url = URL.createObjectURL(new Blob([await fetchPrivateFile(`/projects/${projectId}/manuscript/versions/${versionNo}/pdf`)], { type: "application/pdf" }));
    if (tab) tab.location.href = url;
    else saveBlob(await fetchPrivateFile(`/projects/${projectId}/manuscript/versions/${versionNo}/pdf`), `manuscript-version-${versionNo}.pdf`);
  } catch (err) {
    tab?.close();
    throw err;
  }
}

// A POST that answers with a file (the Google Doc as a Word file), read into memory.
export async function postForBlob(path: string): Promise<Blob> {
  const token = getStoredToken();
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}`, Accept: "*/*" } : { Accept: "*/*" } });
  } catch {
    throw new ApiError("Cannot reach the server. Please check that the backend is running.", 0);
  }

  if (!response.ok) {
    let message = "Something went wrong.";
    try {
      message = (await response.json())?.message ?? message;
    } catch {
      // the answer was not JSON
    }
    throw new ApiError(message, response.status);
  }

  return response.blob();
}
