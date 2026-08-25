"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { adviserWorkloads, deanProjects } from "../_data/mockDeanData";

type CourseFilter = "All" | "BSIT" | "BSIS" | "BSCS" | "BLIS" | "ACT";
type ReportFilter =
  | "Overview"
  | "Project Performance"
  | "Adviser Workload"
  | "Defense Status"
  | "Final Approval";
type RiskFilter = "All" | "Ready" | "Normal" | "At Risk";

const courseOptions: CourseFilter[] = [
  "All",
  "BSIT",
  "BSIS",
  "BSCS",
  "BLIS",
  "ACT",
];

const reportOptions: ReportFilter[] = [
  "Overview",
  "Project Performance",
  "Adviser Workload",
  "Defense Status",
  "Final Approval",
];

const riskOptions: RiskFilter[] = ["All", "Ready", "Normal", "At Risk"];

function getWorkloadLevel(groups: number, pending: number) {
  if (pending >= 6 || groups >= 4) return "High";
  if (pending >= 3 || groups >= 2) return "Moderate";
  return "Light";
}

function workloadClasses(level: string) {
  if (level === "High") return "border-rose-200 bg-rose-50 text-rose-700";
  if (level === "Moderate") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function exportCsv(rows: typeof deanProjects) {
  const headers = [
    "Course",
    "Section",
    "Group",
    "Project",
    "Adviser",
    "Stage",
    "Progress",
    "Risk",
    "Revisions",
    "Feedback Completion",
    "Defense Outcome",
    "Final Requirement Status",
  ];

  const body = rows.map((project) => [
    project.course,
    project.section,
    project.groupName,
    project.projectTitle,
    project.adviser,
    project.stage,
    `${project.progress}%`,
    project.riskLevel,
    project.revisionCount,
    `${project.feedbackCompletion}%`,
    project.defenseOutcome,
    project.finalRequirementStatus,
  ]);

  const csv = [headers, ...body]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "dean-reports.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function DeanReportsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("All");
  const [reportFilter, setReportFilter] = useState<ReportFilter>("Overview");
  const [riskFilter, setRiskFilter] = useState<RiskFilter>("All");

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return deanProjects.filter((project) => {
      const searchable = [
        project.course,
        project.section,
        project.groupName,
        project.projectTitle,
        project.adviser,
        project.stage,
        project.riskLevel,
        project.defenseOutcome,
        project.finalRequirementStatus,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCourse =
        courseFilter === "All" || project.course === courseFilter;
      const matchesRisk =
        riskFilter === "All" || project.riskLevel === riskFilter;

      return matchesSearch && matchesCourse && matchesRisk;
    });
  }, [courseFilter, riskFilter, searchQuery]);

  const totalProjects = deanProjects.length;
  const atRiskProjects = deanProjects.filter(
    (project) => project.riskLevel === "At Risk",
  ).length;
  const pendingReviews = adviserWorkloads.reduce(
    (total, [, , pending]) => total + Number(pending),
    0,
  );
  const pendingDefense = deanProjects.filter(
    (project) => project.defenseOutcome === "Pending",
  ).length;
  const readyFinal = deanProjects.filter(
    (project) =>
      project.finalRequirementStatus === "Complete" ||
      project.riskLevel === "Ready",
  ).length;
  const averageProgress = Math.round(
    deanProjects.reduce((sum, project) => sum + project.progress, 0) /
      Math.max(deanProjects.length, 1),
  );

  const highestRiskProject =
    deanProjects.find((project) => project.riskLevel === "At Risk") ||
    deanProjects[0];

  const lowestFeedbackProject = [...deanProjects].sort(
    (left, right) => left.feedbackCompletion - right.feedbackCompletion,
  )[0];

  const overloadedAdviser = [...adviserWorkloads].sort(
    (left, right) => Number(right[2]) - Number(left[2]),
  )[0];

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setReportFilter("Overview");
    setRiskFilter("All");
  }

  return (
    <DeanShell title="Reports">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Reports Overview
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            Monitor project performance, adviser workload, defense status, and
            final requirement readiness in one clean report board.
          </p>
        </div>

        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[980px] divide-x divide-[#edf2ec]">
            {[
              ["Total Projects", totalProjects, "Registered groups"],
              ["At Risk", atRiskProjects, "Needs attention"],
              ["Pending Reviews", pendingReviews, "Adviser workload"],
              ["Pending Defense", pendingDefense, "Awaiting outcome"],
              ["Ready Final", readyFinal, "Final-ready groups"],
              ["Avg Progress", `${averageProgress}%`, "Overall completion"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#7b877f]">
                  {label}
                </p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-2xl font-semibold leading-none text-[#203028]">
                    {value}
                  </p>
                  <p className="pb-0.5 text-[10px] leading-4 text-[#7b877f]">
                    {caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-x-auto p-3">
          <div className="flex min-w-[1180px] items-end gap-3">
            <label className="w-[360px] shrink-0 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, adviser, project..."
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="w-[150px] shrink-0 text-xs font-semibold text-[#59645d]">
              Course
              <select
                value={courseFilter}
                onChange={(event) =>
                  setCourseFilter(event.target.value as CourseFilter)
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {courseOptions.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="w-[230px] shrink-0 text-xs font-semibold text-[#59645d]">
              Report Type
              <select
                value={reportFilter}
                onChange={(event) =>
                  setReportFilter(event.target.value as ReportFilter)
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {reportOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label className="w-[150px] shrink-0 text-xs font-semibold text-[#59645d]">
              Risk
              <select
                value={riskFilter}
                onChange={(event) =>
                  setRiskFilter(event.target.value as RiskFilter)
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {riskOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="h-10 w-[120px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => exportCsv(filteredProjects)}
              className="h-10 w-[120px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="h-10 w-[110px] shrink-0 rounded-lg bg-[#123f2b] px-4 text-xs font-semibold text-white hover:bg-[#0f3324]"
            >
              Print
            </button>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] px-5 py-4">
              <h3 className="text-base font-semibold text-[#203028]">
                {reportFilter} Report
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                {filteredProjects.length} project
                {filteredProjects.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] text-left text-sm">
                <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                  <tr>
                    <th className="px-5 py-3 font-medium">Group / Project</th>
                    <th className="px-5 py-3 font-medium">Course</th>
                    <th className="px-5 py-3 font-medium">Adviser</th>
                    <th className="px-5 py-3 font-medium">Stage</th>
                    <th className="px-5 py-3 font-medium">Progress</th>
                    <th className="px-5 py-3 font-medium">Revisions</th>
                    <th className="px-5 py-3 font-medium">Feedback</th>
                    <th className="px-5 py-3 font-medium">Defense</th>
                    <th className="px-5 py-3 font-medium">Final</th>
                    <th className="px-5 py-3 font-medium">Risk</th>
                    <th className="px-5 py-3 font-medium">Action</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2ec]">
                  {filteredProjects.map((project) => (
                    <tr key={project.id} className="hover:bg-[#fbfdfb]">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#203028]">
                          {project.groupName}
                        </p>
                        <p className="mt-1 max-w-[260px] text-xs leading-5 text-[#59645d]">
                          {project.projectTitle}
                        </p>
                      </td>

                      <td className="px-5 py-4 text-[#59645d]">
                        {project.course} {project.section}
                      </td>

                      <td className="px-5 py-4 text-[#59645d]">
                        {project.adviser}
                      </td>

                      <td className="px-5 py-4 text-[#59645d]">
                        {project.stage}
                      </td>

                      <td className="px-5 py-4">
                        <div className="w-28">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#203028]">
                              {project.progress}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-[#edf2ec]">
                            <div
                              className="h-2 rounded-full bg-[#94d29a]"
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4 text-[#59645d]">
                        {project.revisionCount}
                      </td>

                      <td className="px-5 py-4 text-[#59645d]">
                        {project.feedbackCompletion}%
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={project.defenseOutcome} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={project.finalRequirementStatus} />
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge status={project.riskLevel} />
                      </td>

                      <td className="px-5 py-4">
                        <Link
                          href={`/dean/projects/${project.id}`}
                          className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
                        >
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredProjects.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No report records found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the filters.
                </p>
              </div>
            )}
          </Card>

          <aside className="space-y-5">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Executive Insights
              </h3>

              <div className="mt-4 space-y-3 text-sm">
                <InsightBox
                  label="Highest Risk"
                  value={highestRiskProject?.groupName || "None"}
                  caption={
                    highestRiskProject
                      ? `${highestRiskProject.progress}% progress • ${highestRiskProject.riskLevel}`
                      : "No project data"
                  }
                />

                <InsightBox
                  label="Lowest Feedback"
                  value={lowestFeedbackProject?.groupName || "None"}
                  caption={
                    lowestFeedbackProject
                      ? `${lowestFeedbackProject.feedbackCompletion}% feedback completion`
                      : "No feedback data"
                  }
                />

                <InsightBox
                  label="Most Pending Reviews"
                  value={String(overloadedAdviser?.[0] || "None")}
                  caption={
                    overloadedAdviser
                      ? `${overloadedAdviser[2]} pending reviews`
                      : "No adviser data"
                  }
                />
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Adviser Workload
              </h3>

              <div className="mt-4 space-y-3">
                {adviserWorkloads.map(([name, groups, pending]) => {
                  const workload = getWorkloadLevel(
                    Number(groups),
                    Number(pending),
                  );

                  return (
                    <div
                      key={name}
                      className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#203028]">
                          {name}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${workloadClasses(
                            workload,
                          )}`}
                        >
                          {workload}
                        </span>
                      </div>

                      <p className="mt-2 text-xs leading-5 text-[#59645d]">
                        {groups} groups handled • {pending} pending reviews
                      </p>
                    </div>
                  );
                })}
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </DeanShell>
  );
}

function InsightBox({
  label,
  value,
  caption,
}: {
  label: string;
  value: string;
  caption: string;
}) {
  return (
    <div className="rounded-xl bg-[#f8faf7] p-4">
      <p className="text-xs font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#203028]">{value}</p>
      <p className="mt-1 text-xs leading-5 text-[#59645d]">{caption}</p>
    </div>
  );
}
