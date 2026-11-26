"use client";

import { useCallback, useEffect, useState } from "react";
import DeanShell from "../_components/DeanShell";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { downloadCsv } from "../../_lib/finalOutputs";
import { formatDate } from "../../_lib/requirements";

type Feedback = {
  feedback_id: number;
  category: string;
  message: string;
  page: string | null;
  status: "New" | "Seen" | "Resolved";
  role: string;
  from: string | null;
  email: string | null;
  created_at: string | null;
};

const selectClass =
  "rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs text-[#59645d] outline-none focus:ring-2 focus:ring-[#d7f7d8]";

const exportClass =
  "rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs font-semibold text-[#123f2b] transition hover:bg-[#f4f8f3]";

export default function DeanFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [status, setStatus] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setItems(await apiFetch<Feedback[]>("/feedback"));
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the bug reports."));
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function setItemStatus(item: Feedback, next: Feedback["status"]) {
    try {
      const updated = await apiFetch<Feedback>(`/feedback/${item.feedback_id}`, { method: "PUT", body: JSON.stringify({ status: next }) });
      setItems((current) => current.map((entry) => (entry.feedback_id === updated.feedback_id ? updated : entry)));
    } catch (err) {
      setError(errorMessage(err, "Unable to change the status."));
    }
  }

  // One row per report, whatever the filter shows, so the whole record can be kept.
  function exportFeedback() {
    downloadCsv("uat-bug-reports.csv", [
      ["Date", "Role", "Status", "Page", "Message"],
      ...items.map((item) => [item.created_at ? item.created_at.slice(0, 10) : "", item.role, item.status, item.page, item.message]),
    ]);
  }

  const visible = items.filter((item) => status === "All" || item.status === status);
  const open = items.filter((item) => item.status === "New").length;

  return (
    <DeanShell title="Feedback">
      <div className="mx-auto max-w-4xl">
        <p className="max-w-xl text-sm leading-6 text-[#7b877f]">Problems that testers report with the Feedback button.</p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        <section className="mt-8" aria-label="Bug reports">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#edf2ec] pb-3">
            <h2 className="mr-auto text-sm font-semibold text-[#203028]">
              Bug reports <span className="font-normal text-[#9aa59e]">· {open} new</span>
            </h2>
            {items.length > 0 && (
              <button type="button" onClick={exportFeedback} className={exportClass}>
                Export CSV
              </button>
            )}
            <select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Filter by status" className={selectClass}>
              {["All", "New", "Seen", "Resolved"].map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "Any status" : item}
                </option>
              ))}
            </select>
          </div>

          {loading && <p className="mt-6 text-sm text-[#7b877f]">Loading...</p>}

          {!loading && visible.length === 0 && (
            <p className="mt-10 text-center text-sm text-[#9aa59e]">
              {items.length === 0 ? "No bug reports yet." : "Nothing matches this filter."}
            </p>
          )}

          <ul className="divide-y divide-[#edf2ec]">
            {visible.map((item) => (
              <li key={item.feedback_id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="whitespace-pre-line text-sm leading-6 text-[#203028]">{item.message}</p>
                    <p className="mt-1.5 text-[11px] text-[#9aa59e]">
                      {item.from} ({item.role}){item.page ? ` · ${item.page}` : ""}
                      {item.created_at ? ` · ${formatDate(item.created_at)}` : ""}
                    </p>
                  </div>

                  <select
                    value={item.status}
                    onChange={(event) => void setItemStatus(item, event.target.value as Feedback["status"])}
                    aria-label={`Status of report ${item.feedback_id}`}
                    className={selectClass}
                  >
                    {["New", "Seen", "Resolved"].map((value) => (
                      <option key={value}>{value}</option>
                    ))}
                  </select>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </DeanShell>
  );
}
