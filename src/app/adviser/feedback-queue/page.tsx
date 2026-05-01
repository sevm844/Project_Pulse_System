"use client";

import { useState } from "react";
import AdviserShell from "../_components/AdviserShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import { reviewQueue } from "../_data/mockAdviserData";

export default function FeedbackQueuePage() {
  const [filter, setFilter] = useState("All");

  const feedbackItems = reviewQueue.flatMap((review) =>
    review.comments.map((comment, index) => ({
      id: `${review.id}-${index}`,
      groupName: review.groupName,
      documentTitle: review.documentTitle,
      version: review.version,
      comment,
      status: review.status === "Approved" ? "Verified" : "Pending",
    })),
  );

  const filteredItems =
    filter === "All"
      ? feedbackItems
      : feedbackItems.filter((item) => item.status === filter);

  return (
    <AdviserShell title="Feedback Queue">
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Feedback Queue
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Track feedback items that students still need to address.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {["All", "Pending", "Verified"].map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold ${
                    filter === item
                      ? "bg-[#202823] text-white"
                      : "border border-[#dfe8df] bg-white hover:bg-[#f3f7f1]"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </Card>

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
              </div>

              <button
                type="button"
                className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
              >
                Open Linked Submission
              </button>
            </div>
          </Card>
        ))}
      </div>
    </AdviserShell>
  );
}
