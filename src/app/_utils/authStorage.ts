import type { UserRole } from "../_lib/firebase";

export const AUTH_EMAIL_KEY = "project-pulse-user-email";
export const AUTH_ROLE_KEY = "project-pulse-user-role";
export const AUTH_UID_KEY = "project-pulse-user-uid";
export const AUTH_TOKEN_KEY = "project-pulse-api-token";

export function saveStoredUserSession(user: {
  uid: string;
  email: string;
  role: UserRole;
}) {
  localStorage.setItem(AUTH_UID_KEY, user.uid);
  localStorage.setItem(AUTH_EMAIL_KEY, user.email);
  localStorage.setItem(AUTH_ROLE_KEY, user.role);
}

export function saveStoredToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredUserSession() {
  localStorage.removeItem(AUTH_UID_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUserUid() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_UID_KEY);
}

export function getStoredUserEmail() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_EMAIL_KEY);
}

export function getStoredUserRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_ROLE_KEY) as UserRole | null;
}