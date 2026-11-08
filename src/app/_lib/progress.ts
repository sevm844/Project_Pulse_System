export type PhaseState = "done" | "current" | "upcoming" | "problem";

export type ApiPhase = {
  key: string;
  label: string;
  state: PhaseState;
  detail: string;
};

// Where one group stands in the whole capstone. Worked out by the backend from the title, defense,
// requirement and archive modules, so it always agrees with them.
export type ApiProgress = {
  project_id: number;
  group_id: number;
  group_name: string;
  group_status: "Active" | "Pending Closure" | "Closed";
  course: string;
  section: string;
  adviser: string | null;
  phases: ApiPhase[];
  current_phase: string;
  percent: number;
  requirements: { approved: number; total: number };
};

export function phasesDone(progress: ApiProgress) {
  return progress.phases.filter((phase) => phase.state === "done").length;
}
