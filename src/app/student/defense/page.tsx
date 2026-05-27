"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { Sheet } from "@fortune-sheet/core";
import StudentShell from "../_components/StudentShell";
import StatusBadge from "../_components/StatusBadge";
import {
  getStoredDefensePlan,
  type DefensePlan,
} from "../../_utils/defenseStorage";
import {
  getStoredDefenseWorkbook,
  saveStoredDefenseWorkbook,
} from "../../_utils/defenseWorkbookStorage";

const Workbook = dynamic(
  () => import("@fortune-sheet/react").then((mod) => mod.Workbook),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[620px] items-center justify-center rounded-lg border border-[#dfe8df] bg-white text-sm text-[#59645d]">
        Loading defense sheet...
      </div>
    ),
  },
);

function statusDot(status: string) {
  if (
    status === "Completed" ||
    status === "Uploaded" ||
    status === "Scheduled" ||
    status === "Ready"
  ) {
    return "bg-[#4f8f58] text-white";
  }

  return "border border-amber-300 bg-amber-50 text-amber-700";
}

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function DefensePage() {
  const [plan, setPlan] = useState<DefensePlan | null>(null);
  const [showDefenseSheet, setShowDefenseSheet] = useState(false);
  const [workbookData, setWorkbookData] = useState<Sheet[]>([]);
  const [sheetSaveStatus, setSheetSaveStatus] = useState("Ready to edit");

  useEffect(() => {
    queueMicrotask(() => {
      const storedPlan = getStoredDefensePlan();

      setPlan(storedPlan);

      if (!storedPlan) return;

      setWorkbookData(getStoredDefenseWorkbook(storedPlan.course));
    });
  }, []);

  function saveDefenseSheet() {
    if (!plan) return;

    saveStoredDefenseWorkbook(plan.course, workbookData);
    setSheetSaveStatus("Saved just now");
  }

  if (!plan) {
    return (
      <StudentShell title="Defense">
        <div className="rounded-lg border border-[#dfe8df] bg-white p-6">
          <p className="text-sm text-[#7b877f]">Loading defense details...</p>
        </div>
      </StudentShell>
    );
  }

  const timeline = [
    {
      title: plan.stage,
      date: `${plan.date} - ${plan.time}`,
      status: plan.readinessStatus === "Ready" ? "Scheduled" : "Pending",
    },
    {
      title: "Panel Evaluation",
      date:
        plan.evaluationStatus === "Submitted"
          ? "Panel evaluation submitted"
          : "Waiting for panel evaluation",
      status: plan.evaluationStatus,
    },
    {
      title: "Revisions",
      date: "After panel remarks are released",
      status: "Pending",
    },
  ];

  return (
    <StudentShell title="Defense">
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-[#4f8f58]">
            Defense Preparation
          </p>
          <p className="mt-1 text-sm text-[#59645d]">
            View defense schedule, panel details, requirements, and defense
            files set by the adviser.
          </p>
        </div>

        <section className="rounded-lg border border-[#dfe8df] bg-white p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[#203028]">
                Defense Sheet
              </h2>
              <p className="mt-1 text-sm text-[#59645d]">
                Open the same defense workbook your adviser uses and fill in
                the details your group was asked to update.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowDefenseSheet((current) => !current)}
              className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
            >
              {showDefenseSheet ? "Close Defense Sheet" : "Open Defense Sheet"}
            </button>
          </div>

          {showDefenseSheet && (
            <div className="mt-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b877f]">
                    Shared adviser defense workbook
                  </p>
                  <p className="mt-1 text-sm text-[#59645d]">
                    This is the same sheet layout from the adviser Defense
                    workspace.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#e4f8da] px-3 py-1.5 text-xs font-semibold text-[#245329]">
                    {sheetSaveStatus}
                  </span>
                  <button
                    type="button"
                    onClick={saveDefenseSheet}
                    className="rounded-lg border border-[#cfe9c5] bg-white px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                  >
                    Save Sheet
                  </button>
                </div>
              </div>

              <div className="h-[620px] overflow-hidden rounded-lg border border-[#dfe8df] bg-white">
                <Workbook
                  data={workbookData}
                  onChange={(nextWorkbook) => {
                    setWorkbookData(nextWorkbook);
                    setSheetSaveStatus("Unsaved changes");
                  }}
                  allowEdit
                  showToolbar
                  showFormulaBar
                  showSheetTabs
                  row={40}
                  column={18}
                  defaultRowHeight={34}
                  defaultColWidth={120}
                />
              </div>
            </div>
          )}
        </section>

        <section className="rounded-lg border border-[#dfe8df] bg-white p-5">
          <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr_1fr_auto] lg:items-center">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#eefaf0] text-xl font-semibold text-[#4f8f58]">
                D
              </div>
              <div>
                <h2 className="text-xl font-semibold text-[#203028]">
                  {plan.stage}
                </h2>
                <p className="mt-1 text-xs text-[#7b877f]">
                  {plan.groupName} - {plan.projectTitle}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#7b877f]">Scheduled</p>
              <p className="mt-1 text-sm font-semibold text-[#203028]">
                {plan.date} - {plan.time}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold text-[#7b877f]">
                Room / Link
              </p>
              <p className="mt-1 text-sm font-semibold text-[#203028]">
                {plan.venue}
              </p>
            </div>

            <StatusBadge status={plan.readinessStatus} />
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1fr_1.1fr]">
          <section className="rounded-lg border border-[#dfe8df] bg-white p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Defense Requirements
            </h3>

            <div className="mt-4 divide-y divide-[#edf2ec]">
              {plan.requirements.map((item) => (
                <Link
                  key={item.id}
                  href="/student/documents/new?workflow=upload&type=Defense%20Requirement"
                  className="flex items-center gap-4 py-3 hover:bg-[#fbfdfb]"
                >
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${statusDot(
                      item.status,
                    )}`}
                  >
                    {item.status === "Pending" ? "!" : "OK"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-[#203028]">
                      {item.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-[#7b877f]">
                      {item.detail}
                    </span>
                  </span>
                  <span className="text-[#9ba69d]">&gt;</span>
                </Link>
              ))}
            </div>
          </section>

          <section
            id="panel"
            className="rounded-lg border border-[#dfe8df] bg-white p-5"
          >
            <h3 className="text-base font-semibold text-[#203028]">
              Defense Panel
            </h3>

            <div className="mt-4 divide-y divide-[#edf2ec]">
              {plan.panelists.map((member) => (
                <div
                  key={member.id}
                  className="grid gap-3 py-3 sm:grid-cols-[44px_110px_1fr_auto]"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#d7f7d8] text-xs font-semibold text-[#203028]">
                    {initials(member.name)}
                  </span>
                  <p className="text-xs font-semibold text-[#203028]">
                    {member.role}
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-[#203028]">
                      {member.name}
                    </p>
                    <p className="text-xs text-[#7b877f]">{member.email}</p>
                  </div>
                  <Link
                    href="/student/chat"
                    className="inline-flex items-center justify-center rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                  >
                    Message
                  </Link>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1.35fr_0.75fr]">
          <section className="rounded-lg border border-[#dfe8df] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-[#203028]">
                Defense Files
              </h3>
              <Link
                href="/student/documents/new?workflow=upload&type=Defense%20Requirement"
                className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
              >
                Upload Defense File
              </Link>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="border-b border-[#edf2ec] text-xs text-[#7b877f]">
                  <tr>
                    <th className="py-3 font-medium">File Name</th>
                    <th className="py-3 font-medium">Uploaded</th>
                    <th className="py-3 font-medium">Status</th>
                    <th className="py-3 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf2ec]">
                  {plan.files.map((file) => (
                    <tr key={file.id}>
                      <td className="py-3">
                        <p className="font-semibold text-[#203028]">
                          {file.name}
                        </p>
                        <p className="text-xs text-[#7b877f]">{file.detail}</p>
                      </td>
                      <td className="py-3 text-[#59645d]">{file.uploaded}</td>
                      <td className="py-3">
                        <StatusBadge status={file.status} />
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-2">
                          <Link
                            href="/student/documents"
                            className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                          >
                            View File
                          </Link>
                          <Link
                            href="/student/documents/new?workflow=upload&type=Defense%20Requirement"
                            className="rounded-lg bg-[#202823] px-3 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                          >
                            Upload File
                          </Link>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="rounded-lg border border-[#dfe8df] bg-white p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Defense Timeline
            </h3>

            <div className="mt-4 space-y-4">
              {timeline.map((item) => (
                <div key={item.title} className="flex gap-3">
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${statusDot(
                      item.status,
                    )}`}
                  >
                    {item.status === "Pending" ? "" : "OK"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-[#203028]">
                        {item.title}
                      </p>
                      <StatusBadge status={item.status} />
                    </div>

                    <p className="mt-1 text-xs text-[#7b877f]">{item.date}</p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/student/defense/timeline"
              className="mt-5 inline-flex rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
            >
              View Full Timeline
            </Link>
          </section>
        </div>
      </div>
    </StudentShell>
  );
}
