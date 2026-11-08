import type { UserRole } from "./types";
import { clearStoredUserSession, getStoredToken } from "../_utils/authStorage";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000/api";

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type ApiUser = {
  user_id: number;
  role_id: number;
  role: string;
  fname: string;
  lname: string;
  email: string;
  account_status: string;
  created_at: string | null;
};

export type ApiStudentApproval = {
  user_id: number;
  fname: string;
  lname: string;
  email: string;
  account_status: "Pending" | "Rejected" | "Active";
  created_at: string | null;
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

// The file an adviser attached to an assignment (a template or guide).
export async function downloadRequirementAttachment(requirementId: number, fileName: string | null) {
  saveBlob(await fetchPrivateFile(`/requirements/${requirementId}/attachment`), fileName);
}

// A temporary address for showing a submitted PDF or image in the browser. Call URL.revokeObjectURL when done.
export async function previewSubmission(submissionId: number, mimeType: string): Promise<string> {
  const blob = await fetchPrivateFile(`/submissions/${submissionId}/download`);

  // The type is set here (PDF or image only), so a file can never be shown as a web page.
  return URL.createObjectURL(new Blob([blob], { type: mimeType }));
}

// The database says "Research Coordinator"; the existing pages say "Coordinator".
export function toAppRole(roleName: string): UserRole {
  return (roleName === "Research Coordinator"
    ? "Coordinator"
    : roleName) as UserRole;
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