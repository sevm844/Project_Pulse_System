import { ApiError, apiFetch } from "./api";
import type { ProposalStage } from "../_utils/projectWorkflow";

export type GroupStatus = "Active" | "Pending Closure" | "Closed";

export type ApiGroupMember = {
  member_id: number;
  user_id: number;
  name: string;
  role_in_group: string;
  joined_at: string | null;
  accepted_at: string | null;
};

export type ApiGroup = {
  group_id: number;
  group_code: string;
  group_name: string;
  course: string;
  section: string;
  school_year: string | null;
  semester: string | null;
  // 'Pending Closure' = every member left and the Adviser or Dean still has to confirm closing it.
  group_status: GroupStatus;
  created_at: string | null;
  adviser: { user_id: number; name: string } | null;
  project: {
    project_id: number;
    project_title: string | null;
    project_description: string | null;
    project_status: string | null;
    proposal_stage: ProposalStage;
    chosen_title_id: number | null;
    // The Dean's note when the group was sent back to the adviser; null once the adviser sends it again.
    dean_return: { note: string; returned_by: string | null; returned_at: string | null } | null;
    // The Dean's sign-off; null until the Dean has endorsed the approved titles.
    endorsement: {
      signed_by: string | null;
      signed_at: string | null;
      notes: string | null;
      titles: { title_id: number; proposed_title: string }[];
    } | null;
  } | null;
  members: ApiGroupMember[];
  // Only present on GET /my-group.
  my_membership?: {
    member_id: number;
    role_in_group: string;
    accepted_at: string | null;
  } | null;
};

export type ApiTitleSubmission = {
  title_id: number;
  project_id: number;
  proposed_title: string;
  project_description: string | null;
  technology_stack: string | null;
  title_status: "Pending" | "Approved" | "Needs Revision" | "Rejected";
  submitted_at: string | null;
  review_remarks: string | null;
  reviewed_by: { user_id: number; name: string } | null;
  reviewed_at: string | null;
};

// One row of GET /dean/projects.
export type ApiDeanProject = {
  project_id: number;
  group_id: number;
  group_name: string;
  course: string;
  section: string;
  adviser: string | null;
  title: string | null;
  stage: ProposalStage;
  group_status: GroupStatus;
  status: string | null;
};

export const NO_TITLE_YET = "No title chosen yet";
export const NO_ADVISER_YET = "Not assigned";
export const COURSE_OPTIONS = ["BSIT", "BSCS", "BSIS"];
export const SECTION_OPTIONS = ["4A", "4B", "4C"];

// A group is confirmed once every member has accepted the invitation.
export function isGroupConfirmed(group: ApiGroup) {
  return (
    group.members.length > 0 &&
    group.members.every((member) => Boolean(member.accepted_at))
  );
}

// The logged-in student's group, or null when they have not been added to one yet.
// (Older servers answered 404 for that case, so it is still treated as null.)
export async function fetchMyGroup(): Promise<ApiGroup | null> {
  try {
    return await apiFetch<ApiGroup | null>("/my-group");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

// ---- Module 2 actions. Each returns the updated group.
const post = (path: string, body?: unknown) =>
  apiFetch<ApiGroup>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });

// Adviser: Title Proposal -> Dean's Endorsement.
export const sendGroupToDean = (groupId: number) => post(`/groups/${groupId}/send-to-dean`);
// Dean: the sign-off moves the group to Client Consultation.
export const endorseGroup = (groupId: number, notes: string) => post(`/groups/${groupId}/endorse`, { notes });
// Dean: not satisfied yet. The group goes back to its adviser (Title Proposal) with a required note.
export const returnGroupToAdviser = (groupId: number, note: string) => post(`/groups/${groupId}/return-to-adviser`, { note });
// Adviser: Client Consultation -> Ready for Proposal Defense, with the one title the group will defend.
export const chooseGroupTitle = (groupId: number, titleId: number) => post(`/groups/${groupId}/choose-title`, { title_id: titleId });

export const REMOVAL_REASONS = ["Shifting courses", "Transferring schools", "Financial hardship", "Other"] as const;
export type RemovalReason = (typeof REMOVAL_REASONS)[number];

export const leaveGroup = (groupId: number, reason: string) =>
  apiFetch<{ message: string }>(`/groups/${groupId}/leave`, { method: "POST", body: JSON.stringify({ reason: reason || undefined }) });

export const removeGroupMember = (groupId: number, userId: number, reasonCategory: RemovalReason, reason: string, exception = false) =>
  post(`/groups/${groupId}/members/${userId}/${exception ? "exception-remove" : "remove"}`, { reason_category: reasonCategory, reason: reason || undefined });

export const setGroupLeader = (groupId: number, userId: number) =>
  apiFetch<ApiGroup>(`/groups/${groupId}/leader`, { method: "PUT", body: JSON.stringify({ user_id: userId }) });

export const closeGroup = (groupId: number) => post(`/groups/${groupId}/close`);

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}
