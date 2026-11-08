import Link from "next/link";
import type { ApiRisk } from "../../_lib/health";

// Groups that are late, stuck or waiting too long, most serious first, each with its reasons.
export default function RiskList({
  items,
  href,
  showAdviser = false,
}: {
  items: ApiRisk[];
  href: (risk: ApiRisk) => string;
  showAdviser?: boolean;
}) {
  return (
    <ul className="divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec] bg-white">
      {items.map((risk) => (
        <li key={risk.project_id}>
          <Link href={href(risk)} className="block px-4 py-3.5 transition hover:bg-[#fbfdfb]">
            <span className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
              <span className="min-w-0">
                <span className="block truncate text-sm font-semibold text-[#203028]">{risk.group_name}</span>
                <span className="mt-0.5 block text-xs text-[#7b877f]">
                  {risk.course} {risk.section} · {risk.current_phase}
                  {showAdviser ? ` · ${risk.adviser ?? "No adviser"}` : ""}
                </span>
              </span>

              <span className="flex shrink-0 items-center gap-2 text-xs text-[#59645d]">
                <span className={`h-2 w-2 rounded-full ${risk.severity === "high" ? "bg-rose-500" : "bg-amber-400"}`} />
                {risk.severity === "high" ? "Needs action" : "Keep an eye on"}
              </span>
            </span>

            <ul className="mt-2 space-y-1">
              {risk.reasons.map((reason) => (
                <li key={reason.code} className="flex gap-2 text-xs leading-5 text-[#59645d]">
                  <span aria-hidden className={`mt-1.5 h-1 w-1 shrink-0 rounded-full ${reason.severity === "high" ? "bg-rose-400" : "bg-amber-400"}`} />
                  {reason.text}
                </li>
              ))}
            </ul>
          </Link>
        </li>
      ))}
    </ul>
  );
}
