import type { UserRole } from "../_lib/firebase";
import {
  getStoredUserEmail,
  getStoredUserRole,
  getStoredUserUid,
} from "./authStorage";

export type AuditAction =
  | "Login"
  | "Logout"
  | "Register"
  | "Approve"
  | "Reject"
  | "Update"
  | "Validate"
  | "Verify"
  | "Submit"
  | "View"
  | "Security Check";

export type AuditLog = {
  id: number;
  userId: string;
  userEmail: string;
  role: UserRole | "System";
  action: AuditAction;
  module: string;
  details: string;
  createdAt: string;
};

const AUDIT_LOG_STORAGE_KEY = "project-pulse-audit-logs";

const defaultAuditLogs: AuditLog[] = [
  {
    id: 1,
    userId: "system",
    userEmail: "system@project-pulse.local",
    role: "System",
    action: "Security Check",
    module: "Authentication",
    details: "Firebase Authentication is enabled for secure login.",
    createdAt: "2026-05-10T08:00:00.000Z",
  },
  {
    id: 2,
    userId: "admin-demo",
    userEmail: "admin@ub.edu.ph",
    role: "Admin",
    action: "Update",
    module: "User Management",
    details: "Admin updated user role and account status.",
    createdAt: "2026-05-10T08:30:00.000Z",
  },
  {
    id: 3,
    userId: "records-demo",
    userEmail: "records@ub.edu.ph",
    role: "Records Staff",
    action: "Validate",
    module: "Final Records Validation",
    details: "Records staff validated final requirements.",
    createdAt: "2026-05-10T09:00:00.000Z",
  },
  {
    id: 4,
    userId: "dean-demo",
    userEmail: "dean@ub.edu.ph",
    role: "Dean",
    action: "Approve",
    module: "Final Approval",
    details: "Dean approved final completion.",
    createdAt: "2026-05-10T09:30:00.000Z",
  },
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function sortAuditLogs(logs: AuditLog[]) {
  return [...logs].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );
}

export function getStoredAuditLogs() {
  if (!canUseStorage()) return defaultAuditLogs;

  const saved = window.localStorage.getItem(AUDIT_LOG_STORAGE_KEY);

  if (!saved) {
    saveStoredAuditLogs(defaultAuditLogs);
    return defaultAuditLogs;
  }

  return sortAuditLogs(JSON.parse(saved) as AuditLog[]);
}

export function saveStoredAuditLogs(logs: AuditLog[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    AUDIT_LOG_STORAGE_KEY,
    JSON.stringify(sortAuditLogs(logs)),
  );
}

export function addAuditLog(log: Omit<AuditLog, "id" | "createdAt">) {
  const logs = getStoredAuditLogs();

  const nextLog: AuditLog = {
    ...log,
    id: Date.now(),
    createdAt: new Date().toISOString(),
  };

  saveStoredAuditLogs([nextLog, ...logs]);

  return nextLog;
}

export function addCurrentUserAuditLog(input: {
  action: AuditAction;
  module: string;
  details: string;
}) {
  return addAuditLog({
    userId: getStoredUserUid() || "unknown-user",
    userEmail: getStoredUserEmail() || "unknown@email",
    role: getStoredUserRole() || "System",
    action: input.action,
    module: input.module,
    details: input.details,
  });
}

export function clearAuditLogs() {
  saveStoredAuditLogs([]);
  return [];
}
