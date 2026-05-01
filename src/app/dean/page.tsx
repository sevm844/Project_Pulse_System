import Link from "next/link";
import DeanShell from "./_components/DeanShell";
import DeanCalendar from "./_components/DeanCalendar";
import Card from "./_components/Card";
import StatusBadge from "./_components/StatusBadge";
import {
  adviserWorkloads,
  deanProjects,
  defenseOutcomes,
  finalApprovals,
} from "./_data/mockDeanData";

export default function DeanDashboardPage() {
  const atRiskGroups = deanProjects.filter(
    (project) => project.riskLevel === "At Risk",
  );

  const readyApprovals = finalApprovals.filter(
    (approval) => approval.status === "Ready",
  );

  return (
    <DeanShell title="Executive Dashboard">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_330px]">
        <div className="space-y-6">
          {/* Executive summary */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total Projects", deanProjects.length, "/dean/projects"],
              ["At-Risk Groups", atRiskGroups.length, "/dean/projects"],
              [
                "Pending Final Approvals",
                readyApprovals.length,
                "/dean/approvals",
              ],
              ["Defense Outcomes", defenseOutcomes.length, "/dean/defense"],
            ].map(([label, value, href]) => (
              <Link key={label} href={String(href)}>
                <Card className="p-5 transition hover:bg-[#fbfdfb]">
                  <p className="text-xs font-medium text-[#7b877f]">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[#203028]">
                    {value}
                  </p>
                </Card>
              </Link>
            ))}
          </div>

          {/* Project monitoring */}
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#edf2ec] p-5">
              <div>
                <h2 className="text-lg font-semibold text-[#203028]">
                  Project Monitoring
                </h2>
                <p className="mt-1 text-sm text-[#7b877f]">
                  Overview of all active capstone groups.
                </p>
              </div>

              <Link
                href="/dean/projects"
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                  <tr>
                    <th className="px-5 py-3 font-medium">
                      Course / Section
                    </th>
                    <th className="px-5 py-3 font-medium">Group</th>
                    <th className="px-5 py-3 font-medium">Stage</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Risk</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2ec]">
                  {deanProjects.map((project) => (
                    <tr key={project.id}>
                      <td className="px-5 py-4 text-[#59645d]">
                        {project.course} {project.section}
                      </td>
                      <td className="px-5 py-4 font-medium text-[#203028]">
                        {project.groupName}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {project.stage}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {project.progress}%
                      </td>
                      <td className="px-5 py-4">
                        <StatusBadge status={project.riskLevel} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Adviser workloads */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Adviser Workloads
              </h2>

              <div className="mt-4 space-y-3">
                {adviserWorkloads.map(([name, groups, pending]) => (
                  <div key={name} className="rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-sm font-semibold text-[#203028]">
                      {name}
                    </p>
                    <p className="mt-1 text-xs text-[#7b877f]">
                      {groups} assigned groups • {pending} pending reviews
                    </p>
                  </div>
                ))}
              </div>
            </Card>

            {/* Defense outcomes */}
            <Card className="p-5">
              <h2 className="text-lg font-semibold text-[#203028]">
                Recent Defense Outcomes
              </h2>

              <div className="mt-4 space-y-3">
                {defenseOutcomes.map(([group, stage, outcome, date]) => (
                  <div key={group} className="rounded-xl bg-[#f8faf7] p-4">
                    <div className="flex items-center justify-between gap-3">
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
          </div>
        </div>

        {/* Calendar */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <DeanCalendar />
        </div>
      </div>
    </DeanShell>
  );
}
