"use client";

import { useMemo, useState } from "react";
import CoordinatorShell from "../_components/CoordinatorShell";
import Card from "../_components/Card";
import {
  finalRequirements,
  groupFolders,
  getRequirementCounts,
} from "../_data/finalRecordsData";

const courseSections: Record<string, string[]> = {
  BSIT: ["4A", "4B", "4C", "4D"],
  BSIS: ["4A", "4B"],
  BSCS: ["4A", "4B", "4C"],
  BLIS: ["4A", "4B"],
  ACT: ["2A", "2B"],
};

const allCourses = ["All", "BSIT", "BSIS", "BSCS", "BLIS", "ACT"];

function statusClasses(status: string) {
  if (status === "Checked") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Submitted") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "Returned") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function folderStatus(folder: (typeof groupFolders)[number]) {
  const counts = getRequirementCounts(folder);

  if (counts.progress === 100) return "Complete";
  if (counts.returned > 0) return "Returned";
  if (counts.submitted > 0) return "For Checking";
  return "Incomplete";
}

function folderStatusClasses(status: string) {
  if (status === "Complete") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "For Checking") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (status === "Returned") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function CoordinatorGroupFoldersPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [openFolderId, setOpenFolderId] = useState<number | null>(
    groupFolders[0]?.id ?? null,
  );

  const sections = useMemo(() => {
    if (courseFilter === "All") {
      return [
        "All",
        ...Array.from(
          new Set(Object.values(courseSections).flat().filter(Boolean)),
        ),
      ];
    }

    return ["All", ...(courseSections[courseFilter] || [])];
  }, [courseFilter]);

  const filteredFolders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return groupFolders.filter((folder) => {
      const searchable = [
        folder.groupName,
        folder.projectTitle,
        folder.course,
        folder.section,
        folder.adviser,
      ]
        .join(" ")
        .toLowerCase();

      const status = folderStatus(folder);

      const matchesSearch = !query || searchable.includes(query);
      const matchesCourse =
        courseFilter === "All" || folder.course === courseFilter;
      const matchesSection =
        sectionFilter === "All" || folder.section === sectionFilter;
      const matchesStatus = statusFilter === "All" || status === statusFilter;

      return matchesSearch && matchesCourse && matchesSection && matchesStatus;
    });
  }, [courseFilter, searchQuery, sectionFilter, statusFilter]);

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setSectionFilter("All");
    setStatusFilter("All");
  }

  function changeCourse(nextCourse: string) {
    setCourseFilter(nextCourse);
    setSectionFilter("All");
  }

  return (
    <CoordinatorShell title="Group Folders">
      <div className="space-y-5">
        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[980px] items-end gap-3">
            <label className="min-w-[280px] flex-1 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, project, adviser..."
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="w-[170px] shrink-0 text-xs font-semibold text-[#59645d]">
              Course
              <select
                value={courseFilter}
                onChange={(event) => changeCourse(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {allCourses.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="w-[170px] shrink-0 text-xs font-semibold text-[#59645d]">
              Section
              <select
                value={sectionFilter}
                onChange={(event) => setSectionFilter(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {sections.map((section) => (
                  <option key={section}>{section}</option>
                ))}
              </select>
            </label>

            <label className="w-[190px] shrink-0 text-xs font-semibold text-[#59645d]">
              Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>Complete</option>
                <option>For Checking</option>
                <option>Incomplete</option>
                <option>Returned</option>
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="h-10 shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Final Requirement Folders
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Open a group folder to check submitted files, missing documents,
              and archive readiness.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredFolders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                No group folders match the selected filters.
              </p>
            ) : (
              filteredFolders.map((folder) => {
                const counts = getRequirementCounts(folder);
                const status = folderStatus(folder);
                const isOpen = openFolderId === folder.id;

                return (
                  <div key={folder.id}>
                    <div className="grid gap-4 px-5 py-4 lg:grid-cols-[1.2fr_1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-[#203028]">
                            {folder.groupName}
                          </p>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${folderStatusClasses(
                              status,
                            )}`}
                          >
                            {status}
                          </span>
                        </div>

                        <p className="mt-1 text-sm text-[#59645d]">
                          {folder.projectTitle}
                        </p>
                        <p className="mt-1 text-xs text-[#7b877f]">
                          {folder.course} {folder.section} • Adviser:{" "}
                          {folder.adviser} • Last submission:{" "}
                          {folder.lastSubmission}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-3">
                          <div className="h-2 flex-1 rounded-full bg-[#edf2ec]">
                            <div
                              className="h-2 rounded-full bg-[#4f8f58]"
                              style={{ width: `${counts.progress}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#203028]">
                            {counts.progress}%
                          </span>
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold">
                          <span className="rounded-full bg-[#f8faf7] px-2.5 py-1 text-[#59645d]">
                            Checked {counts.checked}/{counts.total}
                          </span>
                          <span className="rounded-full bg-[#f8faf7] px-2.5 py-1 text-[#59645d]">
                            Submitted {counts.submitted}
                          </span>
                          <span className="rounded-full bg-[#f8faf7] px-2.5 py-1 text-[#59645d]">
                            Missing {counts.missing}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenFolderId(isOpen ? null : folder.id)
                          }
                          className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                        >
                          {isOpen ? "Close" : "Open"}
                        </button>

                        <a
                          href="/coordinator/messages"
                          className="rounded-lg bg-[#202823] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                        >
                          Message
                        </a>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-[#edf2ec] bg-[#fbfdfb] px-5 py-4">
                        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                          {finalRequirements.map((requirement) => {
                            const requirementStatus =
                              folder.requirements[requirement.name];

                            return (
                              <div
                                key={requirement.id}
                                className="rounded-xl border border-[#edf2ec] bg-white p-3"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-xs font-semibold text-[#203028]">
                                      {requirement.name}
                                    </p>
                                    <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-[#7b877f]">
                                      {requirement.description}
                                    </p>
                                  </div>

                                  <span
                                    className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClasses(
                                      requirementStatus,
                                    )}`}
                                  >
                                    {requirementStatus}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </CoordinatorShell>
  );
}
