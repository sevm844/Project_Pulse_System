"use client";

import { useMemo, useState } from "react";
import DeanShell from "../../_components/DeanShell";

type RoleStatus = "Active" | "Restricted";
type RoleGroup = "All" | "Academic" | "Review" | "System";

type Role = {
  name: string;
  group: Exclude<RoleGroup, "All">;
  description: string;
  users: number;
  status: RoleStatus;
  permissions: string[];
};

const roles: Role[] = [
  {
    name: "Student",
    group: "Academic",
    description: "Works on documents, feedback, defense readiness, and group tasks.",
    users: 86,
    status: "Active",
    permissions: ["Documents", "Feedback", "Tasks", "Defense", "Profile"],
  },
  {
    name: "Adviser",
    group: "Review",
    description: "Reviews assigned groups, feedback, defense setup, and submissions.",
    users: 8,
    status: "Active",
    permissions: ["Assigned Groups", "Reviews", "Feedback", "Defense", "Messages"],
  },
  {
    name: "Coordinator",
    group: "Academic",
    description: "Manages schedules, defense routing, groups, and document flow.",
    users: 3,
    status: "Active",
    permissions: ["Groups", "Schedule", "Defense", "Reviews", "Reports"],
  },
  {
    name: "Grammarian",
    group: "Review",
    description: "Reviews grammar certificate requests and validates documents.",
    users: 2,
    status: "Active",
    permissions: ["Certificate Requests", "Grammar Review", "Notifications"],
  },
  {
    name: "Records",
    group: "Review",
    description: "Validates records clearance and final submission requirements.",
    users: 2,
    status: "Active",
    permissions: ["Records Validation", "Final Submissions", "Notifications"],
  },
  {
    name: "Dean",
    group: "System",
    description: "Monitors projects, defense outcomes, and final approvals, and manages system administration.",
    users: 1,
    status: "Active",
    permissions: [
      "Projects",
      "Defense",
      "Final Approvals",
      "Reports",
      "Users",
      "Groups",
      "Roles",
      "Courses",
      "Assignments",
      "Audit Logs",
      "System Setup",
    ],
  },
];

const roleGroups: RoleGroup[] = ["All", "Academic", "Review", "System"];

function statusClasses(status: RoleStatus) {
  if (status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function groupClasses(group: Role["group"]) {
  if (group === "System") return "bg-[#eefaf0] text-[#4f8f58]";
  if (group === "Review") return "bg-blue-50 text-blue-700";
  return "bg-[#f8faf7] text-[#59645d]";
}

export default function DeanRolesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<RoleGroup>("All");

  const filteredRoles = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return roles.filter((role) => {
      const searchable = [
        role.name,
        role.group,
        role.description,
        role.permissions.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesGroup = groupFilter === "All" || role.group === groupFilter;

      return matchesSearch && matchesGroup;
    });
  }, [groupFilter, searchQuery]);

  const totalRoles = roles.length;
  const systemRoles = roles.filter((role) => role.group === "System").length;
  const reviewRoles = roles.filter((role) => role.group === "Review").length;
  const totalUsers = roles.reduce((sum, role) => sum + role.users, 0);

  return (
    <DeanShell title="Roles & Permissions">
      <div className="space-y-5">
        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-4 shadow-sm">
          <div className="flex min-w-[760px] divide-x divide-[#edf2ec]">
            {[
              ["Total Roles", totalRoles, "Configured access levels"],
              ["System Roles", systemRoles, "Dean administration access"],
              ["Reviewer Roles", reviewRoles, "Approval and review work"],
              ["Linked Users", totalUsers, "Accounts using roles"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#7b877f]">
                  {label}
                </p>
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
        </section>

        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-3 shadow-sm">
          <div className="flex min-w-[760px] items-end gap-3">
            <label className="w-[420px] shrink-0 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search role or permission..."
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="w-[190px] shrink-0 text-xs font-semibold text-[#59645d]">
              Role Group
              <select
                value={groupFilter}
                onChange={(event) => setGroupFilter(event.target.value as RoleGroup)}
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {roleGroups.map((group) => (
                  <option key={group}>{group}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setGroupFilter("All");
              }}
              className="h-10 w-[130px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-[#dfe8df] bg-white shadow-sm">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Role Access Matrix
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              View each role, account count, and allowed modules.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredRoles.map((role) => (
              <div
                key={role.name}
                className="grid gap-4 px-5 py-4 xl:grid-cols-[220px_1fr_140px] xl:items-center"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-base font-semibold text-[#203028]">
                      {role.name}
                    </p>
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${groupClasses(
                        role.group,
                      )}`}
                    >
                      {role.group}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {role.users} linked user{role.users === 1 ? "" : "s"}
                  </p>
                </div>

                <div>
                  <p className="text-sm leading-6 text-[#59645d]">
                    {role.description}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {role.permissions.map((permission) => (
                      <span
                        key={permission}
                        className="rounded-full border border-[#dfe8df] bg-[#fbfdfb] px-2.5 py-1 text-[11px] font-semibold text-[#59645d]"
                      >
                        {permission}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex xl:justify-end">
                  <span
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                      role.status,
                    )}`}
                  >
                    {role.status}
                  </span>
                </div>
              </div>
            ))}

            {filteredRoles.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No roles found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the search or role group filter.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </DeanShell>
  );
}
