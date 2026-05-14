import CoordinatorShell from "../_components/CoordinatorShell";
import Card from "../_components/Card";
import {
  finalRequirements,
  groupFolders,
  getRequirementCounts,
} from "../_data/finalRecordsData";

function statusClasses(status: string) {
  if (status === "Checked") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "Submitted") return "border-blue-200 bg-blue-50 text-blue-700";
  if (status === "Returned") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function CoordinatorRequirementsPage() {
  const totals = groupFolders.reduce(
    (summary, folder) => {
      const counts = getRequirementCounts(folder);

      return {
        checked: summary.checked + counts.checked,
        submitted: summary.submitted + counts.submitted,
        missing: summary.missing + counts.missing,
        returned: summary.returned + counts.returned,
        total: summary.total + counts.total,
      };
    },
    { checked: 0, submitted: 0, missing: 0, returned: 0, total: 0 },
  );

  return (
    <CoordinatorShell title="Requirements">
      <div className="space-y-5">
        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[760px] divide-x divide-[#dfe8df]">
            {[
              ["Total Items", totals.total, "Across all group folders"],
              ["Checked", totals.checked, "Accepted requirements"],
              ["Submitted", totals.submitted, "Waiting for checking"],
              ["Missing", totals.missing, "Not yet submitted"],
              ["Returned", totals.returned, "Needs replacement"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-xs font-semibold text-[#7b877f]">{label}</p>
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
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Final Requirement Checklist
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Master list of documents and files collected from each group after
              dean approval.
            </p>
          </div>

          <div className="grid gap-3 p-5 md:grid-cols-2 xl:grid-cols-3">
            {finalRequirements.map((requirement) => (
              <div
                key={requirement.id}
                className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4"
              >
                <p className="text-sm font-semibold text-[#203028]">
                  {requirement.name}
                </p>
                <p className="mt-2 text-xs leading-5 text-[#59645d]">
                  {requirement.description}
                </p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Requirement Status by Group
            </h2>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {groupFolders.map((folder) => {
              const counts = getRequirementCounts(folder);

              return (
                <div key={folder.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {folder.groupName}
                      </p>
                      <p className="mt-1 text-xs text-[#59645d]">
                        {folder.course} {folder.section} • {folder.projectTitle}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses("Checked")}`}>
                        Checked {counts.checked}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses("Submitted")}`}>
                        Submitted {counts.submitted}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses("Missing")}`}>
                        Missing {counts.missing}
                      </span>
                      <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses("Returned")}`}>
                        Returned {counts.returned}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 h-2 rounded-full bg-[#edf2ec]">
                    <div
                      className="h-2 rounded-full bg-[#4f8f58]"
                      style={{ width: `${counts.progress}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </CoordinatorShell>
  );
}
