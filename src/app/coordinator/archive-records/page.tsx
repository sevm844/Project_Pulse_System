import CoordinatorShell from "../_components/CoordinatorShell";
import Card from "../_components/Card";
import {
  groupFolders,
  getRequirementCounts,
} from "../_data/finalRecordsData";

export default function CoordinatorArchiveRecordsPage() {
  const completedFolders = groupFolders.filter(
    (folder) => getRequirementCounts(folder).progress === 100,
  );

  return (
    <CoordinatorShell title="Archive Records">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Completed Final Records
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Groups shown here have completed all final requirement files and are
            ready for records archiving.
          </p>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h3 className="text-base font-semibold text-[#203028]">
              Archive Queue
            </h3>
            <p className="mt-1 text-xs text-[#7b877f]">
              {completedFolders.length} completed folder
              {completedFolders.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {completedFolders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                No group folder is complete yet.
              </p>
            ) : (
              completedFolders.map((folder) => (
                <div key={folder.id} className="px-5 py-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {folder.groupName}
                      </p>
                      <p className="mt-1 text-sm text-[#59645d]">
                        {folder.projectTitle}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {folder.course} {folder.section} • Adviser:{" "}
                        {folder.adviser}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        Ready for Archive
                      </span>
                      <span className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-3 py-1 text-xs font-semibold text-[#59645d]">
                        ARC-{String(folder.id).padStart(4, "0")}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </CoordinatorShell>
  );
}
