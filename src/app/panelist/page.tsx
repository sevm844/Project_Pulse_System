import PanelistShell from "./_components/PanelistShell";
import Card from "./_components/Card";
import PanelistCalendar from "./_components/PanelistCalendar";
import { panelistDefenses, computeAverage } from "./_data/panelistData";

function statusClasses(status: string) {
  if (status === "Submitted" || status === "Available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function PanelistDashboardPage() {
  const assigned = panelistDefenses.length;
  const pending = panelistDefenses.filter(
    (item) => item.evaluationStatus === "Pending",
  ).length;
  const submitted = panelistDefenses.filter(
    (item) => item.evaluationStatus === "Submitted",
  ).length;

  return (
    <PanelistShell title="Panelist Overview">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-x-auto p-4">
            <div className="flex min-w-[640px] divide-x divide-[#edf2ec]">
              {[
                ["Assigned", assigned, "Defense assignments"],
                ["Pending", pending, "Need evaluation"],
                ["Submitted", submitted, "Completed forms"],
              ].map(([label, value, caption]) => (
                <div key={label} className="flex-1 px-4 py-2">
                  <p className="text-xs font-semibold text-[#7b877f]">
                    {label}
                  </p>
                  <div className="mt-1 flex items-end gap-2">
                    <p className="text-2xl font-semibold text-[#203028]">
                      {value}
                    </p>
                    <p className="pb-1 text-xs text-[#59645d]">{caption}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] bg-white px-5 py-4">
              <h2 className="text-lg font-semibold text-[#203028]">
                Assigned Defense Work
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Access documents and submit evaluation forms for assigned
                defenses.
              </p>
            </div>

            <div className="divide-y divide-[#edf2ec] bg-white">
              {panelistDefenses.map((defense) => (
                <div
                  key={defense.id}
                  className="grid gap-4 px-5 py-4 transition hover:bg-[#fbfdfb] lg:grid-cols-[1.2fr_1fr_auto] lg:items-center"
                >
                  <div>
                    <p className="text-sm font-semibold text-[#203028]">
                      {defense.groupName}
                    </p>
                    <p className="mt-1 text-sm text-[#59645d]">
                      {defense.projectTitle}
                    </p>
                    <p className="mt-1 text-xs text-[#7b877f]">
                      {defense.stage} • {defense.date} • {defense.time} •{" "}
                      {defense.venue}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                        defense.documentStatus,
                      )}`}
                    >
                      Document {defense.documentStatus}
                    </span>
                    <span
                      className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                        defense.evaluationStatus,
                      )}`}
                    >
                      {defense.evaluationStatus}
                    </span>
                    {defense.evaluationStatus === "Submitted" && (
                      <span className="rounded-full border border-[#dfe8df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#59645d]">
                        Avg {computeAverage(defense)}
                      </span>
                    )}
                  </div>

                  <div className="flex gap-2 lg:justify-end">
                    <a
                      href="/panelist/documents"
                      className="rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                    >
                      Documents
                    </a>
                    <a
                      href="/panelist/evaluations"
                      className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
                    >
                      Evaluate
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="min-w-0 self-start xl:sticky xl:top-6">
          <PanelistCalendar />
        </aside>
      </div>
    </PanelistShell>
  );
}
