import CoordinatorShell from "../_components/CoordinatorShell";
import Card from "../_components/Card";
import {
  groupFolders,
  getRequirementCounts,
} from "../_data/finalRecordsData";

export default function CoordinatorCollectionTrackerPage() {
  return (
    <CoordinatorShell title="Collection Tracker">
      <Card className="overflow-hidden">
        <div className="border-b border-[#edf2ec] px-5 py-4">
          <h2 className="text-lg font-semibold text-[#203028]">
            Requirement Collection Tracker
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Track which groups are complete, missing files, or waiting for
            coordinator checking.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
              <tr>
                <th className="px-5 py-3 font-medium">Group</th>
                <th className="px-5 py-3 font-medium">Course</th>
                <th className="px-5 py-3 font-medium">Progress</th>
                <th className="px-5 py-3 font-medium">Checked</th>
                <th className="px-5 py-3 font-medium">Submitted</th>
                <th className="px-5 py-3 font-medium">Missing</th>
                <th className="px-5 py-3 font-medium">Last Submission</th>
                <th className="px-5 py-3 font-medium">Last Message</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-[#edf2ec]">
              {groupFolders.map((folder) => {
                const counts = getRequirementCounts(folder);

                return (
                  <tr key={folder.id} className="hover:bg-[#fbfdfb]">
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
                        <div className="h-2 w-32 rounded-full bg-[#edf2ec]">
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
                    <td className="px-5 py-4 text-[#59645d]">
                      {folder.lastSubmission}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {folder.lastMessage}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </CoordinatorShell>
  );
}
