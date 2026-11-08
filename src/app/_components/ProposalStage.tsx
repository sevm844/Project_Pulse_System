import type { GroupStatus } from "../_lib/groups";
import { PROPOSAL_STAGES, type ProposalStage } from "../_utils/projectWorkflow";

// Compact label for lists and tables.
export function StageBadge({ stage }: { stage: ProposalStage | string }) {
  const done = stage === PROPOSAL_STAGES[PROPOSAL_STAGES.length - 1];

  return (
    <span
      className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        done ? "bg-emerald-50 text-emerald-700" : "bg-[#edf9e9] text-[#2f6b3c]"
      }`}
    >
      {stage}
    </span>
  );
}

// The four Module 2 stages as a progress bar. Finished stages are filled, the current one is highlighted.
export function StageSteps({ stage }: { stage: ProposalStage }) {
  const current = PROPOSAL_STAGES.indexOf(stage);

  return (
    <ol className="grid gap-2 sm:grid-cols-4" aria-label="Proposal stages">
      {PROPOSAL_STAGES.map((name, index) => {
        const state = index < current ? "done" : index === current ? "current" : "todo";

        return (
          <li
            key={name}
            aria-current={state === "current" ? "step" : undefined}
            className={`rounded-lg border px-3 py-2 text-xs ${
              state === "current"
                ? "border-[#123f2b] bg-[#d7f7d8] font-semibold text-[#203028]"
                : state === "done"
                  ? "border-[#cfe6d0] bg-[#f2fbef] text-[#4f8f58]"
                  : "border-[#e2ebe1] bg-white text-[#9aa59d]"
            }`}
          >
            <span className="block text-[10px] uppercase tracking-wide">
              {state === "done" ? "Done" : `Step ${index + 1}`}
            </span>
            {name}
          </li>
        );
      })}
    </ol>
  );
}

export const titleStatusClass: Record<"Pending" | "Approved" | "Needs Revision" | "Rejected", string> = {
  Pending: "bg-amber-50 text-amber-700",
  Approved: "bg-emerald-50 text-emerald-700",
  "Needs Revision": "bg-sky-50 text-sky-700",
  Rejected: "bg-rose-50 text-rose-700",
};

// Shown next to the stage when a group is no longer a normal active one.
export function GroupStatusNote({ status }: { status: GroupStatus }) {
  if (status === "Active") return null;

  return (
    <span className="ml-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
      {status}
    </span>
  );
}
