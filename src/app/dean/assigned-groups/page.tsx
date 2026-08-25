"use client";

import { useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { deanProjects } from "../_data/mockDeanData";

function getUniqueValues(values: string[]) {
  return ["All", ...Array.from(new Set(values))];
}

export default function DeanAssignedGroupsPage() {
  const [courseFilter, setCourseFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");

  const courses = useMemo(
    () => getUniqueValues(deanProjects.map((project) => project.course)),
    [],
  );

  const sections = useMemo(
    () => getUniqueValues(deanProjects.map((project) => project.section)),
    [],
  );

  const stages = useMemo(
    () => getUniqueValues(deanProjects.map((project) => project.stage)),
    [],
  );

  const risks = useMemo(
    () => getUniqueValues(deanProjects.map((project) => project.riskLevel)),
    [],
  );

  const filteredProjects = useMemo(() => {
    return deanProjects.filter((project) => {
      const matchesCourse =
        courseFilter === "All" || project.course === courseFilter;
      const matchesSection =
        sectionFilter === "All" || project.section === sectionFilter;
      const matchesStage = stageFilter === "All" || project.stage === stageFilter;
      const matchesRisk =
        riskFilter === "All" || project.riskLevel === riskFilter;

      return matchesCourse && matchesSection && matchesStage && matchesRisk;
    });
  }, [courseFilter, sectionFilter, stageFilter, riskFilter]);

  function resetFilters() {
    setCourseFilter("All");
    setSectionFilter("All");
    setStageFilter("All");
    setRiskFilter("All");
  }

  return (
    <DeanShell title="Assigned Groups">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
              Assigned Groups
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
              Monitor capstone groups by course, section, defense stage,
              progress, and risk level.
            </p>
          </div>

          <div className="rounded-2xl border border-[#dfe8df] bg-white px-4 py-3 text-xs text-[#59645d] shadow-sm xl:w-[330px]">
            <p className="font-semibold text-[#203028]">Dean guide</p>
            <p className="mt-1 leading-5">
              Focus first on groups marked <b>At Risk</b>, then review groups
              with low progress or upcoming defense stages.
            </p>
          </div>
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#203028]">
                Filter groups
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Choose a course, section, stage, or risk level to narrow the
                monitoring list.
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

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold text-[#59645d]">
              Course
              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {courses.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Section
              <select
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {sections.map((section) => (
                  <option key={section}>{section}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Stage
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {stages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Risk
              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {risks.map((risk) => (
                  <option key={risk}>{risk}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Showing Groups</p>
            <p className="mt-2 text-3xl font-semibold">
              {filteredProjects.length}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">At Risk</p>
            <p className="mt-2 text-3xl font-semibold">
              {
                filteredProjects.filter((item) => item.riskLevel === "At Risk")
                  .length
              }
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Ready</p>
            <p className="mt-2 text-3xl font-semibold">
              {filteredProjects.filter((item) => item.riskLevel === "Ready").length}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Average Progress</p>
            <p className="mt-2 text-3xl font-semibold">
              {filteredProjects.length
                ? Math.round(
                    filteredProjects.reduce(
                      (sum, project) => sum + project.progress,
                      0,
                    ) / filteredProjects.length,
                  )
                : 0}
              %
            </p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#203028]">
                Group Monitoring List
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Use this table to identify which groups need action, follow-up,
                or approval.
              </p>
            </div>

            <p className="text-xs font-semibold text-[#7b877f]">
              {filteredProjects.length} result
              {filteredProjects.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Course / Section</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Risk</th>
                  <th className="px-5 py-3 font-medium">Dean Focus</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredProjects.map((project) => (
                  <tr key={project.id} className="hover:bg-[#fbfdfb]">
                    <td className="px-5 py-4 text-[#59645d]">
                      {project.course} {project.section}
                    </td>

                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {project.groupName}
                    </td>

                    <td className="px-5 py-4 text-[#59645d]">
                      {project.stage}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-28 overflow-hidden rounded-full bg-[#edf2ec]">
                          <div
                            className="h-full rounded-full bg-[#203028]"
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-[#59645d]">
                          {project.progress}%
                        </span>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={project.riskLevel} />
                    </td>

                    <td className="px-5 py-4 text-xs text-[#59645d]">
                      {project.riskLevel === "At Risk"
                        ? "Needs immediate follow-up"
                        : project.progress >= 80
                          ? "Ready for next stage review"
                          : "Continue monitoring progress"}
                    </td>
                  </tr>
                ))}

                {filteredProjects.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-5 py-10 text-center text-sm text-[#7b877f]"
                    >
                      No groups match the selected filters.
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
