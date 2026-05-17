"use client";

import { useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";

type SubmissionStatus = "Submitted" | "Not Submitted" | "Late";
type LeaderStatus = "Confirmed" | "Waiting";
type SmsStatus = "Not Needed" | "Queued" | "Sent";

type SubmissionRecord = {
  id: number;
  groupName: string;
  course: string;
  section: string;
  adviser: string;
  requirement: string;
  phase: string;
  deadline: string;
  submittedAt: string;
  fileName: string;
  status: SubmissionStatus;
  leaderStatus: LeaderStatus;
  checklistDone: number;
  checklistTotal: number;
  smsStatus: SmsStatus;
};

type DeadlineDraft = {
  requirement: string;
  course: string;
  section: string;
  deadline: string;
};

const courseSections: Record<string, string[]> = {
  BSIT: ["4A", "4B", "4C", "4D"],
  BSIS: ["4A", "4B"],
  BSCS: ["4A", "4B", "4C"],
  BLIS: ["4A", "4B"],
  ACT: ["2A", "2B"],
};

const courseOptions = ["All Courses", ...Object.keys(courseSections)];
const sectionOptions = [
  "All Sections",
  ...Array.from(new Set(Object.values(courseSections).flat())),
];

const submissionRequirements = [
  "Project Proposal",
  "Proposal Revision Form",
  "Proposal Defense Requirements",
  "Chapter 1: Introduction",
  "Chapter 2: Review of Related Literature",
  "Chapter 3: Methodology",
  "Alpha Defense Requirements",
  "Chapter 4: Results and Discussion",
  "Beta Defense Requirements",
  "Chapter 5: Summary, Conclusion, Recommendeation",
  "Final Manuscript",
  "Final Defense Requirements",
  "Grammar Certificate",
  "Approval Sheet",
  "Records Clearance",
  "Final Submission Package",
];

const checklistItems = [
  "Required document uploaded",
  "Correct file name and format",
  "All group members reviewed",
  "Adviser notified",
  "Leader confirmation submitted",
];

const initialRecords: SubmissionRecord[] = [
  {
    id: 1,
    groupName: "Project Pulse",
    course: "BSIT",
    section: "4A",
    adviser: "Anna Cruz",
    requirement: "Project Proposal",
    phase: "Proposal",
    deadline: "May 20, 2026",
    submittedAt: "May 16, 2026",
    fileName: "project-pulse-project-proposal.pdf",
    status: "Submitted",
    leaderStatus: "Confirmed",
    checklistDone: 5,
    checklistTotal: 5,
    smsStatus: "Not Needed",
  },
  {
    id: 2,
    groupName: "CodeCraft",
    course: "BSIT",
    section: "4B",
    adviser: "Anna Cruz",
    requirement: "Chapter 1: Introduction",
    phase: "Proposal",
    deadline: "May 12, 2026",
    submittedAt: "-",
    fileName: "-",
    status: "Late",
    leaderStatus: "Waiting",
    checklistDone: 2,
    checklistTotal: 5,
    smsStatus: "Queued",
  },
  {
    id: 3,
    groupName: "AlgorithmX",
    course: "BSCS",
    section: "4A",
    adviser: "Anna Cruz",
    requirement: "Chapter 3: Methodology",
    phase: "Alpha Defense",
    deadline: "May 18, 2026",
    submittedAt: "May 17, 2026",
    fileName: "algorithmx-chapter-3-methodology.pdf",
    status: "Submitted",
    leaderStatus: "Waiting",
    checklistDone: 4,
    checklistTotal: 5,
    smsStatus: "Not Needed",
  },
  {
    id: 4,
    groupName: "ArchiveLink",
    course: "BSIS",
    section: "4A",
    adviser: "Marco Reyes",
    requirement: "Final Manuscript",
    phase: "Final Defense",
    deadline: "May 22, 2026",
    submittedAt: "-",
    fileName: "-",
    status: "Not Submitted",
    leaderStatus: "Waiting",
    checklistDone: 3,
    checklistTotal: 5,
    smsStatus: "Not Needed",
  },
  {
    id: 5,
    groupName: "LibraCore",
    course: "BLIS",
    section: "4A",
    adviser: "Elena Rivera",
    requirement: "Grammar Certificate",
    phase: "Final Requirements",
    deadline: "May 14, 2026",
    submittedAt: "-",
    fileName: "-",
    status: "Late",
    leaderStatus: "Waiting",
    checklistDone: 1,
    checklistTotal: 5,
    smsStatus: "Queued",
  },
  {
    id: 6,
    groupName: "TechTrack",
    course: "ACT",
    section: "2A",
    adviser: "Neria Macaraig",
    requirement: "Final Submission Package",
    phase: "Final Submission",
    deadline: "May 25, 2026",
    submittedAt: "May 15, 2026",
    fileName: "techtrack-final-submission-package.zip",
    status: "Submitted",
    leaderStatus: "Confirmed",
    checklistDone: 5,
    checklistTotal: 5,
    smsStatus: "Not Needed",
  },
];

function pillClass(status: SubmissionStatus | LeaderStatus | SmsStatus) {
  if (status === "Submitted" || status === "Confirmed" || status === "Sent") {
    return "border-[#86efac] bg-[#ecfdf3] text-[#047857]";
  }

  if (status === "Late") {
    return "border-[#fb7185] bg-[#fff1f2] text-[#be123c]";
  }

  if (status === "Queued" || status === "Waiting") {
    return "border-[#facc15] bg-[#fefce8] text-[#a16207]";
  }

  return "border-[#dfe8df] bg-white text-[#59645d]";
}

function getPhase(requirement: string) {
  if (requirement.includes("Proposal")) return "Proposal";
  if (requirement.includes("Chapter 1") || requirement.includes("Chapter 2")) {
    return "Proposal";
  }
  if (requirement.includes("Chapter 3") || requirement.includes("Alpha")) {
    return "Alpha Defense";
  }
  if (requirement.includes("Chapter 4") || requirement.includes("Beta")) {
    return "Beta Defense";
  }
  if (requirement.includes("Chapter 5") || requirement.includes("Final Defense")) {
    return "Final Defense";
  }
  return "Final Requirements";
}

function fileSlug(value: string) {
  return value
    .toLowerCase()
    .replaceAll(":", "")
    .replaceAll(",", "")
    .replaceAll(" ", "-");
}

export default function DeanSubmissionManagementPage() {
  const [records, setRecords] = useState(initialRecords);
  const [statusFilter, setStatusFilter] = useState<"All" | SubmissionStatus>("All");
  const [requirementFilter, setRequirementFilter] = useState("All");
  const [courseFilter, setCourseFilter] = useState("All Courses");
  const [deadlineDraft, setDeadlineDraft] = useState<DeadlineDraft>({
    requirement: "Project Proposal",
    course: "All Courses",
    section: "All Sections",
    deadline: "2026-05-20",
  });

  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      const matchesStatus = statusFilter === "All" || record.status === statusFilter;
      const matchesRequirement =
        requirementFilter === "All" || record.requirement === requirementFilter;
      const matchesCourse =
        courseFilter === "All Courses" || record.course === courseFilter;

      return matchesStatus && matchesRequirement && matchesCourse;
    });
  }, [courseFilter, records, requirementFilter, statusFilter]);

  const submittedCount = records.filter((record) => record.status === "Submitted").length;
  const notSubmittedCount = records.filter(
    (record) => record.status === "Not Submitted",
  ).length;
  const lateCount = records.filter((record) => record.status === "Late").length;
  const confirmedCount = records.filter(
    (record) => record.leaderStatus === "Confirmed",
  ).length;
  const smsQueuedCount = records.filter((record) => record.smsStatus === "Queued").length;

  function updateDeadline() {
    const formatted = new Date(deadlineDraft.deadline).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

    setRecords((current) =>
      current.map((record) => {
        const matchesCourse =
          deadlineDraft.course === "All Courses" || record.course === deadlineDraft.course;
        const matchesSection =
          deadlineDraft.section === "All Sections" ||
          record.section === deadlineDraft.section;

        return matchesCourse && matchesSection
          ? {
              ...record,
              requirement: deadlineDraft.requirement,
              phase: getPhase(deadlineDraft.requirement),
              deadline: formatted,
            }
          : record;
      }),
    );
  }

  function markUploaded(id: number) {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              fileName: `${fileSlug(record.groupName)}-${fileSlug(record.requirement)}.pdf`,
              submittedAt: "May 16, 2026",
              status: "Submitted",
              smsStatus: "Not Needed",
            }
          : record,
      ),
    );
  }

  function confirmLeader(id: number) {
    setRecords((current) =>
      current.map((record) =>
        record.id === id
          ? {
              ...record,
              leaderStatus: "Confirmed",
              checklistDone: record.checklistTotal,
            }
          : record,
      ),
    );
  }

  function toggleChecklist(id: number, checked: boolean) {
    setRecords((current) =>
      current.map((record) => {
        if (record.id !== id) return record;

        const nextDone = checked
          ? Math.min(record.checklistDone + 1, record.checklistTotal)
          : Math.max(record.checklistDone - 1, 0);

        return { ...record, checklistDone: nextDone };
      }),
    );
  }

  function sendSmsAlert(id: number) {
    setRecords((current) =>
      current.map((record) =>
        record.id === id ? { ...record, smsStatus: "Sent" } : record,
      ),
    );
  }

  return (
    <DeanShell title="Submission Management">
      <div className="space-y-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
              Submissions
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
              Monitor all department submissions from proposal requirements to
              final clearance, including uploads, leader confirmations,
              checklist progress, and deadline alerts.
            </p>
          </div>

          <div className="rounded-2xl border border-[#bfe8b9] bg-[linear-gradient(90deg,#ffffff_0%,#f2fdeb_52%,#e4f8d8_100%)] px-4 py-3 text-xs text-[#59645d] shadow-[0_10px_28px_rgba(32,48,40,0.08)] xl:w-[380px]">
            <p className="font-semibold text-[#203028]">Current deadline rule</p>
            <p className="mt-1 leading-5">
              {deadlineDraft.requirement} closes on <b>{deadlineDraft.deadline}</b> for {deadlineDraft.course} / {deadlineDraft.section}.
            </p>
          </div>
        </div>

        <Card className="overflow-hidden !border-[#bfe8b9] !bg-[#f7fff4] p-0 shadow-[0_10px_28px_rgba(32,48,40,0.08)]">
          <div className="overflow-x-auto rounded-2xl bg-[linear-gradient(90deg,#ffffff_0%,#f2fdeb_48%,#e4f8d8_100%)] p-4">
            <div className="flex min-w-[980px] divide-x divide-[#cfe8c8]">
              {[
                ["Department Courses", Object.keys(courseSections).length, "BSIT, BSIS, BSCS, BLIS, ACT"],
                ["Requirement Types", submissionRequirements.length, "Proposal to final"],
                ["Submitted", submittedCount, "Uploaded"],
                ["Not Submitted", notSubmittedCount, "Waiting"],
                ["Late", lateCount, "Missed deadline"],
                ["Leader Confirmed", confirmedCount, "Team verified"],
                ["SMS Queued", smsQueuedCount, "Dean alerts"],
              ].map(([label, value, caption]) => (
                <div key={label} className="flex-1 px-4 py-2">
                  <p className="text-[11px] font-semibold text-[#2f6f3a]">{label}</p>
                  <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                    <p className="text-2xl font-semibold leading-none text-[#0f1f16]">
                      {value}
                    </p>
                    <p className="pb-0.5 text-[10px] leading-4 text-[#59645d]">
                      {caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Submission Deadlines
            </h3>
            <p className="mt-1 text-xs text-[#7b877f]">
              Set deadlines for any requirement from proposal documents to final clearance.
            </p>
            <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_150px_150px_170px_auto] lg:items-end">
              <label className="text-xs font-semibold text-[#59645d]">
                Requirement
                <select
                  value={deadlineDraft.requirement}
                  onChange={(event) =>
                    setDeadlineDraft((current) => ({
                      ...current,
                      requirement: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                >
                  {submissionRequirements.map((requirement) => (
                    <option key={requirement}>{requirement}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#59645d]">
                Course
                <select
                  value={deadlineDraft.course}
                  onChange={(event) =>
                    setDeadlineDraft((current) => ({
                      ...current,
                      course: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                >
                  {courseOptions.map((course) => (
                    <option key={course}>{course}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#59645d]">
                Section
                <select
                  value={deadlineDraft.section}
                  onChange={(event) =>
                    setDeadlineDraft((current) => ({
                      ...current,
                      section: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                >
                  {sectionOptions.map((section) => (
                    <option key={section}>{section}</option>
                  ))}
                </select>
              </label>

              <label className="text-xs font-semibold text-[#59645d]">
                Deadline
                <input
                  type="date"
                  value={deadlineDraft.deadline}
                  onChange={(event) =>
                    setDeadlineDraft((current) => ({
                      ...current,
                      deadline: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                />
              </label>

              <button
                type="button"
                onClick={updateDeadline}
                className="rounded-xl bg-[#202823] px-5 py-3 text-xs font-semibold text-white transition hover:bg-[#303a33]"
              >
                Set Deadline
              </button>
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Requirement Coverage
            </h3>
            <p className="mt-1 text-xs leading-5 text-[#7b877f]">
              This page covers {submissionRequirements.length} requirement types across all department courses.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {Object.entries(courseSections).map(([course, sections]) => (
                <span
                  key={course}
                  className="rounded-full border border-[#dfe8df] bg-[#fbfdfb] px-3 py-1 text-xs font-semibold text-[#203028]"
                >
                  {course} {sections.join(", ")}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-5">
          <div className="grid gap-3 md:grid-cols-[1fr_180px_220px_220px]">
            <label className="text-xs font-semibold text-[#59645d]">
              Search group
              <input
                placeholder="Search group, course, adviser..."
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Course
              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {courseOptions.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "All" | SubmissionStatus)
                }
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                <option>Submitted</option>
                <option>Not Submitted</option>
                <option>Late</option>
              </select>
            </label>

            <label className="text-xs font-semibold text-[#59645d]">
              Requirement
              <select
                value={requirementFilter}
                onChange={(event) => setRequirementFilter(event.target.value)}
                className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-[#fbfdfb] px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                <option>All</option>
                {submissionRequirements.map((requirement) => (
                  <option key={requirement}>{requirement}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card className="overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-[#edf2ec] px-5 py-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-base font-semibold text-[#203028]">
                Group Submission Board
              </h3>
              <p className="mt-1 text-xs text-[#7b877f]">
                Tracks uploads, checklist progress, leader confirmation, status, and SMS alerts.
              </p>
            </div>
            <p className="text-xs font-semibold text-[#7b877f]">
              {filteredRecords.length} group{filteredRecords.length === 1 ? "" : "s"} shown
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1360px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Group</th>
                  <th className="px-5 py-3 font-medium">Course</th>
                  <th className="px-5 py-3 font-medium">Phase</th>
                  <th className="px-5 py-3 font-medium">Requirement</th>
                  <th className="px-5 py-3 font-medium">Deadline</th>
                  <th className="px-5 py-3 font-medium">Student Upload</th>
                  <th className="px-5 py-3 font-medium">Checklist</th>
                  <th className="px-5 py-3 font-medium">Leader</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">SMS</th>
                  <th className="px-5 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2ec]">
                {filteredRecords.map((record) => {
                  const checklistPercent = Math.round(
                    (record.checklistDone / record.checklistTotal) * 100,
                  );

                  return (
                    <tr key={record.id} className="hover:bg-[#fbfdfb]">
                      <td className="px-5 py-4">
                        <p className="font-semibold text-[#203028]">{record.groupName}</p>
                        <p className="mt-1 text-xs text-[#7b877f]">{record.adviser}</p>
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">
                        {record.course} {record.section}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">{record.phase}</td>
                      <td className="px-5 py-4 font-medium text-[#203028]">
                        {record.requirement}
                      </td>
                      <td className="px-5 py-4 text-[#59645d]">{record.deadline}</td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#203028]">{record.fileName}</p>
                        <p className="mt-1 text-xs text-[#7b877f]">Uploaded: {record.submittedAt}</p>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-2 w-24 overflow-hidden rounded-full bg-[#edf2ec]">
                            <div
                              className="h-full rounded-full bg-[#4f8f58]"
                              style={{ width: `${checklistPercent}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-[#203028]">
                            {record.checklistDone}/{record.checklistTotal}
                          </span>
                        </div>
                        <div className="mt-2 grid gap-1 text-[10px] text-[#59645d]">
                          {checklistItems.slice(0, 3).map((item, index) => (
                            <label key={item} className="flex items-center gap-1">
                              <input
                                type="checkbox"
                                checked={index < record.checklistDone}
                                onChange={(event) =>
                                  toggleChecklist(record.id, event.target.checked)
                                }
                              />
                              {item}
                            </label>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${pillClass(record.leaderStatus)}`}>
                          {record.leaderStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${pillClass(record.status)}`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`rounded-full border px-3 py-1 text-[11px] font-semibold ${pillClass(record.smsStatus)}`}>
                          {record.smsStatus}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex flex-col gap-2">
                          <button
                            type="button"
                            onClick={() => markUploaded(record.id)}
                            className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#203028] transition hover:bg-[#f3f7f1]"
                          >
                            Mark Uploaded
                          </button>
                          <button
                            type="button"
                            onClick={() => confirmLeader(record.id)}
                            className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold text-[#203028] transition hover:bg-[#f3f7f1]"
                          >
                            Confirm Leader
                          </button>
                          <button
                            type="button"
                            onClick={() => sendSmsAlert(record.id)}
                            disabled={record.status !== "Late"}
                            className="rounded-lg bg-[#202823] px-3 py-2 text-xs font-semibold text-white transition hover:bg-[#303a33] disabled:cursor-not-allowed disabled:bg-[#dfe8df] disabled:text-[#7b877f]"
                          >
                            Send SMS
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </DeanShell>
  );
}

