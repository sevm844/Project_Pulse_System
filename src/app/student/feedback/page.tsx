"use client";

import { useState } from "react";
import Link from "next/link";
import StudentShell from "../_components/StudentShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  feedbackItems as initialFeedback,
  type FeedbackItem,
  type FeedbackStatus,
} from "../_data/mockStudentData";

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState(initialFeedback);
  const [filter, setFilter] = useState<"All" | FeedbackStatus>("All");
  const [selected, setSelected] = useState<FeedbackItem | null>(null);

  const filteredFeedback =
    filter === "All"
      ? feedback
      : feedback.filter((item) => item.status === filter);

  function markAddressed() {
    if (!selected) return;

    setFeedback((current) =>
      current.map((item) =>
        item.id === selected.id ? { ...item, status: "Addressed" } : item,
      ),
    );

    setSelected(null);
  }

  return (
    <StudentShell title="Feedback">
      <div className="space-y-5">
{/* Filters */}
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Feedback
              </h2>

              <p className="mt-1 text-sm text-[#7b877f]">
                Track adviser comments from Pending to Addressed to Verified.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(["All", "Pending", "Addressed", "Verified"] as const).map(
                (item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setFilter(item)}
                    className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                      filter === item
                        ? "bg-[#202823] text-white"
                        : "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                    }`}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>
        </Card>

{/* Feedback list */}
        {filteredFeedback.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <StatusBadge status={item.status} />

                <h3 className="mt-3 text-base font-semibold text-[#203028]">
                  {item.comment}
                </h3>

                <p className="mt-2 text-sm text-[#7b877f]">
                  {item.chapter} • {item.version} • Commented by {item.by} on{" "}
                  {item.date}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(item)}
                  className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                >
                  Mark Addressed
                </button>

                <Link
                  href="/student/documents"
                  className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Open Linked Document
                </Link>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-[#f8faf7] p-4">
              <p className="text-xs font-medium text-[#7b877f]">
                Student response
              </p>

              <textarea
                placeholder="Explain what revision was made..."
                className="mt-2 min-h-20 w-full resize-none bg-transparent text-sm outline-none placeholder:text-[#a0aaa3]"
              />
            </div>
          </Card>
        ))}

{/* Address feedback modal */}
        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-semibold text-[#203028]">
                Address Feedback
              </h2>

              <p className="mt-2 text-sm text-[#59645d]">
                {selected.comment}
              </p>

              <textarea
                placeholder="Explain the revision made..."
                className="mt-5 min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] px-4 py-3 text-sm outline-none"
              />

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={markAddressed}
                  className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                >
                  Mark as Addressed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </StudentShell>
  );
}
