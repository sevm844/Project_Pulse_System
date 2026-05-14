"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { deanProjects } from "../_data/mockDeanData";

const courseOptions = ["All", "BSIT", "BSCS", "BSIS", "BLIS", "ACT"];
const stageOptions = [
  "All",
  "Proposal Review",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
  "Final Approval",
];
const riskOptions = ["All", "Normal", "At Risk", "Ready"];

function getRiskReason(project: (typeof deanProjects)[number]) {
  if (project.riskLevel === "At Risk") {
    if (project.feedbackCompletion < 50) return "Low feedback completion";
    if (project.revisionCount >= 10) return "High revision frequency";
    return "Needs dean attention";
  }

  if (project.finalRequirementStatus !== "Complete") {
    return "Final requirements pending";
  }

  if (project.defenseOutcome === "Pending") {
    return "Defense outcome pending";
  }

  return "No urgent issue";
}

function getProgressColor(progress: number, risk: string) {
  if (risk === "At Risk") return "bg-amber-400";
  if (progress >= 80) return "bg-[#4f8f58]";
  return "bg-[#94d29a]";
}

export default function DeanProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [riskFilter, setRiskFilter] = useState("All");
  const [adviserFilter, setAdviserFilter] = useState("All");

  const adviserOptions = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(deanProjects.map((project) => project.adviser))),
    ];
  }, []);

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
        project.finalRequirementStatus,
        project.defenseOutcome,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCourse =
        courseFilter === "All" || project.course === courseFilter;
      const matchesStage =
        stageFilter === "All" || project.stage === stageFilter;
      const matchesRisk =
        riskFilter === "All" || project.riskLevel === riskFilter;
      const matchesAdviser =
        adviserFilter === "All" || project.adviser === adviserFilter;

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStage &&
        matchesRisk &&
        matchesAdviser
      );
    });
  }, [adviserFilter, courseFilter, riskFilter, searchQuery, stageFilter]);

  const totalProjects = deanProjects.length;
  const readyProjects = deanProjects.filter(
    (project) => project.riskLevel === "Ready",
  ).length;
  const atRiskProjects = deanProjects.filter(
    (project) => project.riskLevel === "At Risk",
  ).length;
  const pendingFinalApprovals = deanProjects.filter(
    (project) => project.finalRequirementStatus !== "Complete",
  ).length;
  const averageProgress = Math.round(
    deanProjects.reduce((sum, project) => sum + project.progress, 0) /
      deanProjects.length,
  );

  const attentionProjects = filteredProjects.filter(
    (project) =>
      project.riskLevel === "At Risk" ||
      project.feedbackCompletion < 70 ||
      project.finalRequirementStatus !== "Complete" ||
      project.defenseOutcome === "Pending",
  );

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setStageFilter("All");
    setRiskFilter("All");
    setAdviserFilter("All");
  }

  return (
    <DeanShell title="Projects Monitoring">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Projects Monitoring
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            Monitor project health, manuscript progress, revision activity,
            adviser workload, defense status, and final requirement readiness.
          </p>
        </div>

        <div
          className="overflow-x-auto rounded-2xl border border-[#86d993] p-4 shadow-[0_10px_30px_rgba(34,197,94,0.14)]"
          style={{ backgroundColor: "#dcfce7" }}
        >
          <div className="flex min-w-[920px] divide-x divide-[#86d993]" style={{ backgroundColor: "#dcfce7" }}>

            {[
              ["Total Projects", totalProjects, "Registered groups"],
              ["Ready", readyProjects, "On track or complete"],
              ["At Risk", atRiskProjects, "Needs intervention"],
              ["Pending Final", pendingFinalApprovals, "Final requirements open"],
              ["Avg Progress", `${averageProgress}%`, "Across all projects"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#7b877f]">{label}</p>

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
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#203028]">
                Project Filters
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Search and narrow projects by course, stage, risk, or adviser.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="w-fit rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.3fr_0.8fr_1fr_0.8fr_1fr]">
            <label className="text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, project, adviser..."
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Course
              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {courseOptions.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Stage
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {stageOptions.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Risk
              <select
                value={riskFilter}
                onChange={(event) => setRiskFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {riskOptions.map((risk) => (
                  <option key={risk}>{risk}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Adviser
              <select
                value={adviserFilter}
                onChange={(event) => setAdviserFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {adviserOptions.map((adviser) => (
                  <option key={adviser}>{adviser}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] px-5 py-4">
              <h3 className="text-base font-semibold text-[#203028]">
                Project Health Board
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                {filteredProjects.length} project
                {filteredProjects.length === 1 ? "" : "s"} found
              </p>
            </div>

            <div className="divide-y divide-[#edf2ec]">
              {filteredProjects.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <p className="text-sm font-semibold text-[#203028]">
                    No projects found.
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Try changing the filters.
                  </p>
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div key={project.id} className="px-5 py-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_170px] lg:items-start">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4 className="font-semibold text-[#203028]">
                            {project.groupName}
                          </h4>
                          <StatusBadge status={project.riskLevel} />
                        </div>

                        <p className="mt-1 text-sm text-[#59645d]">
                          {project.projectTitle}
                        </p>

                        <p className="mt-2 text-xs text-[#7b877f]">
                          {project.course} {project.section} • {project.stage} •
                          Adviser: {project.adviser}
                        </p>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-[#203028]">
                              Progress
                            </span>
                            <span className="text-[#7b877f]">
                              {project.progress}%
                            </span>
                          </div>
                          <div className="mt-2 h-2 rounded-full bg-[#edf2ec]">
                            <div
                              className={`h-2 rounded-full ${getProgressColor(
                                project.progress,
                                project.riskLevel,
                              )}`}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-semibold text-[#59645d]">
                          <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                            Feedback {project.feedbackCompletion}%
                          </span>
                          <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                            Revisions {project.revisionCount}
                          </span>
                          <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                            Final {project.finalRequirementStatus}
                          </span>
                          <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                            Defense {project.defenseOutcome}
                          </span>
                        </div>

                        <p className="mt-3 text-xs font-semibold text-[#7b877f]">
                          Focus: {getRiskReason(project)}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 lg:items-end">
                        <Link
                          href={`/dean/projects/${project.id}`}
                          className="rounded-lg bg-[#202823] px-4 py-2 text-center text-xs font-semibold text-white hover:bg-[#303a33]"
                        >
                          Open Profile
                        </Link>

                        <Link
                          href="/dean/messages"
                          className="rounded-lg border border-[#dfe8df] px-4 py-2 text-center text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Message
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <aside className="space-y-5 xl:sticky xl:top-6 xl:self-start">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Needs Attention
              </h3>

              <div className="mt-4 space-y-3">
                {attentionProjects.length === 0 ? (
                  <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    No urgent project risks found.
                  </p>
                ) : (
                  attentionProjects.slice(0, 5).map((project) => (
                    <Link
                      key={project.id}
                      href={`/dean/projects/${project.id}`}
                      className="block rounded-xl border border-[#edf2ec] bg-white p-3 hover:bg-[#fbfdfb]"
                    >
                      <p className="text-sm font-semibold text-[#203028]">
                        {project.groupName}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {getRiskReason(project)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Adviser Load
              </h3>

              <div className="mt-4 space-y-3">
                {adviserOptions
                  .filter((adviser) => adviser !== "All")
                  .map((adviser) => {
                    const count = deanProjects.filter(
                      (project) => project.adviser === adviser,
                    ).length;

                    return (
                      <div
                        key={adviser}
                        className="rounded-xl bg-[#f8faf7] p-3"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-[#203028]">
                            {adviser}
                          </p>
                          <p className="text-xs text-[#7b877f]">
                            {count} project{count === 1 ? "" : "s"}
                          </p>
                        </div>
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
