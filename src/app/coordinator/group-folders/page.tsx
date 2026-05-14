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

export default function CoordinatorGroupFoldersPage() {
  return (
    <CoordinatorShell title="Group Folders">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Final Requirement Folders
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Each group folder keeps the final softcopy requirements in one
            checklist.
          </p>
        </Card>

        <div className="grid gap-5 xl:grid-cols-2">
          {groupFolders.map((folder) => {
            const counts = getRequirementCounts(folder);

            return (
              <Card key={folder.id} className="overflow-hidden">
                <div className="border-b border-[#edf2ec] px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-[#203028]">
                        {folder.groupName}
                      </h3>
                      <p className="mt-1 text-sm text-[#59645d]">
                        {folder.projectTitle}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {folder.course} {folder.section} • Adviser:{" "}
                        {folder.adviser}
                      </p>
                    </div>

                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                      {counts.progress}% complete
                    </span>
                  </div>

                  <div className="mt-4 h-2 rounded-full bg-[#edf2ec]">
                    <div
                      className="h-2 rounded-full bg-[#4f8f58]"
                      style={{ width: `${counts.progress}%` }}
                    />
                  </div>
                </div>

                <div className="grid gap-3 p-5 md:grid-cols-2">
                  {finalRequirements.map((requirement) => {
                    const status = folder.requirements[requirement.name];

                    return (
                      <div
                        key={requirement.id}
                        className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-xs font-semibold text-[#203028]">
                            {requirement.name}
                          </p>
                          <span
                            className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </CoordinatorShell>
  );
}
