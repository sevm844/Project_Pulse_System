"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  assignedGroups,
  courses,
  sections,
  type CourseCode,
  type GroupStage,
} from "../_data/mockAdviserData";

const stages: GroupStage[] = [
  "Proposal Review",
  "Alpha Defense",
  "Beta Defense",
  "Final Defense",
];

export default function AssignedGroupsPage() {
  const [course, setCourse] = useState<"All" | CourseCode>("All");
  const [section, setSection] = useState("All");
  const [stage, setStage] = useState<"All" | GroupStage>("All");

  const filteredGroups = useMemo(() => {
    return assignedGroups.filter((group) => {
      const matchesCourse = course === "All" || group.course === course;
      const matchesSection = section === "All" || group.section === section;
      const matchesStage = stage === "All" || group.stage === stage;

      return matchesCourse && matchesSection && matchesStage;
    });
  }, [course, section, stage]);

  return (
    <AdviserShell title="Assigned Groups">
      <div className="space-y-5">
        {/* Filters */}
        <Card className="p-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Course
              </label>
              <select
                value={course}
                onChange={(e) => setCourse(e.target.value as "All" | CourseCode)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {courses.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Section
              </label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {sections.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#7b877f]">
                Stage
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value as "All" | GroupStage)}
                className="mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {stages.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        {/* Groups table */}
        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] p-5">
            <h2 className="text-lg font-semibold text-[#203028]">
              Assigned Groups
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Adviser view is filtered by assigned course, section, stage, and
              academic period.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Section</th>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Project Title</th>
                  <th className="px-5 py-3 font-medium">Stage</th>
                  <th className="px-5 py-3 font-medium">Last Submission</th>
                  <th className="px-5 py-3 font-medium">Progress</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {filteredGroups.map((group) => (
                  <tr key={group.id} className="hover:bg-[#fbfdfb]">
                    <td className="px-5 py-4 font-medium text-[#203028]">
                      {group.course}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.section}
                    </td>
                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {group.groupName}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.projectTitle}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.stage}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {group.lastSubmission}
                    </td>
                    <td className="px-5 py-4">
                      <div className="h-2 w-32 rounded-full bg-[#edf2ec]">
                        <div
                          className="h-2 rounded-full bg-[#94d29a]"
                          style={{ width: `${group.progress}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {group.progress}%
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={group.status} />
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <Link
                          href="/adviser/reviews"
                          className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Open Latest
                        </Link>
                        <Link
                          href="/adviser/messages"
                          className="rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Chat
                        </Link>
                        <Link
                          href="/adviser/defense"
                          className="rounded-lg bg-[#202823] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                        >
                          Endorse / Hold
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredGroups.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-5 py-8 text-center text-sm text-[#7b877f]"
                    >
                      No assigned groups found for the selected filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdviserShell>
  );
}
