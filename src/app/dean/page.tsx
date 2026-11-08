"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import DeanShell from "./_components/DeanShell";
import DeanCalendar from "./_components/DeanCalendar";
import Card from "./_components/Card";
import { apiFetch } from "../_lib/api";
import {
  errorMessage,
  NO_ADVISER_YET,
  NO_TITLE_YET,
  type ApiDeanProject,
} from "../_lib/groups";

const administrationActions = [
  [
    "Manage Users",
    "Update roles, account status, and access.",
    "/dean/administration/users",
  ],
  [
    "Manage Groups",
    "Assign advisers and move groups through the project stages.",
    "/dean/administration/groups",
  ],
  [
    "Audit Logs",
    "Review important activity across the system.",
    "/dean/administration/audit-logs",
  ],
] as const;

export default function DeanDashboardPage() {
  const [projects, setProjects] = useState<ApiDeanProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiDeanProject[]>("/dean/projects")
      .then((rows) => {
        if (!cancelled) setProjects(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Unable to load projects."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const awaitingEndorsement = projects.filter(
    (project) => project.stage === "Dean's Endorsement" && project.group_status === "Active",
  ).length;
  const readyForDefense = projects.filter((project) => project.stage === "Ready for Proposal Defense").length;
  const withoutAdviser = projects.filter((project) => !project.adviser).length;

  const adviserLoads = useMemo(() => {
    const counts = new Map<string, number>();

    for (const project of projects) {
      if (project.adviser) {
        counts.set(project.adviser, (counts.get(project.adviser) || 0) + 1);
      }
    }

    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [projects]);

  return (
    <DeanShell title="Dean Dashboard">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-6">
          <h1 className="text-2xl font-bold tracking-tight text-[#203028]">
            Dean Dashboard
          </h1>

          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Executive summary */}
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {[
              ["Total Projects", projects.length, "/dean/projects"],
              ["Awaiting Your Endorsement", awaitingEndorsement, "/dean/projects"],
              ["Ready for Proposal Defense", readyForDefense, "/dean/projects"],
              [
                "Without Adviser",
                withoutAdviser,
                "/dean/administration/groups",
              ],
            ].map(([label, value, href]) => (
              <Link key={label} href={String(href)}>
                <Card className="p-5 transition hover:bg-[#fbfdfb]">
                  <p className="text-xs font-medium text-[#7b877f]">{label}</p>
                  <p className="mt-3 text-3xl font-semibold text-[#203028]">
                    {loading ? "-" : value}
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

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                  Overview of all capstone groups.
                </p>
              </div>

              <Link
                href="/dean/projects"
                className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold shadow-[0_1px_2px_rgba(31,42,36,0.04)] hover:bg-[#f3f7f1]"
              >
                View All
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                  <tr>
                    <th className="px-4 py-3 font-medium">Course / Section</th>
                    <th className="px-4 py-3 font-medium">Group</th>
                    <th className="px-4 py-3 font-medium">Project Title</th>
                    <th className="px-4 py-3 font-medium">Stage</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-[#edf2ec] bg-white">
                  {projects.slice(0, 8).map((project) => (
                    <tr key={project.project_id} className="transition hover:bg-[#fbfdfb]">
                      <td className="px-4 py-4 text-[#59645d]">
                        {project.course} {project.section}
                      </td>
                      <td className="px-4 py-4 font-medium text-[#203028]">
                        {project.group_name}
                      </td>
                      <td className="px-4 py-4 text-[#59645d]">
                        {project.title || NO_TITLE_YET}
                      </td>
                      <td className="px-4 py-4 text-[#59645d]">
                        {project.stage}
                      </td>
                    </tr>
                  ))}

                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#7b877f]">
                        {loading ? "Loading projects..." : "No groups have been created yet."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Adviser workloads */}
          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[#203028]">
              Adviser Workloads
            </h2>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              {adviserLoads.map(([name, groups]) => (
                <div
                  key={name}
                  className="rounded-xl border border-[#dfe8df] bg-white p-4 shadow-[0_1px_2px_rgba(31,42,36,0.04)]"
                >
                  <p className="text-sm font-semibold text-[#203028]">{name}</p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {groups} assigned group{groups === 1 ? "" : "s"}
                  </p>
                </div>
              ))}

              {adviserLoads.length === 0 && (
                <p className="text-sm text-[#7b877f]">
                  {NO_ADVISER_YET}: no group has an adviser yet.
                </p>
              )}
            </div>
          </Card>
        </div>

        {/* Calendar */}
        <div className="xl:sticky xl:top-6 xl:self-start">
          <DeanCalendar />
        </div>
      </div>
    </DeanShell>
  );
}
