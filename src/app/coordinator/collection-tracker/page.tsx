"use client";

import { useMemo, useState } from "react";
import CoordinatorShell from "../_components/CoordinatorShell";
import Card from "../_components/Card";
import {
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

function folderStatus(folder: (typeof groupFolders)[number]) {
  const counts = getRequirementCounts(folder);

  if (counts.progress === 100) return "Complete";
  if (counts.returned > 0) return "Returned";
  if (counts.submitted > 0) return "For Checking";
  return "Incomplete";
}

function statusClasses(status: string) {
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

function urgencyLabel(folder: (typeof groupFolders)[number]) {
  const counts = getRequirementCounts(folder);

  if (counts.returned > 0) return "Replace returned files";
  if (counts.missing >= 3) return "High follow-up";
  if (counts.submitted > 0) return "Check submitted files";
  if (counts.progress === 100) return "Ready for archive";
  return "Follow-up";
}

function urgencyClasses(label: string) {
  if (label === "Ready for archive") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (label === "Check submitted files") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  if (label === "Replace returned files") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

export default function CoordinatorCollectionTrackerPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

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

  const totals = filteredFolders.reduce(
    (summary, folder) => {
      const counts = getRequirementCounts(folder);

      return {
        checked: summary.checked + counts.checked,
        submitted: summary.submitted + counts.submitted,
        missing: summary.missing + counts.missing,
        returned: summary.returned + counts.returned,
        complete: summary.complete + (counts.progress === 100 ? 1 : 0),
        totalGroups: summary.totalGroups + 1,
      };
    },
    {
      checked: 0,
      submitted: 0,
      missing: 0,
      returned: 0,
      complete: 0,
      totalGroups: 0,
    },
  );

  const priorityFolders = [...filteredFolders].sort((left, right) => {
    const leftCounts = getRequirementCounts(left);
    const rightCounts = getRequirementCounts(right);

    return (
      rightCounts.returned - leftCounts.returned ||
      rightCounts.missing - leftCounts.missing ||
      rightCounts.submitted - leftCounts.submitted
    );
  });

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
    <CoordinatorShell title="Collection Tracker">
      <div className="space-y-5">
        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[860px] divide-x divide-[#dfe8df]">
            {[
              ["Groups", totals.totalGroups, "Filtered folders"],
              ["Complete", totals.complete, "Ready archive"],
              ["Submitted", totals.submitted, "Need checking"],
              ["Missing", totals.missing, "Need follow-up"],
              ["Returned", totals.returned, "Need replacement"],
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

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_360px]">
          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#203028]">
                Follow-up Priority
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Groups are ordered by returned files, missing files, then
                submitted files waiting for checking.
              </p>
            </div>

            <div className="divide-y divide-[#edf2ec]">
              {priorityFolders.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                  No groups match the selected filters.
                </p>
              ) : (
                priorityFolders.map((folder) => {
                  const counts = getRequirementCounts(folder);
                  const urgency = urgencyLabel(folder);

                  return (
                    <div key={folder.id} className="px-5 py-4">
                      <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-[#203028]">
                              {folder.groupName}
                            </p>
                            <span
                              className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${urgencyClasses(
                                urgency,
                              )}`}
                            >
                              {urgency}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-[#59645d]">
                            {folder.projectTitle}
                          </p>
                          <p className="mt-1 text-xs text-[#7b877f]">
                            {folder.course} {folder.section} • Adviser:{" "}
                            {folder.adviser}
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

                          <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#59645d]">
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Checked {counts.checked}/{counts.total}
                            </span>
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Submitted {counts.submitted}
                            </span>
                            <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                              Missing {counts.missing}
                            </span>
                          </div>
                        </div>

                        <div className="flex gap-2 lg:justify-end">
                          <a
                            href="/coordinator/group-folders"
                            className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                          >
                            Open
                          </a>

                          <a
                            href="/coordinator/messages"
                            className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
                          >
                            Message
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <Card className="p-5">
            <h2 className="text-lg font-semibold text-[#203028]">
              Collection Pipeline
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Current status of filtered group folders.
            </p>

            <div className="mt-5 space-y-3">
              {[
                ["Missing Files", totals.missing, "Ask students to upload files"],
                ["Submitted Files", totals.submitted, "Check and mark accepted"],
                ["Returned Files", totals.returned, "Needs replacement"],
                ["Archive Ready", totals.complete, "Move to archive records"],
              ].map(([label, value, caption]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {label}
                      </p>
                      <p className="mt-1 text-xs text-[#59645d]">{caption}</p>
                    </div>
                    <p className="text-2xl font-semibold text-[#203028]">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Tracker Table
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Compact tracking view for all filtered folders.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Checked</th>
                  <th className="px-5 py-3 font-medium">Submitted</th>
                  <th className="px-5 py-3 font-medium">Missing</th>
                  <th className="px-5 py-3 font-medium">Last Submission</th>
                  <th className="px-5 py-3 font-medium">Last Message</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredFolders.map((folder) => {
                  const counts = getRequirementCounts(folder);
                  const status = folderStatus(folder);

                  return (
                    <tr key={folder.id} className="hover:bg-[#fbfdfb]">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#203028]">
                          {folder.groupName}
                        </p>
                        <p className="mt-1 text-xs text-[#59645d]">
                          {folder.projectTitle}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {folder.course} {folder.section}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                            status,
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {counts.checked}/{counts.total}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {counts.submitted}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {counts.missing}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {folder.lastSubmission}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {folder.lastMessage}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </CoordinatorShell>
  );
}
