"use client";

import { useEffect, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  getStoredFeedbackItems,
  updateStoredFeedbackItem,
  type StoredFeedbackItem,
} from "../../_utils/feedbackStorage";

export default function DeanFeedbackQueuePage() {
  const [items, setItems] = useState<StoredFeedbackItem[]>([]);

  useEffect(() => {
    setItems(getStoredFeedbackItems());
  }, []);

  function markVerified(id: number) {
    const nextItems = updateStoredFeedbackItem(id, { status: "Verified" });
    setItems(nextItems);
  }

  const pendingItems = items.filter((item) => item.status !== "Verified");

  return (
    <DeanShell title="Feedback Queue">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Feedback Queue
          </h2>
          <p className="mt-2 text-sm text-[#59645d]">
            Review unresolved feedback items and verify completed student responses.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Queue Items</p>
            <p className="mt-2 text-3xl font-semibold">{pendingItems.length}</p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Pending</p>
            <p className="mt-2 text-3xl font-semibold">
              {items.filter((item) => item.status === "Pending").length}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Addressed</p>
            <p className="mt-2 text-3xl font-semibold">
              {items.filter((item) => item.status === "Addressed").length}
            </p>
          </Card>
        </div>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h3 className="text-base font-semibold text-[#203028]">
              Active Feedback
            </h3>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {pendingItems.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                No active feedback items.
              </p>
            ) : (
              pendingItems.map((item) => (
                <div key={item.id} className="grid gap-4 px-5 py-4 lg:grid-cols-[1fr_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#203028]">
                        {item.groupName}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>

                    <p className="mt-1 text-xs text-[#7b877f]">
                      {item.documentTitle} • {item.chapter} • {item.version}
                    </p>

                    <p className="mt-3 text-sm font-semibold text-[#203028]">
                      {item.comment}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-[#59645d]">
                      {item.detail}
                    </p>

                    {item.studentResponse ? (
                      <div className="mt-3 rounded-xl bg-[#eefaf0] p-3 text-sm text-[#4f8f58]">
                        Student response: {item.studentResponse}
                      </div>
                    ) : (
                      <p className="mt-3 text-xs font-semibold text-orange-600">
                        No student response yet.
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => markVerified(item.id)}
                    className="h-10 rounded-lg bg-[#202823] px-4 text-xs font-semibold text-white hover:bg-[#303a33]"
                  >
                    Mark Verified
                  </button>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </DeanShell>
  );
}