import type { UserRole } from "./firebase";
import { getStoredToken } from "../_utils/authStorage";

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

  if (options.body) {
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

// The database says "Research Coordinator"; the existing pages say "Coordinator".
export function toAppRole(roleName: string): UserRole {
  return (roleName === "Research Coordinator"
    ? "Coordinator"
    : roleName) as UserRole;
}