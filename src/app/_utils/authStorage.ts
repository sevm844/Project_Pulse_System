import type { UserRole } from "../_lib/types";

export const AUTH_EMAIL_KEY = "project-pulse-user-email";
export const AUTH_NAME_KEY = "project-pulse-user-name";
export const AUTH_ROLE_KEY = "project-pulse-user-role";
export const AUTH_ROLES_KEY = "project-pulse-user-roles";
export const AUTH_UID_KEY = "project-pulse-user-uid";
export const AUTH_TOKEN_KEY = "project-pulse-api-token";

export function saveStoredUserSession(user: {
  uid: string;
  email: string;
  role: UserRole;
  roles?: UserRole[];
  name?: string;
}) {
  localStorage.setItem(AUTH_UID_KEY, user.uid);
  localStorage.setItem(AUTH_EMAIL_KEY, user.email);
  localStorage.setItem(AUTH_ROLE_KEY, user.role);
  localStorage.setItem(AUTH_ROLES_KEY, JSON.stringify(user.roles ?? [user.role]));

  if (user.name) localStorage.setItem(AUTH_NAME_KEY, user.name);
}

export function saveStoredToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredUserSession() {
  localStorage.removeItem(AUTH_UID_KEY);
  localStorage.removeItem(AUTH_EMAIL_KEY);
  localStorage.removeItem(AUTH_NAME_KEY);
  localStorage.removeItem(AUTH_ROLE_KEY);
  localStorage.removeItem(AUTH_ROLES_KEY);
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

// Every role this person holds (usually just one). The first one that matches the active role is the view in use.
export function getStoredUserRoles(): UserRole[] {
  if (typeof window === "undefined") return [];

  try {
    const roles = JSON.parse(localStorage.getItem(AUTH_ROLES_KEY) ?? "[]");
    if (Array.isArray(roles) && roles.length > 0) return roles as UserRole[];
  } catch {
    // fall through to the single stored role
  }

  const role = getStoredUserRole();
  return role ? [role] : [];
}

export function getStoredUserName() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_NAME_KEY);
}

export function initialsOf(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "?"
  );
}
