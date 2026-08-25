import CoordinatorShell from "./_components/CoordinatorShell";
import Card from "./_components/Card";
import CoordinatorCalendar from "./_components/CoordinatorCalendar";
import {
  groupFolders,
  getRequirementCounts,
} from "./_data/finalRecordsData";

function statusClasses(status: string) {
  if (status === "Complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "For Checking") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function CoordinatorDashboardPage() {
  const totalFolders = groupFolders.length;

  const completeFolders = groupFolders.filter(
    (folder) => getRequirementCounts(folder).progress === 100,
  ).length;

  const pendingFolders = groupFolders.filter(
    (folder) => getRequirementCounts(folder).progress < 100,
  ).length;

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
    {
      checked: 0,
      submitted: 0,
      missing: 0,
      returned: 0,
      total: 0,
    },
  );

  return (
    <CoordinatorShell title="Coordinator Overview">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="min-w-0 space-y-5">
          <Card className="overflow-x-auto p-4">
            <div className="flex min-w-[720px] divide-x divide-[#edf2ec]">
              {[
                ["Folders", totalFolders, "Active group folders"],
                ["Complete", completeFolders, "Ready for archive"],
                ["Pending", pendingFolders, "Needs follow-up"],
                ["Submitted", totals.submitted, "Need checking"],
                ["Missing", totals.missing, "Need follow-up"],
              ].map(([label, value, caption]) => (
                <div key={label} className="flex-1 px-4 py-2">
                  <p className="text-xs font-semibold text-[#7b877f]">
                    {label}
                  </p>
                  <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
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
                Final Requirement Collection
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Monitor group folders, missing files, submitted requirements,
                and archive-ready records.
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-left text-sm">
                <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Group</th>
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Checked</th>
                    <th className="px-5 py-3 font-medium">Submitted</th>
                    <th className="px-5 py-3 font-medium">Missing</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2ec] bg-white">
                  {groupFolders.map((folder) => {
                    const counts = getRequirementCounts(folder);
                    const status =
                      counts.progress === 100
                        ? "Complete"
                        : counts.submitted > 0
                          ? "For Checking"
                          : "Incomplete";

                    return (
                      <tr key={folder.id} className="transition hover:bg-[#fbfdfb]">
                        <td className="px-5 py-4">
                          <p className="font-semibold text-[#203028]">
                            {folder.groupName}
                          </p>
                          <p className="mt-1 text-xs text-[#59645d]">
                            {folder.projectTitle}
                          </p>
                        </td>

                        <td className="px-5 py-4 text-[#59645d]">
                          {folder.course} {folder.section}
                        </td>

                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-2 w-28 rounded-full bg-[#edf2ec]">
                              <div
                                className="h-2 rounded-full bg-[#4f8f58]"
                                style={{ width: `${counts.progress}%` }}
                              />
                            </div>
                            <span className="text-xs font-semibold text-[#203028]">
                              {counts.progress}%
                            </span>
                          </div>
                        </td>

                        <td className="px-5 py-4 text-[#59645d]">
                          {counts.checked}/{counts.total}
                        </td>

                        <td className="px-5 py-4 text-[#59645d]">
                          {counts.submitted}
                        </td>

                        <td className="px-5 py-4 text-[#59645d]">
                          {counts.missing}
                        </td>

                        <td className="px-5 py-4">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Follow-up Focus
              </h2>

              <div className="mt-4 space-y-3">
                {groupFolders.map((folder) => {
                  const counts = getRequirementCounts(folder);

                  return (
                    <div
                      key={folder.id}
                      className="rounded-xl border border-[#dfe8df] bg-white p-4 shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-[#203028]">
                            {folder.groupName}
                          </p>
                          <p className="mt-1 text-xs text-[#59645d]">
                            Last message: {folder.lastMessage}
                          </p>
                        </div>

                        <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                          {counts.missing} missing
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Quick Actions
              </h2>

              <div className="mt-4 grid gap-3">
                {[
                  ["Requirements", "Review the official requirement list."],
                  ["Group Folders", "Open each group final folder."],
                  ["Collection Tracker", "Track missing and submitted files."],
                  ["Archive Records", "View completed archive-ready folders."],
                ].map(([title, caption]) => (
                  <div
                    key={title}
                    className="rounded-xl border border-[#dfe8df] bg-white p-4 shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
                  >
                    <p className="text-sm font-semibold text-[#203028]">
                      {title}
                    </p>
                    <p className="mt-1 text-xs leading-5 text-[#59645d]">
                      {caption}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>

        <aside className="min-w-0 self-start xl:sticky xl:top-6">
          <CoordinatorCalendar />
        </aside>
      </div>
    </CoordinatorShell>
  );
}
