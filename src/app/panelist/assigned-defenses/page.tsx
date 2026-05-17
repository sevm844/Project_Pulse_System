"use client";

import { useMemo, useState } from "react";
import PanelistShell from "../_components/PanelistShell";
import Card from "../_components/Card";
import { panelistDefenses } from "../_data/panelistData";

function statusClasses(status: string) {
  if (status === "Submitted" || status === "Available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
}

function stageClasses(stage: string) {
  if (stage.includes("Final")) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (stage.includes("Proposal")) {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
}

export default function AssignedDefensesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [stageFilter, setStageFilter] = useState("All");

  const stages = useMemo(() => {
    return [
      "All",
      ...Array.from(new Set(panelistDefenses.map((item) => item.stage))),
    ];
  }, []);

  const filtered = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return panelistDefenses.filter((defense) => {
      const searchable = [
        defense.groupName,
        defense.projectTitle,
        defense.course,
        defense.section,
        defense.stage,
        defense.venue,
        defense.adviser,
        defense.evaluationStatus,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        statusFilter === "All" || defense.evaluationStatus === statusFilter;
      const matchesStage = stageFilter === "All" || defense.stage === stageFilter;

      return matchesSearch && matchesStatus && matchesStage;
    });
  }, [searchQuery, stageFilter, statusFilter]);

  const pendingCount = panelistDefenses.filter(
    (item) => item.evaluationStatus === "Pending",
  ).length;

  const submittedCount = panelistDefenses.filter(
    (item) => item.evaluationStatus === "Submitted",
  ).length;

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("All");
    setStageFilter("All");
  }

  return (
    <PanelistShell title="Assigned Defenses">
      <div className="space-y-5">
        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[720px] divide-x divide-[#dfe8df]">
            {[
              ["Assigned", panelistDefenses.length, "Defense schedules"],
              ["Pending", pendingCount, "Need evaluation"],
              ["Submitted", submittedCount, "Completed forms"],
              ["Visible", filtered.length, "After filters"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-xs font-semibold text-[#7b877f]">{label}</p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-2xl font-semibold text-[#203028]">
                    {value}
                  </p>
                  <p className="pb-1 text-xs text-[#59645d]">{caption}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="overflow-x-auto p-4">
          <div className="flex min-w-[860px] items-end gap-3">
            <label className="min-w-[300px] flex-1 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, project, adviser, venue..."
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="w-[210px] shrink-0 text-xs font-semibold text-[#59645d]">
              Stage
              <select
                value={stageFilter}
                onChange={(event) => setStageFilter(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {stages.map((stage) => (
                  <option key={stage}>{stage}</option>
                ))}
              </select>
            </label>

            <label className="w-[190px] shrink-0 text-xs font-semibold text-[#59645d]">
              Evaluation
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="mt-1 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>Pending</option>
                <option>Submitted</option>
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="h-10 shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <Card className="overflow-hidden">
            <div className="border-b border-[#edf2ec] px-5 py-4">
              <h2 className="text-lg font-semibold text-[#203028]">
                Defense Schedule Board
              </h2>
              <p className="mt-1 text-sm text-[#7b877f]">
                {filtered.length} assigned defense
                {filtered.length === 1 ? "" : "s"} found.
              </p>
            </div>

            <div className="divide-y divide-[#edf2ec]">
              {filtered.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-[#7b877f]">
                  No defense assignments match the selected filters.
                </p>
              ) : (
                filtered.map((defense) => (
                  <div
                    key={defense.id}
                    className="grid gap-4 px-5 py-4 lg:grid-cols-[120px_minmax(0,1fr)_auto] lg:items-center"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {defense.time}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {defense.date}
                      </p>
                      <p className="mt-1 text-xs font-semibold text-[#59645d]">
                        {defense.venue}
                      </p>
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold text-[#203028]">
                          {defense.groupName}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${stageClasses(
                            defense.stage,
                          )}`}
                        >
                          {defense.stage}
                        </span>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                            defense.evaluationStatus,
                          )}`}
                        >
                          {defense.evaluationStatus}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#59645d]">
                        {defense.projectTitle}
                      </p>

                      <p className="mt-2 text-xs text-[#7b877f]">
                        {defense.course} {defense.section} • Adviser:{" "}
                        {defense.adviser} • Document: {defense.documentTitle}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-semibold text-[#59645d]">
                        <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                          Document {defense.documentStatus}
                        </span>
                        <span className="rounded-full bg-[#f8faf7] px-2.5 py-1">
                          Venue {defense.venue}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 lg:justify-end">
                      <a
                        href="/panelist/documents"
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                      >
                        Documents
                      </a>

                      <a
                        href="/panelist/evaluations"
                        className="rounded-lg bg-[#202823] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                      >
                        Evaluate
                      </a>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          <aside className="space-y-5">
            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Next Action
              </h3>

              <div className="mt-4 space-y-3">
                {panelistDefenses
                  .filter((item) => item.evaluationStatus === "Pending")
                  .map((defense) => (
                    <div
                      key={defense.id}
                      className="rounded-xl border border-amber-200 bg-amber-50 p-4"
                    >
                      <p className="text-sm font-semibold text-amber-800">
                        {defense.groupName}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-amber-700">
                        Evaluation pending for {defense.stage}.
                      </p>
                    </div>
                  ))}
              </div>
            </Card>

            <Card className="p-5">
              <h3 className="text-base font-semibold text-[#203028]">
                Panelist Reminders
              </h3>

              <div className="mt-4 space-y-3 text-xs leading-5 text-[#59645d]">
                <p className="rounded-xl bg-[#f8faf7] p-3">
                  Review manuscript documents before the defense schedule.
                </p>
                <p className="rounded-xl bg-[#f8faf7] p-3">
                  Submit evaluation after scoring all criteria.
                </p>
                <p className="rounded-xl bg-[#f8faf7] p-3">
                  Use remarks for required revisions or approval conditions.
                </p>
              </div>
            </Card>
          </aside>
        </div>
      </div>
    </PanelistShell>
  );
}
