"use client";

import type { CapstoneGroup } from "../_lib/firebase";

export const ADVISER_GROUPS_STORAGE_KEY = "project-pulse-adviser-created-groups";
export const GROUP_ASSIGNMENT_EVENT = "project-pulse-group-assignment-change";
const ACCEPTED_GROUP_IDS_KEY = "project-pulse-accepted-group-ids";

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

export function getAcceptedGroupIds() {
  if (typeof window === "undefined") return [];

  const saved = window.localStorage.getItem(ACCEPTED_GROUP_IDS_KEY);
  return saved ? (JSON.parse(saved) as string[]) : [];
}

export function hasAcceptedGroupInvitation(groupId: string) {
  return getAcceptedGroupIds().includes(groupId);
}

export function acceptGroupInvitation(groupId: string) {
  const acceptedIds = getAcceptedGroupIds();

  if (!acceptedIds.includes(groupId)) {
    window.localStorage.setItem(
      ACCEPTED_GROUP_IDS_KEY,
      JSON.stringify([...acceptedIds, groupId]),
    );
    emitGroupAssignmentChange();
  }
}
