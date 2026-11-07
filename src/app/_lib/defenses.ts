export const DEFENSE_TYPES = [
  "Proposal Defense",
  "Alpha Defense",
  "Beta Defense",
  "Omega Defense",
  "Final Defense",
] as const;

export const DEFENSE_RESULTS = ["Passed", "Passed with Revisions", "Failed"] as const;
export const DEFENSE_RECOMMENDATIONS = ["Pass", "Pass with Revisions", "Fail"] as const;

export type DefenseStatus = "Scheduled" | "Completed" | "Cancelled";

export type ApiPanelMember = {
  panelist_id: number;
  name: string | null;
  role: "Chair" | "Member";
  // Hidden from students.
  evaluated: boolean | null;
};

export type ApiEvaluation = {
  panelist_id: number;
  name: string | null;
  score: number | null;
  recommendation: (typeof DEFENSE_RECOMMENDATIONS)[number] | null;
  remarks: string | null;
  evaluated_at: string | null;
};

export type ApiDefense = {
  defense_id: number;
  project_id: number;
  group_name: string;
  course: string;
  section: string;
  adviser: string | null;
  project_title: string | null;
  defense_type: string;
  defense_date: string | null;
  defense_time: string | null;
  venue: string | null;
  status: DefenseStatus;
  result: (typeof DEFENSE_RESULTS)[number] | null;
  remarks: string | null;
  panel: ApiPanelMember[];
  // Dean and Adviser only.
  average_score?: number | null;
  evaluations?: ApiEvaluation[];
  // Panelist only.
  my_evaluation?: ApiEvaluation | null;
};

export type ApiPanelist = {
  user_id: number;
  name: string;
  email: string;
};

export type ApiDefenseDocument = {
  submission_id: number;
  title: string;
  stage: string;
  version_no: number;
  file_name: string | null;
  has_file: boolean;
  link_url: string | null;
};

export const resultDot: Record<string, string> = {
  Passed: "bg-emerald-500",
  "Passed with Revisions": "bg-amber-400",
  Failed: "bg-rose-500",
};

export function todayInManila() {
  return new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

export function formatTime(value: string | null) {
  if (!value) return "";

  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "PM" : "AM";

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

// What a defense shows as its state: the result once recorded, otherwise its status.
export function defenseState(defense: ApiDefense) {
  if (defense.status === "Completed" && defense.result) {
    return { label: defense.result, dot: resultDot[defense.result] ?? "bg-[#c5cdc7]" };
  }

  if (defense.status === "Cancelled") return { label: "Cancelled", dot: "bg-[#c5cdc7]" };

  return { label: "Scheduled", dot: "bg-amber-400" };
}
