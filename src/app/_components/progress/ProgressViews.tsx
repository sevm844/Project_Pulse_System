import Link from "next/link";
import { phasesDone, type ApiPhase, type ApiProgress, type PhaseState } from "../../_lib/progress";

const lineClass: Record<PhaseState, string> = {
  done: "border-[#4f8f58]",
  current: "border-[#123f2b]",
  problem: "border-rose-500",
  upcoming: "border-[#e2ebe1]",
};

const labelClass: Record<PhaseState, string> = {
  done: "text-[#4f8f58]",
  current: "font-semibold text-[#203028]",
  problem: "font-semibold text-rose-600",
  upcoming: "text-[#9aa59d]",
};

const stateWord: Record<PhaseState, string> = {
  done: "Done",
  current: "Now",
  problem: "Needs attention",
  upcoming: "Next",
};

// Details like "Not scheduled yet" on every upcoming step are just noise.
function showDetail(phase: ApiPhase) {
  return phase.state !== "upcoming" || !/^(Not scheduled|No final)/.test(phase.detail);
}

// The whole journey, one step per phase: Title Proposal, the five defenses, Final Output.
export function ProgressTracker({ progress }: { progress: ApiProgress }) {
  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
        <p className="text-sm text-[#59645d]">
          {progress.current_phase === "Completed" ? (
            <span className="font-semibold text-[#2f6f3a]">Every phase is complete.</span>
          ) : (
            <>
              Now at <span className="font-semibold text-[#203028]">{progress.current_phase}</span>
            </>
          )}
        </p>
        <p className="text-xs text-[#7b877f]">
          {phasesDone(progress)} of {progress.phases.length} phases done
          {progress.requirements.total > 0
            ? ` · ${progress.requirements.approved} of ${progress.requirements.total} requirements approved`
            : ""}
        </p>
      </div>

      <ol className="mt-4 grid gap-3 md:grid-cols-7 md:gap-2" aria-label="Capstone progress">
        {progress.phases.map((phase) => (
          <li
            key={phase.key}
            aria-current={phase.state === "current" ? "step" : undefined}
            className={`border-l-2 pl-3 md:border-l-0 md:border-t-2 md:pl-0 md:pt-3 ${lineClass[phase.state]}`}
          >
            <p className="text-[10px] font-semibold uppercase tracking-wide text-[#9aa59d]">{stateWord[phase.state]}</p>
            <p className={`mt-0.5 text-xs ${labelClass[phase.state]}`}>{phase.label}</p>
            {showDetail(phase) && <p className="mt-1 text-[11px] leading-4 text-[#7b877f]">{phase.detail}</p>}
          </li>
        ))}
      </ol>
    </div>
  );
}

// One line for lists: a thin bar and where the group is now.
export function ProgressMini({ progress }: { progress: ApiProgress }) {
  const problem = progress.phases.some((phase) => phase.state === "problem");

  return (
    <div className="flex items-center gap-3" title={`${phasesDone(progress)} of ${progress.phases.length} phases done`}>
      <div className="h-1 w-24 shrink-0 rounded-full bg-[#edf2ec]" role="presentation">
        <div
          className={`h-1 rounded-full ${problem ? "bg-rose-400" : "bg-[#4f8f58]"}`}
          style={{ width: `${Math.max(progress.percent, 3)}%` }}
        />
      </div>
      <span className={`truncate text-[11px] ${problem ? "text-rose-600" : "text-[#7b877f]"}`}>
        {progress.current_phase}
        {problem ? " · needs attention" : ""}
      </span>
    </div>
  );
}

// A short list of groups with their progress, for dashboards.
export function ProgressList({ items, href }: { items: ApiProgress[]; href: string }) {
  return (
    <ul className="divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec] bg-white">
      {items.map((item) => (
        <li key={item.project_id}>
          <Link href={href} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1.5 px-4 py-3.5 transition hover:bg-[#fbfdfb]">
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-[#203028]">{item.group_name}</span>
              <span className="mt-0.5 block text-xs text-[#7b877f]">
                {item.course} {item.section}
              </span>
            </span>
            <ProgressMini progress={item} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
