"use client";

import type { CapstoneGroup } from "../_lib/firebase";

export const ADVISER_GROUPS_STORAGE_KEY = "project-pulse-adviser-created-groups";
export const GROUP_ASSIGNMENT_EVENT = "project-pulse-group-assignment-change";

function emitGroupAssignmentChange() {
  window.dispatchEvent(new Event(GROUP_ASSIGNMENT_EVENT));
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function getAdviserCreatedGroups() {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(ADVISER_GROUPS_STORAGE_KEY);
  return saved ? (JSON.parse(saved) as CapstoneGroup[]) : [];
}

export function saveAdviserCreatedGroup(group: CapstoneGroup) {
  const groups = getAdviserCreatedGroups();
  const nextGroups = [group, ...groups.filter((item) => item.id !== group.id)];

  window.localStorage.setItem(
    ADVISER_GROUPS_STORAGE_KEY,
    JSON.stringify(nextGroups),
  );
  emitGroupAssignmentChange();
}

export function findGroupInvitationForEmail(email: string | null) {
  if (!email) return null;

  const normalizedEmail = normalizeEmail(email);

  return (
    getAdviserCreatedGroups().find((group) =>
      group.members.some(
        (member) => normalizeEmail(member.email) === normalizedEmail,
      ),
    ) || null
  );
}

export function hasAcceptedGroupInvitation(groupId: string, email: string | null) {
  if (!email) return false;
  return Boolean(getAdviserCreatedGroups().find((group) => group.id === groupId)
    ?.members.find((member) => normalizeEmail(member.email) === normalizeEmail(email))?.acceptedAt);
}

export function isGroupConfirmed(group: CapstoneGroup) {
  return group.members.length > 0 && group.members.every((member) => Boolean(member.acceptedAt));
}

export function acceptGroupInvitation(groupId: string, email: string, uid?: string | null) {
  const group = getAdviserCreatedGroups().find((item) => item.id === groupId);
  if (!group || !group.members.some((member) => normalizeEmail(member.email) === normalizeEmail(email))) return null;
  const now = new Date().toISOString();
  const members = group.members.map((member) => normalizeEmail(member.email) === normalizeEmail(email)
    ? { ...member, uid: uid || member.uid, acceptedAt: member.acceptedAt || now }
    : member);
  const nextGroup = { ...group, members, updatedAt: now,
    leaderId: members.find((member) => member.role === "Group Leader")?.uid || group.leaderId,
    status: members.every((member) => member.acceptedAt) ? "Active" : "Pending Student Confirmation" };
  saveAdviserCreatedGroup(nextGroup);
  return nextGroup;
}

export function subscribeToGroupAssignments(onChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (!event.key || event.key === ADVISER_GROUPS_STORAGE_KEY) onChange();
  }
  window.addEventListener("storage", handleStorage);
  window.addEventListener(GROUP_ASSIGNMENT_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(GROUP_ASSIGNMENT_EVENT, onChange);
  };
}
