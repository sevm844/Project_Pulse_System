"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../_components/AdminShell";

type AuditSeverity = "Info" | "Warning" | "Critical";
type AuditAction =
  | "Login"
  | "Approve"
  | "Reject"
  | "Update"
  | "Create"
  | "Delete"
  | "Assign";
type AuditModule =
  | "All"
  | "Authentication"
  | "Users"
  | "Groups"
  | "Registration Requests"
  | "Roles"
  | "Courses"
  | "Assignments"
  | "Final Approval"
  | "System";

type AuditLog = {
  id: number;
  action: AuditAction;
  module: Exclude<AuditModule, "All">;
  actor: string;
  details: string;
  severity: AuditSeverity;
  date: string;
  time: string;
};

const ADMIN_AUDIT_LOGS_STORAGE_KEY = "project-pulse-admin-audit-logs";

const defaultLogs: AuditLog[] = [
  {
    id: 1,
    action: "Approve",
    module: "Registration Requests",
    actor: "Admin",
    details: "Approved adviser account for Anna Cruz.",
    severity: "Info",
    date: "May 14, 2026",
    time: "9:20 AM",
  },
  {
    id: 2,
    action: "Update",
    module: "Groups",
    actor: "Admin",
    details: "Updated Project Pulse adviser assignment.",
    severity: "Info",
    date: "May 14, 2026",
    time: "10:05 AM",
  },
  {
    id: 3,
    action: "Reject",
    module: "Final Approval",
    actor: "Dean Office",
    details: "Returned final submission for missing records validation.",
    severity: "Warning",
    date: "May 13, 2026",
    time: "3:45 PM",
  },
  {
    id: 4,
    action: "Login",
    module: "Authentication",
    actor: "Admin",
    details: "Admin signed in successfully.",
    severity: "Info",
    date: "May 13, 2026",
    time: "8:12 AM",
  },
  {
    id: 5,
    action: "Delete",
    module: "Courses",
    actor: "Admin",
    details: "Removed inactive course setup record.",
    severity: "Critical",
    date: "May 12, 2026",
    time: "4:30 PM",
  },
];

const moduleOptions: AuditModule[] = [
  "All",
  "Authentication",
  "Users",
  "Groups",
  "Registration Requests",
  "Roles",
  "Courses",
  "Assignments",
  "Final Approval",
  "System",
];

const severityOptions: ("All" | AuditSeverity)[] = [
  "All",
  "Info",
  "Warning",
  "Critical",
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getStoredLogs() {
  if (!canUseStorage()) return defaultLogs;

  const saved = window.localStorage.getItem(ADMIN_AUDIT_LOGS_STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(
      ADMIN_AUDIT_LOGS_STORAGE_KEY,
      JSON.stringify(defaultLogs),
    );

    return defaultLogs;
  }

  return JSON.parse(saved) as AuditLog[];
}

function saveStoredLogs(logs: AuditLog[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    ADMIN_AUDIT_LOGS_STORAGE_KEY,
    JSON.stringify(logs),
  );
}

function severityClasses(severity: AuditSeverity) {
  if (severity === "Critical") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (severity === "Warning") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function actionClasses(action: AuditAction) {
  if (action === "Delete" || action === "Reject") {
    return "bg-rose-50 text-rose-700";
  }

  if (action === "Update" || action === "Assign") {
    return "bg-blue-50 text-blue-700";
  }

  if (action === "Approve" || action === "Create") {
    return "bg-emerald-50 text-emerald-700";
  }

  return "bg-[#f8faf7] text-[#59645d]";
}

function exportCsv(logs: AuditLog[]) {
  const headers = [
    "Date",
    "Time",
    "Action",
    "Module",
    "Actor",
    "Severity",
    "Details",
  ];

  const rows = logs.map((log) => [
    log.date,
    log.time,
    log.action,
    log.module,
    log.actor,
    log.severity,
    log.details,
  ]);

  const csv = [headers, ...rows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","),
    )
    .join("\n");

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "system-audit-logs.csv";
  link.click();

  URL.revokeObjectURL(url);
}

export default function AdminAuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>(defaultLogs);
  const [searchQuery, setSearchQuery] = useState("");
  const [moduleFilter, setModuleFilter] = useState<AuditModule>("All");
  const [severityFilter, setSeverityFilter] = useState<
    "All" | AuditSeverity
  >("All");
  const [openLogId, setOpenLogId] = useState<number | null>(null);

  useEffect(() => {
    setLogs(getStoredLogs());
  }, []);

  const filteredLogs = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return logs.filter((log) => {
      const searchable = [
        log.action,
        log.module,
        log.actor,
        log.details,
        log.severity,
        log.date,
        log.time,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesModule =
        moduleFilter === "All" || log.module === moduleFilter;
      const matchesSeverity =
        severityFilter === "All" || log.severity === severityFilter;

      return matchesSearch && matchesModule && matchesSeverity;
    });
  }, [logs, moduleFilter, searchQuery, severityFilter]);

  const totalLogs = logs.length;
  const todayLogs = logs.filter((log) => log.date === "May 14, 2026").length;
  const warningLogs = logs.filter((log) => log.severity === "Warning").length;
  const criticalLogs = logs.filter((log) => log.severity === "Critical").length;
  const accountLogs = logs.filter(
    (log) => log.module === "Authentication" || log.module === "Users",
  ).length;

  function resetFilters() {
    setSearchQuery("");
    setModuleFilter("All");
    setSeverityFilter("All");
  }

  function addSampleLog() {
    const nextLog: AuditLog = {
      id: Date.now(),
      action: "Update",
      module: "System",
      actor: "Admin",
      details: "Generated a manual audit test entry.",
      severity: "Info",
      date: "May 14, 2026",
      time: new Date().toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      }),
    };

    const nextLogs = [nextLog, ...logs];
    setLogs(nextLogs);
    saveStoredLogs(nextLogs);
  }

  function clearLogs() {
    const confirmed = window.confirm(
      "Clear local audit log entries? This only clears the browser demo storage.",
    );

    if (!confirmed) return;

    setLogs([]);
    saveStoredLogs([]);
  }

  return (
    <AdminShell title="System Audit Logs">
      <div className="space-y-5">
        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-4 shadow-sm">
          <div className="flex min-w-[860px] divide-x divide-[#edf2ec]">
            {[
              ["Total Logs", totalLogs, "Recorded actions"],
              ["Today", todayLogs, "Recent activity"],
              ["Account Logs", accountLogs, "Login/user actions"],
              ["Warnings", warningLogs, "Needs review"],
              ["Critical", criticalLogs, "Sensitive actions"],
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
          <div className="flex min-w-[1080px] items-end gap-3">
            <label className="w-[360px] shrink-0 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search actor, module, details..."
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="w-[220px] shrink-0 text-xs font-semibold text-[#59645d]">
              Module
              <select
                value={moduleFilter}
                onChange={(event) =>
                  setModuleFilter(event.target.value as AuditModule)
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {moduleOptions.map((module) => (
                  <option key={module}>{module}</option>
                ))}
              </select>
            </label>

            <label className="w-[160px] shrink-0 text-xs font-semibold text-[#59645d]">
              Severity
              <select
                value={severityFilter}
                onChange={(event) =>
                  setSeverityFilter(event.target.value as "All" | AuditSeverity)
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {severityOptions.map((severity) => (
                  <option key={severity}>{severity}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="h-10 w-[100px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={() => exportCsv(filteredLogs)}
              className="h-10 w-[110px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Export CSV
            </button>

            <button
              type="button"
              onClick={addSampleLog}
              className="h-10 w-[110px] shrink-0 rounded-lg bg-[#123f2b] px-4 text-xs font-semibold text-white hover:bg-[#0f3324]"
            >
              Add Test Log
            </button>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-sm">
          <div className="flex flex-col gap-3 border-b border-[#edf2ec] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Activity History
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Track account, approval, assignment, setup, and system actions.
              </p>
            </div>

            <button
              type="button"
              onClick={clearLogs}
              className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
            >
              Clear Local Logs
            </button>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredLogs.map((log) => {
              const open = openLogId === log.id;

              return (
                <div key={log.id} className="px-5 py-4">
                  <div className="grid gap-4 xl:grid-cols-[170px_220px_1fr_170px_auto] xl:items-center">
                    <div>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${actionClasses(
                          log.action,
                        )}`}
                      >
                        {log.action}
                      </span>
                      <p className="mt-2 text-xs text-[#7b877f]">
                        {log.date} • {log.time}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {log.module}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        Actor: {log.actor}
                      </p>
                    </div>

                    <p className="text-sm leading-6 text-[#59645d]">
                      {log.details}
                    </p>

                    <div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${severityClasses(
                          log.severity,
                        )}`}
                      >
                        {log.severity}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setOpenLogId((current) =>
                          current === log.id ? null : log.id,
                        )
                      }
                      className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                    >
                      {open ? "Close" : "Open"}
                    </button>
                  </div>

                  {open && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4 md:grid-cols-4">
                      <DetailBox label="Action" value={log.action} />
                      <DetailBox label="Module" value={log.module} />
                      <DetailBox label="Actor" value={log.actor} />
                      <DetailBox
                        label="Timestamp"
                        value={`${log.date} ${log.time}`}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {filteredLogs.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No audit logs found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the search, module, or severity filters.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[11px] font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#203028]">{value}</p>
    </div>
  );
}
