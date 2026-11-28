import { apiFetch } from "./api";

// After the Proposal Defense the AppDev adviser names a Capstone adviser and a Technical adviser for each group.
export type NamedAdviser = { user_id: number; name: string };
export type GroupAdvisers = { capstone: NamedAdviser | null; technical: NamedAdviser | null; proposal_passed: boolean };

export type AdvisingRow = {
  project_id: number;
  group_id: number;
  group_name: string;
  course: string;
  section: string;
  project_title: string | null;
  capstone_adviser: string | null;
  technical_adviser: string | null;
  handed_off_at?: string | null;
  my_roles?: string[];
};
export type Advising = { waiting: AdvisingRow[]; handed_off: AdvisingRow[]; advising: AdvisingRow[] };

// The Capstone Monitoring Form: ONE form per group (cover + a row for each of the Alpha, Beta and Omega defenses). The Dean's signature is the only source of Passed.
export type MonitoringSignature = { name: string | null; role?: string | null; image?: string | null; signed_at: string };
export type MonitoringRow = {
  defense_type: "Alpha" | "Beta" | "Omega";
  defense_id: number | null;
  defense_date: string | null;
  defense_time: string | null;
  together_with_omega: boolean;
  milestones: string | null;
  adviser_signature: MonitoringSignature | null;
  adviser_deadline: string | null;
  dean_signature: MonitoringSignature | null;
  state: "not_scheduled" | "pending" | "passed" | "failed";
  dean_na: boolean;
  students_may_edit: boolean;
  adviser_may_approve: boolean;
  dean_may_decide: boolean;
};
export type MonitoringFormData = {
  project_id: number;
  // The cover is typed by the students (null = not written yet).
  team_name: string | null;
  members: string | null;
  project_title: string | null;
  academic_year: string;
  rules: string[];
  rows: MonitoringRow[];
};

export const fetchAvailableAdvisers = () => apiFetch<NamedAdviser[]>("/advisers/available");
export const fetchGroupAdvisers = (projectId: number) => apiFetch<GroupAdvisers>(`/projects/${projectId}/advisers`);
export const fetchAdvising = () => apiFetch<Advising>("/advising");

export const setGroupAdvisers = (projectId: number, capstoneId: number, technicalId: number) =>
  apiFetch<GroupAdvisers>(`/projects/${projectId}/advisers`, {
    method: "PUT",
    body: JSON.stringify({ capstone_adviser_id: capstoneId, technical_adviser_id: technicalId }),
  });

export const fetchMonitoringForm = (projectId: number) => apiFetch<MonitoringFormData>(`/projects/${projectId}/monitoring-form`);

export type MonitoringDraft = { team_name: string; members: string; project_title: string; milestones: Record<string, string> };

// One Save for the whole form. What was saved once cannot be changed again.
export const saveMonitoringForm = (draft: MonitoringDraft) => apiFetch<MonitoringFormData>("/my-monitoring-form", { method: "PUT", body: JSON.stringify(draft) });

export const approveMonitoringRow = (projectId: number, type: string) =>
  apiFetch<MonitoringFormData>(`/projects/${projectId}/monitoring-forms/${type}/adviser-approval`, { method: "POST" });

export const signMonitoringRow = (projectId: number, type: string, passed: boolean) =>
  apiFetch<MonitoringFormData>(`/projects/${projectId}/monitoring-forms/${type}/dean-signature`, { method: "PUT", body: JSON.stringify({ passed }) });

// A student tells the group's Capstone and Technical advisers to read the latest submitted version and comment on it.
export const shareManuscriptWithAdvisers = () => apiFetch<{ shared: boolean; version_no: number; advisers: number }>("/my-manuscript/share-advisers", { method: "POST" });
