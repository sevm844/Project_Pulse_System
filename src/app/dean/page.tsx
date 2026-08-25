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

  const administrationActions = [
    [
      "Review Requests",
      "Approve or reject new staff accounts.",
      "/dean/administration/register-requests",
    ],
    [
      "Manage Users",
      "Update roles, account status, and access.",
      "/dean/administration/users",
    ],
    [
      "Academic Setup",
      "Maintain courses, groups, assignments, and terms.",
      "/dean/administration",
    ],
    [
      "Audit Logs",
      "Review important activity across the system.",
      "/dean/administration/audit-logs",
    ],
  ] as const;

  return (
    <DeanShell title="Dean Dashboard">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#203028]">
            Dean Dashboard
          </h1>

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
              ["Admin Tools", 10, "/dean/administration"],
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

          <Card className="p-5">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#203028]">
                  Administration Shortcuts
                </h2>
                <p className="mt-1 text-sm text-[#7b877f]">
                  Highest-authority controls are grouped in one place.
                </p>
              </div>

              <Link
                href="/dean/administration"
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold shadow-[0_1px_2px_rgba(31,42,36,0.04)] hover:bg-[#f3f7f1]"
              >
                Open Administration
              </Link>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {administrationActions.map(([title, description, href]) => (
                <Link key={href} href={href}>
                  <div className="h-full rounded-lg border border-[#dfe8df] bg-white p-4 transition hover:bg-[#fbfdfb]">
                    <p className="text-sm font-semibold text-[#203028]">
                      {title}
                    </p>
                    <p className="mt-2 text-xs leading-5 text-[#59645d]">
                      {description}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-[#edf2ec] bg-white p-5">
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
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold shadow-[0_1px_2px_rgba(31,42,36,0.04)] hover:bg-[#f3f7f1]"
              >
                View All
              </Link>
            </div>

            <div>
              <table className="w-full table-fixed text-left text-sm">
                <colgroup>
                  <col className="w-[24%]" />
                  <col className="w-[23%]" />
                  <col className="w-[27%]" />
                  <col className="w-[16%]" />
                  <col className="w-[10%]" />
                </colgroup>
                <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                  <tr>
                    <th className="px-4 py-3 font-medium">
                      Course / Section
                    </th>
                    <th className="px-4 py-3 font-medium">Group</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                    <th className="px-4 py-3 font-medium">Progress</th>
                    <th className="px-4 py-3 font-medium">Risk</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2ec] bg-white">
                  {deanProjects.map((project) => (
                    <tr key={project.id} className="transition hover:bg-[#fbfdfb]">
                      <td className="break-words px-4 py-4 text-[#59645d]">
                        {project.course} {project.section}
                      </td>
                      <td className="break-words px-4 py-4 font-medium text-[#203028]">
                        {project.groupName}
                      </td>
                      <td className="break-words px-4 py-4 text-[#59645d]">
                        {project.stage}
                      </td>
                      <td className="px-4 py-4 text-[#59645d]">
                        {project.progress}%
                      </td>
                      <td className="px-4 py-4">
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
                  <div
                    key={name}
                    className="rounded-xl border border-[#dfe8df] bg-white p-4 shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
                  >
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
                  <div
                    key={group}
                    className="rounded-xl border border-[#dfe8df] bg-white p-4 shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
                  >
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
