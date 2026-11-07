"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import { apiFetch } from "../../_lib/api";
import {
  COURSE_OPTIONS,
  errorMessage,
  NO_ADVISER_YET,
  NO_TITLE_YET,
  type ApiDeanProject,
} from "../../_lib/groups";
import { PROJECT_STAGES } from "../../_utils/projectWorkflow";

function exportCsv(rows: ApiDeanProject[]) {
  const headers = ["Course", "Section", "Group", "Project Title", "Adviser", "Stage"];

  const body = rows.map((project) => [
    project.course,
    project.section,
    project.group_name,
    project.title || NO_TITLE_YET,
    project.adviser || NO_ADVISER_YET,
    project.stage,
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
  const [projects, setProjects] = useState<ApiDeanProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiDeanProject[]>("/dean/projects")
      .then((rows) => {
        if (!cancelled) setProjects(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Unable to load the report."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return projects.filter((project) => {
      const searchable = [
        project.course,
        project.section,
        project.group_name,
        project.title,
        project.adviser,
        project.stage,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (courseFilter === "All" || project.course === courseFilter)
      );
    });
  }, [courseFilter, projects, searchQuery]);

  const withTitle = filteredProjects.filter((project) => project.title).length;

  const stageCounts = PROJECT_STAGES.map(
    (stage) =>
      [
        stage,
        filteredProjects.filter((project) => project.stage === stage).length,
      ] as const,
  );

  const adviserCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const project of filteredProjects) {
      const name = project.adviser || NO_ADVISER_YET;
      counts.set(name, (counts.get(name) || 0) + 1);
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [filteredProjects]);

  return (
    <DeanShell title="Reports">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
              Reports
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
              Group, title and stage summary for the capstone program.
            </p>
          </div>

          <button
            type="button"
            disabled={filteredProjects.length === 0}
            onClick={() => exportCsv(filteredProjects)}
            className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <Card className="p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_200px]">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search group, title, adviser..."
              aria-label="Search report"
              className="rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
            />

            <select
              value={courseFilter}
              onChange={(event) => setCourseFilter(event.target.value)}
              aria-label="Filter by course"
              className="rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
            >
              {["All", ...COURSE_OPTIONS].map((course) => (
                <option key={course}>{course}</option>
              ))}
            </select>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["Groups", filteredProjects.length],
            ["With Approved Title", withTitle],
            ["Awaiting Title", filteredProjects.length - withTitle],
          ].map(([label, value]) => (
            <Card key={label} className="p-5">
              <p className="text-xs text-[#7b877f]">{label}</p>
              <p className="mt-2 text-3xl font-semibold text-[#203028]">
                {loading ? "-" : value}
              </p>
            </Card>
          ))}
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Groups by Stage</h3>

            <div className="mt-4 space-y-3">
              {stageCounts.map(([stage, count]) => (
                <div key={stage} className="flex items-center justify-between rounded-xl bg-[#f8faf7] px-4 py-3">
                  <p className="text-sm font-medium text-[#203028]">{stage}</p>
                  <p className="text-sm font-semibold text-[#203028]">{count}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-lg font-semibold text-[#203028]">Adviser Workload</h3>

            <div className="mt-4 space-y-3">
              {adviserCounts.length === 0 && (
                <p className="text-sm text-[#7b877f]">No groups to report yet.</p>
              )}

              {adviserCounts.map(([name, count]) => (
                <div key={name} className="flex items-center justify-between rounded-xl bg-[#f8faf7] px-4 py-3">
                  <p className="text-sm font-medium text-[#203028]">{name}</p>
                  <p className="text-sm font-semibold text-[#203028]">
                    {count} group{count === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Course / Section</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Project Title</th>
                  <th className="px-5 py-3 font-medium">Adviser</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredProjects.map((project) => (
                  <tr key={project.project_id}>
                    <td className="px-5 py-4 text-[#59645d]">
                      {project.course} {project.section}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {project.group_name}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {project.title || NO_TITLE_YET}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {project.adviser || NO_ADVISER_YET}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">{project.stage}</td>
                  </tr>
                ))}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-5 py-10 text-center text-sm text-[#7b877f]">
                      {loading ? "Loading report..." : "No groups to report yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DeanShell>
  );
}
