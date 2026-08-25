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

function archiveId(id: number) {
  return `ARC-${String(id).padStart(4, "0")}`;
}

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

export default function CoordinatorArchiveRecordsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [openRecordId, setOpenRecordId] = useState<number | null>(null);

  const completedFolders = useMemo(() => {
    return groupFolders.filter(
      (folder) => getRequirementCounts(folder).progress === 100,
    );
  }, []);

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

  const filteredRecords = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return completedFolders.filter((folder) => {
      const searchable = [
        folder.groupName,
        folder.projectTitle,
        folder.course,
        folder.section,
        folder.adviser,
        archiveId(folder.id),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCourse =
        courseFilter === "All" || folder.course === courseFilter;
      const matchesSection =
        sectionFilter === "All" || folder.section === sectionFilter;

      return matchesSearch && matchesCourse && matchesSection;
    });
  }, [completedFolders, courseFilter, searchQuery, sectionFilter]);

  const totalRequirements = completedFolders.reduce((sum, folder) => {
    return sum + getRequirementCounts(folder).checked;
  }, 0);

  function changeCourse(nextCourse: string) {
    setCourseFilter(nextCourse);
    setSectionFilter("All");
  }

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setSectionFilter("All");
  }

  return (
    <CoordinatorShell title="Archive Records">
      <div className="space-y-5">
        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[760px] divide-x divide-[#dfe8df]">
            {[
              ["Archived Folders", completedFolders.length, "Complete groups"],
              ["Visible Records", filteredRecords.length, "After filters"],
              ["Archived Files", totalRequirements, "Checked requirements"],
              ["Archive Status", "Ready", "For records turnover"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-xs font-semibold text-[#7b877f]">{label}</p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-2xl font-semibold text-[#203028]">
                    {value}
                  </p>
                  <p className="pb-1 text-xs text-[#59645d]">{caption}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[820px] items-end gap-3">
            <label className="min-w-[280px] flex-1 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search archive ID, group, project, adviser..."
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
              Archive Registry
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Completed final folders ready for records turnover and long-term
              archive.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredRecords.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                No completed archive records match the selected filters.
              </p>
            ) : (
              filteredRecords.map((folder) => {
                const counts = getRequirementCounts(folder);
                const isOpen = openRecordId === folder.id;

                return (
                  <div key={folder.id}>
                    <div className="grid gap-4 px-5 py-4 lg:grid-cols-[160px_1.2fr_1fr_auto] lg:items-center">
                      <div>
                        <p className="text-xs font-semibold text-[#7b877f]">
                          Archive ID
                        </p>
                        <p className="mt-1 text-sm font-semibold text-[#203028]">
                          {archiveId(folder.id)}
                        </p>
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-[#203028]">
                          {folder.groupName}
                        </p>
                        <p className="mt-1 text-sm text-[#59645d]">
                          {folder.projectTitle}
                        </p>
                        <p className="mt-1 text-xs text-[#7b877f]">
                          {folder.course} {folder.section} • Adviser:{" "}
                          {folder.adviser}
                        </p>
                      </div>

                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                            Ready for Archive
                          </span>
                          <span className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-2.5 py-1 text-[11px] font-semibold text-[#59645d]">
                            {counts.checked}/{counts.total} files checked
                          </span>
                        </div>
                        <p className="mt-2 text-xs text-[#7b877f]">
                          Last submission: {folder.lastSubmission}
                        </p>
                      </div>

                      <div className="flex gap-2 lg:justify-end">
                        <button
                          type="button"
                          onClick={() =>
                            setOpenRecordId(isOpen ? null : folder.id)
                          }
                          className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                        >
                          {isOpen ? "Close" : "Open"}
                        </button>

                        <a
                          href="/coordinator/messages"
                          className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
                        >
                          Message
                        </a>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="border-t border-[#edf2ec] bg-[#fbfdfb] px-5 py-4">
                        <div className="mb-4 grid gap-3 md:grid-cols-3">
                          <div className="rounded-xl border border-[#edf2ec] bg-white p-4">
                            <p className="text-xs font-semibold text-[#7b877f]">
                              Archive Package
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#203028]">
                              Final Requirements
                            </p>
                          </div>

                          <div className="rounded-xl border border-[#edf2ec] bg-white p-4">
                            <p className="text-xs font-semibold text-[#7b877f]">
                              Turnover Status
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#203028]">
                              Ready for Records
                            </p>
                          </div>

                          <div className="rounded-xl border border-[#edf2ec] bg-white p-4">
                            <p className="text-xs font-semibold text-[#7b877f]">
                              Retention
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#203028]">
                              Department Archive
                            </p>
                          </div>
                        </div>

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
