"use client";

import type { CapstoneGroup } from "../../_lib/firebase";

export const STUDENT_GROUP_STORAGE_KEY = "project-pulse-student-group";
const STUDENT_SETUP_ACKNOWLEDGED_KEY =
  "project-pulse-student-setup-acknowledged";

const STUDENT_GROUP_STORAGE_EVENT = "project-pulse-student-group-change";

function getStudentScopedKey(email?: string | null) {
  const normalizedEmail = email?.trim().toLowerCase();

  return normalizedEmail
    ? `${STUDENT_SETUP_ACKNOWLEDGED_KEY}:${normalizedEmail}`
    : STUDENT_SETUP_ACKNOWLEDGED_KEY;
}

export function getStoredStudentGroup() {
  if (typeof window === "undefined") return null;

  const saved = window.localStorage.getItem(STUDENT_GROUP_STORAGE_KEY);
  return saved ? (JSON.parse(saved) as CapstoneGroup) : null;
}

export function hasStoredStudentGroup() {
  return Boolean(getStoredStudentGroup());
}

export function hasAcknowledgedStudentSetup(email?: string | null) {
  if (typeof window === "undefined") return false;

  return window.localStorage.getItem(getStudentScopedKey(email)) === "true";
}

export function acknowledgeStudentSetup(email?: string | null) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(getStudentScopedKey(email), "true");
}

export function subscribeToStudentGroupStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};

  function handleStorage(event: StorageEvent) {
    if (!event.key || event.key === STUDENT_GROUP_STORAGE_KEY) {
      onStoreChange();
    }
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(STUDENT_GROUP_STORAGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(STUDENT_GROUP_STORAGE_EVENT, onStoreChange);
  };
}

export function saveStoredStudentGroup(groupData: CapstoneGroup) {
  window.localStorage.setItem(
    STUDENT_GROUP_STORAGE_KEY,
    JSON.stringify(groupData),
  );
  window.dispatchEvent(new Event(STUDENT_GROUP_STORAGE_EVENT));
}

export function clearStoredStudentGroup() {
  window.localStorage.removeItem(STUDENT_GROUP_STORAGE_KEY);
  window.dispatchEvent(new Event(STUDENT_GROUP_STORAGE_EVENT));
}
