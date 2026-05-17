"use client";

import { useMemo, useState } from "react";
import GrammarianShell from "../_components/GrammarianShell";
import Card from "../_components/Card";
import { grammarReviews } from "../_data/grammarianData";

function statusClasses(status: string) {
  if (status === "Reviewed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "For Grammar Review") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

function certificateClasses(status: string) {
  if (status === "Issued") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
}

export default function GrammarianReviewQueuePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return grammarReviews.filter((item) => {
      const searchable = [
        item.groupName,
        item.projectTitle,
        item.course,
        item.section,
        item.documentTitle,
        item.reviewStatus,
        item.adviser,
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!query || searchable.includes(query)) &&
        (statusFilter === "All" || item.reviewStatus === statusFilter)
      );
    });
  }, [searchQuery, statusFilter]);

  const forReview = grammarReviews.filter(
    (item) => item.reviewStatus === "For Grammar Review",
  ).length;
  const reviewed = grammarReviews.filter(
    (item) => item.reviewStatus === "Reviewed",
  ).length;
  const certificates = grammarReviews.filter(
    (item) => item.certificateStatus === "Issued",
  ).length;

  return (
    <GrammarianShell title="Review Queue">
      <div className="space-y-5">
        <Card className="overflow-x-auto border-[#bfe9c5] bg-[#f0fff4] p-4">
          <div className="flex min-w-[760px] divide-x divide-[#bfe9c5]">
            {[
              ["For Review", forReview, "Awaiting check"],
              ["Reviewed", reviewed, "Grammar completed"],
              ["Certificates", certificates, "Issued"],
              ["Visible", filteredItems.length, "Filtered records"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#4f6f58]">
                  {label}
                </p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-2xl font-semibold leading-none text-[#203028]">
                    {value}
                  </p>
                  <p className="pb-0.5 text-[11px] text-[#59645d]">
                    {caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_110px]">
            <label className="text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, project, document..."
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Review Status
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>For Grammar Review</option>
                <option>Reviewed</option>
                <option>Returned for Revision</option>
              </select>
            </label>

            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("All");
              }}
              className="mt-5 h-10 rounded-lg border border-[#dfe8df] bg-white px-3 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Manuscript Review Board
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                Compact list of final manuscripts needing grammar action.
              </p>
            </div>

            <p className="text-xs font-semibold text-[#7b877f]">
              {filteredItems.length} record
              {filteredItems.length === 1 ? "" : "s"} found
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredItems.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                No manuscripts match the selected filters.
              </p>
            ) : (
              filteredItems.map((item) => (
                <div key={item.id} className="px-5 py-4">
                  <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto] xl:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#203028]">
                          {item.groupName}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                            item.reviewStatus,
                          )}`}
                        >
                          {item.reviewStatus}
                        </span>
                      </div>

                      <p className="mt-1 truncate text-sm text-[#59645d]">
                        {item.projectTitle}
                      </p>

                      <p className="mt-1 text-xs text-[#7b877f]">
                        {item.course} {item.section} / Adviser: {item.adviser}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Document
                      </p>
                      <p className="mt-1 truncate text-sm font-semibold text-[#203028]">
                        {item.documentTitle}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        Submitted {item.submittedAt}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${certificateClasses(
                          item.certificateStatus,
                        )}`}
                      >
                        {item.certificateStatus}
                      </span>

                      <button className="rounded-lg bg-[#202823] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303a33]">
                        Open
                      </button>

                      <button className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
                        Feedback
                      </button>

                      <button className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
                        Certificate
                      </button>
                    </div>
                  </div>

                  {item.feedback && (
                    <div className="mt-3 rounded-lg bg-[#f8faf7] px-3 py-2 text-xs leading-5 text-[#59645d]">
                      <span className="font-semibold text-[#203028]">
                        Latest feedback:
                      </span>{" "}
                      {item.feedback}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </GrammarianShell>
  );
}
