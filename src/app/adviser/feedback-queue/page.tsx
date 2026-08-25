"use client";

import { useEffect, useMemo, useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  getStoredFeedbackItems,
  updateStoredFeedbackItem,
  type StoredFeedbackItem,
  type StoredFeedbackStatus,
} from "../../_utils/feedbackStorage";

export default function FeedbackQueuePage() {
  const [filter, setFilter] = useState<"All" | StoredFeedbackStatus>("All");
  const [feedbackItems, setFeedbackItems] = useState<StoredFeedbackItem[]>([]);

  useEffect(() => {
    queueMicrotask(() => setFeedbackItems(getStoredFeedbackItems()));
  }, []);

  const filteredItems = useMemo(() => {
    return filter === "All"
      ? feedbackItems
      : feedbackItems.filter((item) => item.status === filter);
  }, [feedbackItems, filter]);

  function updateStatus(id: number, status: StoredFeedbackStatus) {
    setFeedbackItems(updateStoredFeedbackItem(id, { status }));
  }

  return (
    <AdviserShell title="Feedback Queue">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Feedback Filters
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Track pending feedback, student revision responses, and verified
                corrections.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Pending", "Addressed", "Verified"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item as "All" | StoredFeedbackStatus)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                    filter === item
                      ? "bg-[#123f2b] text-white"
                      : "border border-[#dfe8df] bg-white hover:bg-[#f3f7f1]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-4">
          {filteredItems.map((item) => (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <StatusBadge status={item.status} />

                  <h3 className="mt-3 text-base font-semibold text-[#203028]">
                    {item.comment}
                  </h3>

                  <p className="mt-2 text-sm text-[#7b877f]">
                    {item.groupName} • {item.documentTitle} • {item.version}
                  </p>

                  <p className="mt-1 text-xs text-[#7b877f]">
                    {item.course} {item.section} • {item.chapter} • Commented
                    by {item.adviserName} on {item.date}
                  </p>

                  <div className="mt-4 rounded-xl bg-[#f8faf7] p-4">
                    <p className="text-xs font-semibold text-[#203028]">
                      Student Revision Response
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#59645d]">
                      {item.studentResponse ||
                        "No student revision response submitted yet."}
                    </p>
                  </div>
                </div>

                <div className="flex min-w-[220px] flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, "Verified")}
                    disabled={item.status !== "Addressed"}
                    className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Verify Correction
                  </button>

                  <button
                    type="button"
                    onClick={() => updateStatus(item.id, "Pending")}
                    disabled={item.status === "Verified"}
                    className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Return for Revision
                  </button>
                </div>
              </div>
            </Card>
          ))}

          {filteredItems.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm text-[#7b877f]">
                No feedback items found for this filter.
              </p>
            </Card>
          )}
        </div>
      </div>
    </AdviserShell>
  );
}
