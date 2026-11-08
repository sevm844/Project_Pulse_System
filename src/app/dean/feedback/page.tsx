"use client";

import { useCallback, useEffect, useState } from "react";
import DeanShell from "../_components/DeanShell";
import { apiFetch } from "../../_lib/api";
import { errorMessage } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";

type Feedback = {
  feedback_id: number;
  category: "Bug" | "Suggestion" | "Question" | "Praise";
  message: string;
  page: string | null;
  status: "New" | "Seen" | "Resolved";
  role: string;
  from: string | null;
  email: string | null;
  created_at: string | null;
};

type Summary = {
  count: number;
  average: number | null;
  rating: string | null;
  by_role: { role: string; count: number; average: number | null }[];
  comments: { role: string; score: number; comment: string; at: string | null }[];
};

const categoryClass: Record<Feedback["category"], string> = {
  Bug: "bg-rose-50 text-rose-700",
  Suggestion: "bg-sky-50 text-sky-700",
  Question: "bg-amber-50 text-amber-700",
  Praise: "bg-emerald-50 text-emerald-700",
};

const selectClass =
  "rounded-lg border border-[#dfe8df] bg-white px-3 py-1.5 text-xs text-[#59645d] outline-none focus:ring-2 focus:ring-[#d7f7d8]";

export default function DeanFeedbackPage() {
  const [items, setItems] = useState<Feedback[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const [list, sus] = await Promise.all([
        apiFetch<Feedback[]>("/feedback"),
        apiFetch<Summary>("/survey/summary"),
      ]);
      setItems(list);
      setSummary(sus);
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load the feedback."));
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

  const visible = items.filter(
    (item) => (status === "All" || item.status === status) && (category === "All" || item.category === category),
  );
  const open = items.filter((item) => item.status === "New").length;

  return (
    <DeanShell title="Feedback">
      <div className="mx-auto max-w-4xl">
        <p className="max-w-xl text-sm leading-6 text-[#7b877f]">
          What testers send with the Feedback button, and how they rate the system in the usability survey.
        </p>

        {error && (
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}

        <section className="mt-8" aria-label="Usability survey">
          <h2 className="text-sm font-semibold text-[#203028]">Usability survey (SUS)</h2>

          {summary && summary.count === 0 && <p className="mt-3 text-sm text-[#9aa59e]">Nobody has answered yet.</p>}

          {summary && summary.count > 0 && (
            <div className="mt-4 grid gap-6 sm:grid-cols-[auto_1fr]">
              <div>
                <p className="text-4xl font-semibold text-[#203028]">{summary.average}</p>
                <p className="mt-1 text-xs text-[#7b877f]">out of 100 · {summary.rating}</p>
                <p className="mt-1 text-[11px] text-[#9aa59e]">
                  {summary.count} response{summary.count === 1 ? "" : "s"}. About 68 is average.
                </p>
              </div>

              <ul className="divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec] bg-white">
                {summary.by_role.map((row) => (
                  <li key={row.role} className="flex items-center justify-between gap-4 px-4 py-2.5 text-sm">
                    <span className="text-[#203028]">{row.role}</span>
                    <span className="text-xs text-[#7b877f]">
                      {row.count} · <span className="font-semibold text-[#203028]">{row.average}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summary && summary.comments.length > 0 && (
            <ul className="mt-4 space-y-2">
              {summary.comments.map((entry, index) => (
                <li key={index} className="rounded-lg bg-[#f8faf7] px-4 py-3 text-sm text-[#59645d]">
                  “{entry.comment}”
                  <span className="mt-1 block text-[11px] text-[#9aa59e]">
                    {entry.role} · scored {entry.score}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10" aria-label="Feedback">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#edf2ec] pb-3">
            <h2 className="mr-auto text-sm font-semibold text-[#203028]">
              Feedback <span className="font-normal text-[#9aa59e]">· {open} new</span>
            </h2>
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Filter by type" className={selectClass}>
              {["All", "Bug", "Suggestion", "Question", "Praise"].map((item) => (
                <option key={item} value={item}>
                  {item === "All" ? "Any type" : item}
                </option>
              ))}
            </select>
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
              {items.length === 0 ? "No feedback yet." : "Nothing matches these filters."}
            </p>
          )}

          <ul className="divide-y divide-[#edf2ec]">
            {visible.map((item) => (
              <li key={item.feedback_id} className="py-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${categoryClass[item.category]}`}>{item.category}</span>
                    <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#203028]">{item.message}</p>
                    <p className="mt-1.5 text-[11px] text-[#9aa59e]">
                      {item.from} ({item.role}){item.page ? ` · ${item.page}` : ""}
                      {item.created_at ? ` · ${formatDate(item.created_at)}` : ""}
                    </p>
                  </div>

                  <select
                    value={item.status}
                    onChange={(event) => void setItemStatus(item, event.target.value as Feedback["status"])}
                    aria-label={`Status of feedback ${item.feedback_id}`}
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
