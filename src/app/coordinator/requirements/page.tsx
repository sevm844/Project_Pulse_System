"use client";

import { useMemo, useState } from "react";
import CoordinatorShell from "../_components/CoordinatorShell";
import Card from "../_components/Card";
import {
  finalRequirements,
  groupFolders,
  getRequirementCounts,
} from "../_data/finalRecordsData";

const requirementDetails: Record<
  string,
  {
    owner: string;
    fileType: string;
    required: string;
  }
> = {
  "Final Manuscript": {
    owner: "Coordinator",
    fileType: "PDF / DOCX",
    required: "Required",
  },
  "Working System": {
    owner: "Coordinator",
    fileType: "ZIP / Link",
    required: "Required",
  },
  "Softcopy Poster": {
    owner: "Coordinator",
    fileType: "PDF / PNG",
    required: "Required",
  },
  "Grammarian Certificate": {
    owner: "Grammarian",
    fileType: "PDF",
    required: "Required",
  },
  "Government ID": {
    owner: "Coordinator",
    fileType: "PDF / Image",
    required: "Required",
  },
  "Student ID": {
    owner: "Coordinator",
    fileType: "PDF / Image",
    required: "Required",
  },
  "User Manual": {
    owner: "Coordinator",
    fileType: "PDF / DOCX",
    required: "Required",
  },
  "Journal IMRAD": {
    owner: "Coordinator",
    fileType: "PDF / DOCX",
    required: "Required",
  },
  Diploma: {
    owner: "Records",
    fileType: "PDF / Image",
    required: "If required",
  },
  TOR: {
    owner: "Records",
    fileType: "PDF / Image",
    required: "If required",
  },
};

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

function uniqueValues(values: string[]) {
  return ["All", ...Array.from(new Set(values.filter(Boolean)))];
}

function getFolderStatus(folder: (typeof groupFolders)[number]) {
  const counts = getRequirementCounts(folder);

  if (counts.progress === 100) return "Complete";
  if (counts.returned > 0) return "Returned";
  if (counts.submitted > 0) return "For Checking";
  return "Incomplete";
}

export default function CoordinatorRequirementsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [sectionFilter, setSectionFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");

  const courses = useMemo(
    () => uniqueValues(groupFolders.map((folder) => folder.course)),
    [],
  );

  const sections = useMemo(
    () => uniqueValues(groupFolders.map((folder) => folder.section)),
    [],
  );

  const filteredFolders = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return groupFolders.filter((folder) => {
      const searchable = [
        folder.groupName,
        folder.course,
        folder.section,
        folder.adviser,
        folder.projectTitle,
      ]
        .join(" ")
        .toLowerCase();

      const status = getFolderStatus(folder);

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
        total: summary.total + counts.total,
      };
    },
    { checked: 0, submitted: 0, missing: 0, returned: 0, total: 0 },
  );

  const completionRate =
    totals.total === 0 ? 0 : Math.round((totals.checked / totals.total) * 100);

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setSectionFilter("All");
    setStatusFilter("All");
  }

  return (
    <CoordinatorShell title="Requirements">
      <div className="space-y-5">
        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[860px] divide-x divide-[#dfe8df]">
            {[
              ["Total Items", totals.total, "Filtered group folders"],
              ["Checked", totals.checked, "Accepted files"],
              ["Submitted", totals.submitted, "Waiting check"],
              ["Missing", totals.missing, "Need follow-up"],
              ["Returned", totals.returned, "Need replacement"],
              ["Completion", `${completionRate}%`, "Overall checked"],
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
                onChange={(event) => setCourseFilter(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {courses.map((course) => (
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
          <div className="flex flex-col gap-3 border-b border-[#edf2ec] px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Final Requirement Checklist
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Official files collected after dean approval before final
                records archiving.
              </p>
            </div>

            <span className="rounded-full border border-[#dfe8df] bg-[#f8faf7] px-3 py-1 text-xs font-semibold text-[#59645d]">
              {finalRequirements.length} requirement types
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Requirement</th>
                  <th className="px-5 py-3 font-medium">Purpose</th>
                  <th className="px-5 py-3 font-medium">Checker</th>
                  <th className="px-5 py-3 font-medium">Accepted Type</th>
                  <th className="px-5 py-3 font-medium">Rule</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {finalRequirements.map((requirement) => {
                  const detail = requirementDetails[requirement.name] || {
                    owner: "Coordinator",
                    fileType: "PDF",
                    required: "Required",
                  };

                  return (
                    <tr key={requirement.id} className="hover:bg-[#fbfdfb]">
                      <td className="px-5 py-4 font-semibold text-[#203028]">
                        {requirement.name}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {requirement.description}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {detail.owner}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {detail.fileType}
                      </td>
                      <td className="px-5 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                            detail.required === "Required"
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-amber-200 bg-amber-50 text-amber-700"
                          }`}
                        >
                          {detail.required}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Group Requirement Status
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              {filteredFolders.length} group
              {filteredFolders.length === 1 ? "" : "s"} found.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredFolders.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                No groups match the selected filters.
              </p>
            ) : (
              filteredFolders.map((folder) => {
                const counts = getRequirementCounts(folder);

                return (
                  <div key={folder.id} className="px-5 py-4">
                    <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_auto] lg:items-center">
                      <div>
                        <p className="text-sm font-semibold text-[#203028]">
                          {folder.groupName}
                        </p>
                        <p className="mt-1 text-xs text-[#59645d]">
                          {folder.course} {folder.section} •{" "}
                          {folder.projectTitle}
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

                        <div className="mt-3 flex flex-wrap gap-2">
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              "Checked",
                            )}`}
                          >
                            Checked {counts.checked}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              "Submitted",
                            )}`}
                          >
                            Submitted {counts.submitted}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              "Missing",
                            )}`}
                          >
                            Missing {counts.missing}
                          </span>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              "Returned",
                            )}`}
                          >
                            Returned {counts.returned}
                          </span>
                        </div>
                      </div>

                      <div className="flex gap-2 lg:justify-end">
                        <a
                          href="/coordinator/group-folders"
                          className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                        >
                          Open Folder
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
      </div>
    </CoordinatorShell>
  );
}
