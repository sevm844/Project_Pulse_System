"use client";

export const STUDENT_GROUP_STORAGE_KEY = "project-pulse-student-group";

const STUDENT_GROUP_STORAGE_EVENT = "project-pulse-student-group-change";

export function getStoredStudentGroup() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(STUDENT_GROUP_STORAGE_KEY);
}

export function hasStoredStudentGroup() {
  return Boolean(getStoredStudentGroup());
}

export function subscribeToStudentGroupStorage(onStoreChange: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

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

export function saveStoredStudentGroup(groupData: unknown) {
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
