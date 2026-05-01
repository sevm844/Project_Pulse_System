import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { defenseOutcomes } from "../_data/mockDeanData";

export default function DeanDefensePage() {
  return (
    <DeanShell title="Defense Outcomes">
      <Card className="p-5">
        <h2 className="text-lg font-semibold text-[#203028]">
          Defense Monitoring
        </h2>
        <p className="mt-1 text-sm text-[#7b877f]">
          Monitor defense stages, outcomes, dates, and groups needing attention.
        </p>

        <div className="mt-5 space-y-3">
          {defenseOutcomes.map(([group, stage, outcome, date]) => (
            <div key={group} className="rounded-xl bg-[#f8faf7] p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#203028]">
                    {group}
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {stage} • {date}
                  </p>
                </div>
                <StatusBadge status={outcome} />
              </div>
            </div>
          ))}
        </div>
      </Card>
    </DeanShell>
  );
}
