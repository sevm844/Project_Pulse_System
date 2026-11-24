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

export type MonitoringScan = { scan_id: number; file_name: string; mime_type: string; file_size: number; submitted_by: string; submitted_at: string };
export type MonitoringSlot = { defense_type: "Alpha" | "Beta" | "Omega"; scans: MonitoringScan[] };

export const fetchAvailableAdvisers = () => apiFetch<NamedAdviser[]>("/advisers/available");
export const fetchGroupAdvisers = (projectId: number) => apiFetch<GroupAdvisers>(`/projects/${projectId}/advisers`);
export const fetchAdvising = () => apiFetch<Advising>("/advising");

export const setGroupAdvisers = (projectId: number, capstoneId: number, technicalId: number) =>
  apiFetch<GroupAdvisers>(`/projects/${projectId}/advisers`, {
    method: "PUT",
    body: JSON.stringify({ capstone_adviser_id: capstoneId, technical_adviser_id: technicalId }),
  });

export const fetchMonitoringForms = (projectId: number) => apiFetch<MonitoringSlot[]>(`/projects/${projectId}/monitoring-forms`);

export function uploadMonitoringForm(type: string, file: File) {
  const body = new FormData();
  body.append("file", file);

  return apiFetch<{ scan_id: number }>(`/my-monitoring-forms/${type}`, { method: "POST", body });
}

// A student tells the group's Capstone and Technical advisers to read the latest submitted version and comment on it.
export const shareManuscriptWithAdvisers = () => apiFetch<{ shared: boolean; version_no: number; advisers: number }>("/my-manuscript/share-advisers", { method: "POST" });
