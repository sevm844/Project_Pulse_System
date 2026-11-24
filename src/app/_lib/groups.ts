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
  // Why a closed group was closed; null while it is open.
  closed_reason: string | null;
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
  // The proposal as written in the text editor (the editor's JSON); null on proposals sent before the editor existed.
  proposal_content: Record<string, unknown> | null;
  title_status: "Pending" | "Approved" | "Needs Revision" | "Rejected";
  submitted_at: string | null;
  // The student who sent it; null on proposals sent before this was recorded.
  submitted_by: { user_id: number; name: string } | null;
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
  school_year: string | null;
  semester: string | null;
  adviser: string | null;
  title: string | null;
  stage: ProposalStage;
  group_status: GroupStatus;
  status: string | null;
};

export const NO_TITLE_YET = "No title chosen yet";
export const NO_ADVISER_YET = "Not assigned";
// Every course of the department (the same list is checked on the server in GroupController::COURSES).
export const COURSE_OPTIONS = ["BSCS", "BSIS", "BSIT", "BLIS", "ACT"];

// What each course leads to (the same names the server prints on the title page, letter and certificate).
export const COURSE_NAMES: Record<string, string> = {
  BSCS: "Bachelor of Science in Computer Science",
  BSIS: "Bachelor of Science in Information Systems",
  BSIT: "Bachelor of Science in Information Technology",
  BLIS: "Bachelor of Library and Information Science",
  ACT: "Associate in Computer Technology",
};
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

// Adviser: Title Proposal -> Client Consultation (the Dean has no step: he signs on paper when the group meets him).
export const startConsultation = (groupId: number) => post(`/groups/${groupId}/start-consultation`);
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

// Why the Dean closes a group that still has members (the same list the server accepts).
export const CLOSE_REASONS = ["Failed and will retake", "Stopped the project", "Group disbanded", "Other"] as const;
export type CloseReason = (typeof CLOSE_REASONS)[number];

// A group with no members left is confirmed closed by its adviser or the Dean (no reason needed). Only the Dean can close a
// group that still has members, and then a reason is required.
export const closeGroup = (groupId: number, reasonCategory?: CloseReason, reason?: string) =>
  post(`/groups/${groupId}/close`, reasonCategory ? { reason_category: reasonCategory, reason: reason || undefined } : undefined);

// Dean only: undo a close. Needs a reason; the students and adviser are told. Defenses cancelled by the close stay cancelled.
export const reopenGroup = (groupId: number, reason: string) => post(`/groups/${groupId}/reopen`, { reason });

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}

// The letter for interview is a form on the Forms shelf. The adviser only reminds the group to do it.
export function remindGroupAboutLetter(groupId: number) {
  return apiFetch<{ reminded: boolean; students: number }>(`/groups/${groupId}/letter-reminder`, { method: "POST" });
}
