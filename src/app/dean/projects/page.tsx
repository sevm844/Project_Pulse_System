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
import { GroupStatusNote, StageBadge } from "../../_components/ProposalStage";
import { PROPOSAL_STAGES } from "../../_utils/projectWorkflow";

const inputClass =
  "mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm font-normal outline-none focus:ring-2 focus:ring-[#d7f7d8]";

export default function DeanProjectsPage() {
  const [projects, setProjects] = useState<ApiDeanProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");
  const [adviserFilter, setAdviserFilter] = useState("All");

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

  const advisers = useMemo(
    () => [...new Set(projects.map((project) => project.adviser).filter(Boolean))] as string[],
    [projects],
  );

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
        (courseFilter === "All" || project.course === courseFilter) &&
        (stageFilter === "All" || project.stage === stageFilter) &&
        (adviserFilter === "All" ||
          (adviserFilter === NO_ADVISER_YET
            ? !project.adviser
            : project.adviser === adviserFilter))
      );
    });
  }, [adviserFilter, courseFilter, projects, searchQuery, stageFilter]);

  const awaiting = projects.filter((project) => project.stage === "Dean's Endorsement" && project.group_status === "Active");
  const ready = projects.filter((project) => project.stage === "Ready for Proposal Defense").length;

  // What the Dean can act on: endorsements first, then groups with nobody left, then groups with no adviser.
  const needsAttention = [
    ...awaiting.map((project) => ({ project, reason: "Waiting for your endorsement" })),
    ...projects
      .filter((project) => project.group_status === "Pending Closure")
      .map((project) => ({ project, reason: "Every member left - confirm closure" })),
    ...projects
      .filter((project) => !project.adviser && project.group_status === "Active")
      .map((project) => ({ project, reason: "No adviser assigned" })),
  ];

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setStageFilter("All");
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
            Monitor every capstone group: its adviser, chosen title, and
            current proposal stage.
          </p>
        </div>

        {error && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="overflow-x-auto rounded-2xl border border-[#bfe8b9] bg-[linear-gradient(90deg,#ffffff_0%,#f2fdeb_48%,#e4f8d8_100%)] p-4 shadow-[0_10px_28px_rgba(32,48,40,0.08)]">
          <div className="flex min-w-[640px] divide-x divide-[#cfe8c8]">
            {[
              ["Total Projects", projects.length, "Registered groups"],
              ["Awaiting Endorsement", awaiting.length, "Needs your sign-off"],
              ["Ready for Defense", ready, "Proposal Defense next"],
              ["Advisers", advisers.length, "With assigned groups"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#2f6f3a]">{label}</p>

                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-2xl font-semibold leading-none text-[#0f1f16]">
                    {loading ? "-" : value}
                  </p>
                  <p className="pb-0.5 text-[10px] leading-4 text-[#59645d]">
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
                Search and narrow projects by course, stage, or adviser.
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

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <label className="text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, project, adviser..."
                className={inputClass}
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Course
              <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} className={inputClass}>
                {["All", ...COURSE_OPTIONS].map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Stage
              <select value={stageFilter} onChange={(event) => setStageFilter(event.target.value)} className={inputClass}>
                {["All", ...PROPOSAL_STAGES].map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Adviser
              <select value={adviserFilter} onChange={(event) => setAdviserFilter(event.target.value)} className={inputClass}>
                {["All", NO_ADVISER_YET, ...advisers].map((adviser) => (
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
                Project Board
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
                    {loading ? "Loading projects..." : "No projects found."}
                  </p>
                  {!loading && (
                    <p className="mt-1 text-xs text-[#7b877f]">
                      Groups appear here once an adviser creates them.
                    </p>
                  )}
                </div>
              ) : (
                filteredProjects.map((project) => (
                  <div key={project.project_id} className="px-5 py-4">
                    <div className="grid gap-4 lg:grid-cols-[1fr_170px] lg:items-start">
                      <div>
                        <h4 className="font-semibold text-[#203028]">
                          {project.group_name}
                        </h4>

                        <p
                          className={`mt-1 text-sm ${
                            project.title ? "text-[#59645d]" : "text-[#7b877f]"
                          }`}
                        >
                          {project.title || NO_TITLE_YET}
                        </p>

                        <div className="mt-2">
                          <StageBadge stage={project.stage} />
                          <GroupStatusNote status={project.group_status} />
                        </div>

                        <p className="mt-2 text-xs text-[#7b877f]">
                          {project.course} {project.section} • Adviser: {project.adviser || NO_ADVISER_YET}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2 lg:items-end">
                        <Link
                          href={`/dean/projects/${project.group_id}`}
                          className="rounded-lg bg-[#123f2b] px-4 py-2 text-center text-xs font-semibold text-white hover:bg-[#0f3324]"
                        >
                          Open Profile
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
                Needs Your Attention
              </h3>

              <div className="mt-4 space-y-3">
                {needsAttention.length === 0 ? (
                  <p className="rounded-xl bg-emerald-50 p-3 text-sm font-semibold text-emerald-700">
                    Nothing needs your action right now.
                  </p>
                ) : (
                  needsAttention.slice(0, 6).map(({ project, reason }) => (
                    <Link
                      key={`${project.project_id}-${reason}`}
                      href={`/dean/projects/${project.group_id}`}
                      className="block rounded-xl border border-[#edf2ec] bg-white p-3 hover:bg-[#fbfdfb]"
                    >
                      <p className="text-sm font-semibold text-[#203028]">
                        {project.group_name}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {reason}
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
                {advisers.length === 0 && (
                  <p className="text-sm text-[#7b877f]">No adviser has a group yet.</p>
                )}

                {advisers.map((adviser) => {
                  const count = projects.filter((project) => project.adviser === adviser).length;

                  return (
                    <div key={adviser} className="rounded-xl bg-[#f8faf7] p-3">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-[#203028]">{adviser}</p>
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
