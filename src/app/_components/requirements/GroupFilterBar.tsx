"use client";

import { COURSE_OPTIONS } from "../../_lib/groups";

export type GroupFilter = { course: string; section: string; status: string; search: string };

export const NO_GROUP_FILTER: GroupFilter = { course: "All", section: "All", status: "All", search: "" };

const selectClass = "mt-1 block w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs font-normal text-[#203028] outline-none focus:border-[#2f6b3c]";

export function filterIsOn(filter: GroupFilter) {
  return filter.course !== "All" || filter.section !== "All" || filter.status !== "All" || filter.search.trim() !== "";
}

// The words of one group (course, section, status, name) that the filter looks at.
export type GroupFacts = { name: string; course: string; section: string; status: string };

export function matchesGroupFilter(facts: GroupFacts, filter: GroupFilter) {
  const words = filter.search.trim().toLowerCase();

  return (
    (filter.course === "All" || facts.course === filter.course) &&
    (filter.section === "All" || facts.section === filter.section) &&
    (filter.status === "All" || facts.status === filter.status) &&
    (!words || facts.name.toLowerCase().includes(words))
  );
}

// One filter row above a list of groups: course, section, status and a group-name search.
// The choices only list what exists in `groups`; the section list follows the chosen course.
export default function GroupFilterBar({
  groups,
  filter,
  onChange,
  shown,
  compact = false,
}: {
  groups: GroupFacts[];
  filter: GroupFilter;
  onChange: (filter: GroupFilter) => void;
  shown: number;
  // Course and section are already chosen higher up the page, so only status and name are offered.
  compact?: boolean;
}) {
  // Every course of the department is always offered, even before a group of it exists.
  const courses = COURSE_OPTIONS;
  const sections = [...new Set(groups.filter((item) => filter.course === "All" || item.course === filter.course).map((item) => item.section))].sort();
  const statuses = [...new Set(groups.map((item) => item.status))];

  return (
    <div className="flex flex-wrap items-end gap-3 border-b border-[#edf2ec] px-4 py-3">
      {!compact && (
        <>
      <label className="min-w-[110px] flex-1 text-[11px] font-semibold text-[#7b877f]">
        Course
        <select value={filter.course} onChange={(event) => onChange({ ...filter, course: event.target.value, section: "All" })} className={selectClass}>
          <option value="All">All</option>
          {courses.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="min-w-[110px] flex-1 text-[11px] font-semibold text-[#7b877f]">
        Section
        <select value={filter.section} onChange={(event) => onChange({ ...filter, section: event.target.value })} className={selectClass}>
          <option value="All">All</option>
          {sections.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
        </>
      )}
      <label className="min-w-[130px] flex-1 text-[11px] font-semibold text-[#7b877f]">
        Status
        <select value={filter.status} onChange={(event) => onChange({ ...filter, status: event.target.value })} className={selectClass}>
          <option value="All">All</option>
          {statuses.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <label className="min-w-[160px] flex-[2] text-[11px] font-semibold text-[#7b877f]">
        Group
        <input type="search" value={filter.search} onChange={(event) => onChange({ ...filter, search: event.target.value })} placeholder="Search group name" className={selectClass} />
      </label>
      <p className="pb-2 text-[11px] text-[#9aa59e]">
        {shown} of {groups.length} groups
        {filterIsOn(filter) && (
          <>
            {" · "}
            <button type="button" onClick={() => onChange(NO_GROUP_FILTER)} className="font-semibold text-[#4f8f58] hover:underline">Clear filters</button>
          </>
        )}
      </p>
    </div>
  );
}
