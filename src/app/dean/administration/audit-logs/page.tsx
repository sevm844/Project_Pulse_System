"use client";

import { useCallback, useEffect, useState } from "react";
import DeanShell from "../../_components/DeanShell";
import Card from "../../_components/Card";
import { apiFetch } from "../../../_lib/api";

type AuditLog = {
  audit_id: number;
  actor_name: string;
  actor_role: string | null;
  action: string;
  module: string;
  severity: "Info" | "Warning" | "Critical";
  details: string;
  created_at: string;
};

type AuditPage = { has_more: boolean; items: AuditLog[] };

const MODULES = ["Authentication", "Users", "Groups", "Titles", "Requirements", "Defenses", "Archive", "Messaging"];
const ACTIONS = ["Login", "Create", "Update", "Approve", "Reject", "Assign", "Delete", "Archive", "Restore"];

const severityDot: Record<AuditLog["severity"], string> = {
  Info: "bg-sky-400",
  Warning: "bg-amber-400",
  Critical: "bg-rose-500",
};

const selectClass =
  "h-10 rounded-full border border-[#dfe8df] bg-white px-4 text-xs font-semibold text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]";

function formatWhen(value: string) {
  return new Date(value).toLocaleString("en-PH", {
    timeZone: "Asia/Manila",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [severity, setSeverity] = useState("");

  // Waits for a pause in typing before asking the server.
  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(search.trim()), 350);

    return () => window.clearTimeout(timer);
  }, [search]);

  const load = useCallback(
    (before?: number) => {
      const params = new URLSearchParams();
      if (query) params.set("search", query);
      if (module) params.set("module", module);
      if (action) params.set("action", action);
      if (severity) params.set("severity", severity);
      if (before) params.set("before", String(before));

      return apiFetch<AuditPage>(`/audit-logs?${params.toString()}`);
    },
    [query, module, action, severity],
  );

  useEffect(() => {
    let cancelled = false;

    load()
      .then((page) => {
        if (cancelled) return;
        setLogs(page.items);
        setHasMore(page.has_more);
        setError("");
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not load the audit log.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [load]);

  function loadMore() {
    const last = logs[logs.length - 1];
    if (!last) return;

    load(last.audit_id)
      .then((page) => {
        setLogs((current) => [...current, ...page.items]);
        setHasMore(page.has_more);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not load more."));
  }

  return (
    <DeanShell title="Audit Logs">
      <Card className="p-5">
        <div>
          <h2 className="text-lg font-semibold text-[#203028]">Audit Logs</h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            A permanent record of important actions. Logs cannot be edited or deleted.
          </p>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search by person or details..."
            className="h-10 min-w-60 flex-1 rounded-full border border-[#dfe8df] bg-[#f8faf7] px-4 text-sm outline-none placeholder:text-[#a0aaa3] focus:ring-2 focus:ring-[#d7f7d8]"
          />
          <select value={module} onChange={(e) => setModule(e.target.value)} className={selectClass} aria-label="Module">
            <option value="">All modules</option>
            {MODULES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={action} onChange={(e) => setAction(e.target.value)} className={selectClass} aria-label="Action">
            <option value="">All actions</option>
            {ACTIONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select value={severity} onChange={(e) => setSeverity(e.target.value)} className={selectClass} aria-label="Severity">
            <option value="">Any severity</option>
            <option>Info</option>
            <option>Warning</option>
            <option>Critical</option>
          </select>
        </div>

        {error && (
          <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        )}

        <div className="mt-5 divide-y divide-[#edf2ec]">
          {loading ? (
            <p className="py-8 text-center text-sm text-[#7b877f]">Loading...</p>
          ) : logs.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#7b877f]">No activity matches these filters.</p>
          ) : (
            logs.map((log) => (
              <div key={log.audit_id} className="flex items-start gap-3 py-3">
                <span
                  className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${severityDot[log.severity]}`}
                  title={log.severity}
                />
                <div className="min-w-0 flex-1">
                  <p className="break-words text-sm text-[#203028]">{log.details}</p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    {log.actor_name}
                    {log.actor_role ? ` (${log.actor_role})` : ""} · {log.module} · {log.action}
                  </p>
                </div>
                <p className="shrink-0 text-xs text-[#9ba69d]">{formatWhen(log.created_at)}</p>
              </div>
            ))
          )}
        </div>

        {hasMore && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={loadMore}
              className="rounded-full border border-[#dfe8df] bg-white px-5 py-2.5 text-xs font-semibold text-[#59645d] hover:bg-[#f3f7f1]"
            >
              Load older activity
            </button>
          </div>
        )}
      </Card>
    </DeanShell>
  );
}
