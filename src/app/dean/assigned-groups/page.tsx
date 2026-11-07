"use client";

import Link from "next/link";
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

const selectClass =
  "mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]";

export default function DeanAssignedGroupsPage() {
  const [projects, setProjects] = useState<ApiDeanProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  useEffect(() => {
    let cancelled = false;

    apiFetch<ApiDeanProject[]>("/dean/projects")
      .then((rows) => {
        if (!cancelled) setProjects(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(errorMessage(err, "Unable to load groups."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sections = useMemo(
    () => [...new Set(projects.map((project) => project.section))].sort(),
    [projects],
  );

  const filteredProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          (courseFilter === "All" || project.course === courseFilter) &&
          (sectionFilter === "All" || project.section === sectionFilter) &&
          (stageFilter === "All" || project.stage === stageFilter),
      ),
    [courseFilter, projects, sectionFilter, stageFilter],
  );

  function resetFilters() {
    setCourseFilter("All");
    setSectionFilter("All");
    setStageFilter("All");
  }

  return (
    <DeanShell title="Assigned Groups">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Assigned Groups
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            Monitor capstone groups by course, section, and project stage.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <Card className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#203028]">Filter groups</h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Choose a course, section, or stage to narrow the list.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <label className="text-xs font-semibold text-[#59645d]">
              Course
              <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className={selectClass}>
                {["All", ...COURSE_OPTIONS].map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Section
              <select value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} className={selectClass}>
                {["All", ...sections].map((section) => (
                  <option key={section}>{section}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Stage
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className={selectClass}>
                {["All", ...PROJECT_STAGES].map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <h3 className="text-base font-semibold text-[#203028]">
              Group Monitoring List
            </h3>

            <p className="text-xs font-semibold text-[#7b877f]">
              {filteredProjects.length} result
              {filteredProjects.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Course / Section</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Project Title</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Adviser</th>
                  <th className="px-5 py-3 font-medium">Profile</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredProjects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-[#fbfdfb]">
                    <td className="px-5 py-4 text-[#59645d]">
                      {project.course} {project.section}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {project.group_name}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {project.title || NO_TITLE_YET}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">{project.stage}</td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {project.adviser || NO_ADVISER_YET}
                    </td>
                    <td className="px-5 py-4">
                      <Link
                        href={`/dean/projects/${project.group_id}`}
                        className="text-xs font-semibold text-[#4f8f58] hover:underline"
                      >
                        Open
                      </Link>
                    </td>
                  </tr>
                ))}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-10 text-center text-sm text-[#7b877f]">
                      {loading ? "Loading groups..." : "No groups match the selected filters."}
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
