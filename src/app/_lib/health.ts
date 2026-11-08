export type TimelineState = "done" | "waiting" | "problem" | "overdue" | "soon" | "upcoming";

// One dated thing in a group's capstone: an assignment's due date, a defense, or a milestone.
export type ApiTimelineEvent = {
  date: string | null;
  kind: "milestone" | "assignment" | "defense";
  title: string;
  detail: string | null;
  state: TimelineState;
};

// A group that is late, stuck or waiting too long, and why.
export type ApiRisk = {
  project_id: number;
  group_id: number;
  group_name: string;
  course: string;
  section: string;
  adviser: string | null;
  current_phase: string;
  severity: "high" | "medium";
  reasons: { code: string; text: string; severity: "high" | "medium" }[];
};
