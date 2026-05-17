"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import PanelistShell from "../_components/PanelistShell";
import Card from "../_components/Card";
import { panelistDefenses } from "../_data/panelistData";

type DocumentStatusFilter = "All" | "Available" | "Pending";

function statusClasses(status: string) {
  if (status === "Available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Pending") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
}

function getDocumentMeta(stage: string) {
  if (stage === "Final Defense") {
    return {
      type: "Final Manuscript",
      version: "Final review copy",
      focus: "Final output quality, completed revisions, and documentation consistency",
      requiredFor: "Final defense scoring",
      format: "PDF / DOCX",
    };
  }

  if (stage === "Proposal Defense") {
    return {
      type: "Chapter Manuscript",
      version: "Proposal defense copy",
      focus: "Problem clarity, objectives, scope, feasibility, and proposed solution",
      requiredFor: "Proposal defense scoring",
      format: "PDF / DOCX",
    };
  }

  return {
    type: "Defense Document",
    version: "Current review copy",
    focus: "Content quality, completeness, and defense readiness",
    requiredFor: "Panel evaluation",
    format: "PDF / DOCX",
  };
}

export default function PanelistDocumentsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<DocumentStatusFilter>("All");

  const documents = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return panelistDefenses.filter((defense) => {
      const searchable = [
        defense.groupName,
        defense.projectTitle,
        defense.course,
        defense.section,
        defense.stage,
        defense.documentTitle,
        defense.documentStatus,
        defense.adviser,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        statusFilter === "All" || defense.documentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  const availableDocuments = panelistDefenses.filter(
    (defense) => defense.documentStatus === "Available",
  );
  const pendingDocuments = panelistDefenses.filter(
    (defense) => defense.documentStatus === "Pending",
  );

  return (
    <PanelistShell title="Documents">
      <div className="space-y-5">
        <Card className="overflow-x-auto border-[#bfe9c5] bg-[#f0fff4] p-4 shadow-[0_10px_30px_rgba(79,143,88,0.08)]">
          <div className="flex min-w-[780px] divide-x divide-[#bfe9c5]">
            {[
              ["Documents", panelistDefenses.length, "Assigned to you"],
              ["Available", availableDocuments.length, "Ready to review"],
              ["Pending", pendingDocuments.length, "Awaiting upload"],
              ["Visible", documents.length, "Current filtered list"],
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
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search group, project, adviser, document..."
                className="mt-1.5 h-11 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Document Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as DocumentStatusFilter)
                }
                className="mt-1.5 h-11 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>Available</option>
                <option>Pending</option>
              </select>
            </label>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Panel Document Library
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Read-only review copies for your assigned defense panels.
            </p>
          </div>

          <div className="grid gap-4 p-5 xl:grid-cols-2">
            {documents.length === 0 ? (
              <div className="xl:col-span-2 rounded-xl bg-[#f8faf7] p-8 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No documents found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the search or document status filter.
                </p>
              </div>
            ) : (
              documents.map((defense) => {
                const meta = getDocumentMeta(defense.stage);
                const isAvailable = defense.documentStatus === "Available";

                return (
                  <article
                    key={defense.id}
                    className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4"
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="text-base font-semibold text-[#203028]">
                            {defense.documentTitle}
                          </h3>
                          <span
                            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                              defense.documentStatus,
                            )}`}
                          >
                            {defense.documentStatus}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#59645d]">
                          {defense.groupName} - {defense.projectTitle}
                        </p>

                        <p className="mt-1 text-xs text-[#7b877f]">
                          {defense.course} {defense.section} / {defense.stage} /{" "}
                          {defense.date} / {defense.venue}
                        </p>
                      </div>

                      <p className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-[#4f8f58]">
                        {meta.format}
                      </p>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <InfoBox label="Type" value={meta.type} />
                      <InfoBox label="Version" value={meta.version} />
                      <InfoBox label="Required For" value={meta.requiredFor} />
                    </div>

                    <div className="mt-4 rounded-lg border border-[#edf2ec] bg-white p-3">
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Review Focus
                      </p>
                      <p className="mt-1 text-sm leading-6 text-[#203028]">
                        {meta.focus}
                      </p>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={!isAvailable}
                        className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Open Document
                      </button>

                      <Link
                        href="/panelist/evaluations"
                        className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                      >
                        Go to Evaluation
                      </Link>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </Card>
      </div>
    </PanelistShell>
  );
}

function InfoBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[11px] font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-1 text-xs font-semibold leading-5 text-[#203028]">
        {value}
      </p>
    </div>
  );
}
