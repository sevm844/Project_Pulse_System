"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import StatusBadge from "../_components/StatusBadge";
import {
  getStoredFeedbackItems,
  updateStoredFeedbackItem,
  type StoredFeedbackItem,
  type StoredFeedbackStatus,
} from "../../_utils/feedbackStorage";

type StatusFilter = "All" | StoredFeedbackStatus;
type SortMode = "Newest" | "Oldest" | "Needs Attention";

function uniqueValues(values: string[]) {
  return ["All", ...Array.from(new Set(values.filter(Boolean)))];
}

function formatDateTime(value: string) {
  if (!value) return "No date";

  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function getAgeInDays(value: string) {
  if (!value) return 0;

  const created = new Date(value).getTime();
  const now = Date.now();

  return Math.max(0, Math.floor((now - created) / (1000 * 60 * 60 * 24)));
}

function getSeverity(item: StoredFeedbackItem) {
  const age = getAgeInDays(item.createdAt);

  if (item.status === "Pending" && age >= 7) return "Critical";
  if (item.status === "Pending") return "Needs Attention";
  if (item.status === "Addressed") return "Ready to Verify";

  return "Closed";
}

function severityClasses(severity: string) {
  if (severity === "Critical") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (severity === "Needs Attention") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  if (severity === "Ready to Verify") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export default function DeanReviewsPage() {
  const [items, setItems] = useState<StoredFeedbackItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [chapterFilter, setChapterFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All");
  const [sortMode, setSortMode] = useState<SortMode>("Needs Attention");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    setItems(getStoredFeedbackItems());
  }, []);

  const chapters = useMemo(
    () => uniqueValues(items.map((item) => item.chapter)),
    [items],
  );

  const courses = useMemo(
    () => uniqueValues(items.map((item) => item.course)),
    [items],
  );

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    const nextItems = items.filter((item) => {
      const searchable = [
        item.groupName,
        item.projectTitle,
        item.documentTitle,
        item.chapter,
        item.course,
        item.section,
        item.version,
        item.comment,
        item.detail,
        item.adviserName,
        item.studentResponse,
        item.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesChapter =
        chapterFilter === "All" || item.chapter === chapterFilter;
      const matchesCourse =
        courseFilter === "All" || item.course === courseFilter;

      return matchesSearch && matchesStatus && matchesChapter && matchesCourse;
    });

    return [...nextItems].sort((left, right) => {
      if (sortMode === "Oldest") {
        return (
          new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime()
        );
      }

      if (sortMode === "Newest") {
        return (
          new Date(right.createdAt).getTime() -
          new Date(left.createdAt).getTime()
        );
      }

      const priority: Record<StoredFeedbackStatus, number> = {
        Pending: 1,
        Addressed: 2,
        Verified: 3,
      };

      return priority[left.status] - priority[right.status];
    });
  }, [items, searchQuery, statusFilter, chapterFilter, courseFilter, sortMode]);

  const pendingItems = items.filter((item) => item.status === "Pending");
  const addressedItems = items.filter((item) => item.status === "Addressed");
  const verifiedItems = items.filter((item) => item.status === "Verified");
  const overdueItems = pendingItems.filter(
    (item) => getAgeInDays(item.createdAt) >= 7,
  );
  const respondedItems = items.filter((item) => item.studentResponse.trim());

  function updateStatus(id: number, status: StoredFeedbackStatus) {
    const nextItems = updateStoredFeedbackItem(id, { status });
    setItems(nextItems);
  }

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("All");
    setChapterFilter("All");
    setCourseFilter("All");
    setSortMode("Needs Attention");
  }

  return (
    <DeanShell title="Reviews">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
              Reviews
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
              Track adviser comments, student responses, and verification status
              across submitted documents.
            </p>
          </div>

          <Card className="w-full p-4 xl:w-[340px]">
            <p className="text-sm font-semibold text-[#203028]">
              Dean review guide
            </p>
            <p className="mt-2 text-xs leading-5 text-[#59645d]">
              Prioritize pending feedback first, then verify items with student
              responses. Critical items are unresolved for 7 days or more.
            </p>
          </Card>
        </div>

        <Card className="p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#203028]">
                Filter review records
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Search by group, document, adviser, chapter, comment, or student
                response.
              </p>
            </div>

            <button
              type="button"
              onClick={resetFilters}
              className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset Filters
            </button>
          </div>

          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
            <label className="text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search feedback..."
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>Pending</option>
                <option>Addressed</option>
                <option>Verified</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Chapter
              <select
                value={chapterFilter}
                onChange={(event) => setChapterFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {chapters.map((chapter) => (
                  <option key={chapter}>{chapter}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Course
              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {courses.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Sort
              <select
                value={sortMode}
                onChange={(event) => setSortMode(event.target.value as SortMode)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>Needs Attention</option>
                <option>Newest</option>
                <option>Oldest</option>
              </select>
            </label>
          </div>
        </Card>

        <div className="grid gap-4 md:grid-cols-4">
          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Pending</p>
            <p className="mt-2 text-3xl font-semibold">
              {pendingItems.length}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Addressed</p>
            <p className="mt-2 text-3xl font-semibold">
              {addressedItems.length}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Verified</p>
            <p className="mt-2 text-3xl font-semibold">
              {verifiedItems.length}
            </p>
          </Card>

          <Card className="p-5">
            <p className="text-xs text-[#7b877f]">Student Responded</p>
            <p className="mt-2 text-3xl font-semibold">
              {respondedItems.length}
            </p>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
          <Card className="overflow-hidden">
            <div className="flex flex-col gap-2 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="text-base font-semibold text-[#203028]">
                  Review Queue
                </h3>
                <p className="mt-1 text-xs text-[#7b877f]">
                  {filteredItems.length} result
                  {filteredItems.length === 1 ? "" : "s"} found
                </p>
              </div>
            </div>

            <div className="divide-y divide-[#edf2ec]">
              {filteredItems.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                  No review feedback matches your filters.
                </p>
              ) : (
                filteredItems.map((item) => {
                  const expanded = expandedId === item.id;
                  const severity = getSeverity(item);

                  return (
                    <div
                      key={item.id}
                      className={`border-l-4 px-5 py-4 ${
                        item.status === "Pending"
                          ? "border-l-amber-300"
                          : item.status === "Addressed"
                            ? "border-l-blue-300"
                            : "border-l-emerald-300"
                      }`}
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedId(expanded ? null : item.id)
                          }
                          className="min-w-0 text-left"
                        >
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold text-[#203028]">
                              {item.documentTitle}
                            </p>
                            <StatusBadge status={item.status} />
                            <span
                              className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${severityClasses(
                                severity,
                              )}`}
                            >
                              {severity}
                            </span>
                          </div>

                          <p className="mt-1 text-xs text-[#7b877f]">
                            {item.groupName} • {item.course} {item.section} •{" "}
                            {item.chapter} • {item.version}
                          </p>

                          <p className="mt-2 text-xs text-[#7b877f]">
                            Adviser: {item.adviserName} • Created{" "}
                            {formatDateTime(item.createdAt)} • Updated{" "}
                            {formatDateTime(item.updatedAt)}
                          </p>

                          <p className="mt-3 text-sm font-semibold text-[#203028]">
                            {item.comment}
                          </p>

                          <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#59645d]">
                            {item.detail}
                          </p>
                        </button>

                        <div className="flex flex-wrap gap-2 lg:justify-end">
                          {item.status !== "Addressed" && (
                            <button
                              type="button"
                              onClick={() => updateStatus(item.id, "Addressed")}
                              className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                            >
                              Mark Addressed
                            </button>
                          )}

                          {item.status !== "Verified" && (
                            <button
                              type="button"
                              onClick={() => updateStatus(item.id, "Verified")}
                              className="rounded-lg bg-[#123f2b] px-3 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
                            >
                              Verify
                            </button>
                          )}
                        </div>
                      </div>

                      {expanded && (
                        <div className="mt-4 grid gap-3 rounded-2xl bg-[#fbfdfb] p-4">
                          <div>
                            <p className="text-xs font-semibold text-[#7b877f]">
                              Full feedback detail
                            </p>
                            <p className="mt-2 text-sm leading-6 text-[#59645d]">
                              {item.detail}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-semibold text-[#7b877f]">
                              Student response
                            </p>

                            {item.studentResponse ? (
                              <p className="mt-2 rounded-xl bg-[#eefaf0] p-3 text-sm text-[#4f8f58]">
                                {item.studentResponse}
                              </p>
                            ) : (
                              <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-700">
                                No student response yet.
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Needs Attention
              </h3>

              <div className="mt-4 space-y-3">
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-sm font-semibold text-amber-700">
                    {pendingItems.length} pending item
                    {pendingItems.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-amber-700">
                    Waiting for student action or adviser follow-up.
                  </p>
                </div>

                <div className="rounded-xl bg-rose-50 p-3">
                  <p className="text-sm font-semibold text-rose-700">
                    {overdueItems.length} critical item
                    {overdueItems.length === 1 ? "" : "s"}
                  </p>
                  <p className="mt-1 text-xs text-rose-700">
                    Pending for 7 days or more.
                  </p>
                </div>

                <div className="rounded-xl bg-blue-50 p-3">
                  <p className="text-sm font-semibold text-blue-700">
                    {addressedItems.length} ready to verify
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    Student response is available for checking.
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                What to check
              </h3>

              <div className="mt-4 space-y-3 text-xs leading-5 text-[#59645d]">
                <p>
                  <span className="font-semibold text-[#203028]">Pending:</span>{" "}
                  confirm whether the group still needs revision.
                </p>
                <p>
                  <span className="font-semibold text-[#203028]">
                    Addressed:
                  </span>{" "}
                  verify if the student response satisfies the feedback.
                </p>
                <p>
                  <span className="font-semibold text-[#203028]">Verified:</span>{" "}
                  no immediate dean action needed.
                </p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DeanShell>
  );
}