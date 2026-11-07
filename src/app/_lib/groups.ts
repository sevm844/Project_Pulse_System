import { ApiError, apiFetch } from "./api";

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
  created_at: string | null;
  adviser: { user_id: number; name: string } | null;
  project: {
    project_id: number;
    project_title: string | null;
    project_description: string | null;
    project_status: string | null;
    current_stage: string;
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
  title_status: "Pending" | "Approved" | "Rejected";
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
  stage: string;
  status: string | null;
};

export const NO_TITLE_YET = "No approved title yet";
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
export async function fetchMyGroup(): Promise<ApiGroup | null> {
  try {
    return await apiFetch<ApiGroup>("/my-group");
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) return null;
    throw err;
  }
}

export function errorMessage(err: unknown, fallback: string) {
  return err instanceof ApiError ? err.message : fallback;
}
