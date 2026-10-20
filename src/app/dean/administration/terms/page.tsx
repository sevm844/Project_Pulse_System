"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../../_components/DeanShell";

type TermStatus = "Active" | "Upcoming" | "Closed";
type MilestoneStatus = "Scheduled" | "Open" | "Closed";
type MilestoneType =
  | "Submission"
  | "Defense Window"
  | "Review"
  | "Final Approval";

type AcademicTerm = {
  schoolYear: string;
  semester: string;
  startDate: string;
  endDate: string;
  status: TermStatus;
};

type MilestoneRecord = {
  id: number;
  title: string;
  type: MilestoneType;
  dateRange: string;
  owner: string;
  affectedPortal: string;
  status: MilestoneStatus;
};

type TermDraft = AcademicTerm;

type MilestoneDraft = {
  title: string;
  type: MilestoneType;
  dateRange: string;
  owner: string;
  affectedPortal: string;
  status: MilestoneStatus;
};

const ADMIN_TERM_STORAGE_KEY = "project-pulse-admin-academic-term";
const ADMIN_MILESTONES_STORAGE_KEY = "project-pulse-admin-term-milestones";

const defaultTerm: AcademicTerm = {
  schoolYear: "2025-2026",
  semester: "2nd Semester",
  startDate: "January 20, 2026",
  endDate: "June 30, 2026",
  status: "Active",
};

const defaultMilestones: MilestoneRecord[] = [
  {
    id: 1,
    title: "Proposal Submission",
    type: "Submission",
    dateRange: "May 20, 2026",
    owner: "Students",
    affectedPortal: "Student Documents",
    status: "Open",
  },
  {
    id: 2,
    title: "Proposal Defense Window",
    type: "Defense Window",
    dateRange: "May 22 - May 30, 2026",
    owner: "Coordinator / Dean",
    affectedPortal: "Schedule and Defense",
    status: "Scheduled",
  },
  {
    id: 3,
    title: "Final Manuscript Deadline",
    type: "Submission",
    dateRange: "June 15, 2026",
    owner: "Students / Adviser",
    affectedPortal: "Documents and Reviews",
    status: "Scheduled",
  },
  {
    id: 4,
    title: "Final Approval Deadline",
    type: "Final Approval",
    dateRange: "June 25, 2026",
    owner: "Dean / Records",
    affectedPortal: "Final Approvals",
    status: "Scheduled",
  },
];

const termStatusOptions: TermStatus[] = ["Active", "Upcoming", "Closed"];
const milestoneStatusOptions: MilestoneStatus[] = [
  "Scheduled",
  "Open",
  "Closed",
];
const milestoneTypeOptions: MilestoneType[] = [
  "Submission",
  "Defense Window",
  "Review",
  "Final Approval",
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getStoredTerm() {
  if (!canUseStorage()) return defaultTerm;

  const saved = window.localStorage.getItem(ADMIN_TERM_STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(
      ADMIN_TERM_STORAGE_KEY,
      JSON.stringify(defaultTerm),
    );

    return defaultTerm;
  }

  return JSON.parse(saved) as AcademicTerm;
}

function saveStoredTerm(term: AcademicTerm) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(ADMIN_TERM_STORAGE_KEY, JSON.stringify(term));
}

function getStoredMilestones() {
  if (!canUseStorage()) return defaultMilestones;

  const saved = window.localStorage.getItem(ADMIN_MILESTONES_STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(
      ADMIN_MILESTONES_STORAGE_KEY,
      JSON.stringify(defaultMilestones),
    );

    return defaultMilestones;
  }

  return JSON.parse(saved) as MilestoneRecord[];
}

function saveStoredMilestones(milestones: MilestoneRecord[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    ADMIN_MILESTONES_STORAGE_KEY,
    JSON.stringify(milestones),
  );
}

function termStatusClasses(status: TermStatus) {
  if (status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Upcoming") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
}

function milestoneStatusClasses(status: MilestoneStatus) {
  if (status === "Open") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Scheduled") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-[#dfe8df] bg-[#f8faf7] text-[#59645d]";
}

function createMilestoneDraft(
  milestone?: MilestoneRecord,
): MilestoneDraft {
  return {
    title: milestone?.title || "",
    type: milestone?.type || "Submission",
    dateRange: milestone?.dateRange || "",
    owner: milestone?.owner || "",
    affectedPortal: milestone?.affectedPortal || "",
    status: milestone?.status || "Scheduled",
  };
}

export default function DeanTermsPage() {
  const [term, setTerm] = useState<AcademicTerm>(defaultTerm);
  const [termDraft, setTermDraft] = useState<TermDraft>(defaultTerm);
  const [termEditing, setTermEditing] = useState(false);

  const [milestones, setMilestones] =
    useState<MilestoneRecord[]>(defaultMilestones);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMilestoneId, setEditingMilestoneId] = useState<
    number | "new" | null
  >(null);
  const [milestoneDraft, setMilestoneDraft] = useState<MilestoneDraft>(
    createMilestoneDraft(),
  );

  useEffect(() => {
    queueMicrotask(() => {
    const storedTerm = getStoredTerm();
    const storedMilestones = getStoredMilestones();

    setTerm(storedTerm);
    setTermDraft(storedTerm);
    setMilestones(storedMilestones);
      });
  }, []);

  const filteredMilestones = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return milestones.filter((milestone) => {
      const searchable = [
        milestone.title,
        milestone.type,
        milestone.dateRange,
        milestone.owner,
        milestone.affectedPortal,
        milestone.status,
      ]
        .join(" ")
        .toLowerCase();

      return !query || searchable.includes(query);
    });
  }, [milestones, searchQuery]);

  const openMilestones = milestones.filter(
    (milestone) => milestone.status === "Open",
  ).length;
  const scheduledMilestones = milestones.filter(
    (milestone) => milestone.status === "Scheduled",
  ).length;
  const closedMilestones = milestones.filter(
    (milestone) => milestone.status === "Closed",
  ).length;

  function updateTermDraft(field: keyof TermDraft, value: string) {
    setTermDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveTerm() {
    const nextTerm: AcademicTerm = {
      schoolYear: termDraft.schoolYear.trim() || "2025-2026",
      semester: termDraft.semester.trim() || "2nd Semester",
      startDate: termDraft.startDate.trim() || "January 20, 2026",
      endDate: termDraft.endDate.trim() || "June 30, 2026",
      status: termDraft.status,
    };

    setTerm(nextTerm);
    saveStoredTerm(nextTerm);
    setTermEditing(false);
  }

  function cancelTermEdit() {
    setTermDraft(term);
    setTermEditing(false);
  }

  function updateMilestones(nextMilestones: MilestoneRecord[]) {
    setMilestones(nextMilestones);
    saveStoredMilestones(nextMilestones);
  }

  function startAddMilestone() {
    setEditingMilestoneId("new");
    setMilestoneDraft(createMilestoneDraft());
  }

  function startEditMilestone(milestone: MilestoneRecord) {
    setEditingMilestoneId(milestone.id);
    setMilestoneDraft(createMilestoneDraft(milestone));
  }

  function cancelMilestoneEdit() {
    setEditingMilestoneId(null);
    setMilestoneDraft(createMilestoneDraft());
  }

  function updateMilestoneDraft(
    field: keyof MilestoneDraft,
    value: string,
  ) {
    setMilestoneDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveMilestone() {
    const title = milestoneDraft.title.trim();
    const dateRange = milestoneDraft.dateRange.trim();
    const owner = milestoneDraft.owner.trim();
    const affectedPortal = milestoneDraft.affectedPortal.trim();

    if (!title || !dateRange || !owner || !affectedPortal) {
      window.alert(
        "Milestone title, date range, owner, and affected portal are required.",
      );
      return;
    }

    const nextMilestone: MilestoneRecord = {
      id:
        editingMilestoneId === "new"
          ? Date.now()
          : Number(editingMilestoneId),
      title,
      type: milestoneDraft.type,
      dateRange,
      owner,
      affectedPortal,
      status: milestoneDraft.status,
    };

    if (editingMilestoneId === "new") {
      updateMilestones([nextMilestone, ...milestones]);
    } else {
      updateMilestones(
        milestones.map((milestone) =>
          milestone.id === nextMilestone.id ? nextMilestone : milestone,
        ),
      );
    }

    cancelMilestoneEdit();
  }

  function deleteMilestone(id: number) {
    const milestone = milestones.find((item) => item.id === id);
    if (!milestone) return;

    const confirmed = window.confirm(
      `Delete ${milestone.title}? This removes the timeline milestone.`,
    );

    if (!confirmed) return;

    updateMilestones(milestones.filter((item) => item.id !== id));

    if (editingMilestoneId === id) {
      cancelMilestoneEdit();
    }
  }

  return (
    <DeanShell title="Academic Terms">
      <div className="space-y-5">
        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-4 shadow-sm">
          <div className="flex min-w-[840px] divide-x divide-[#edf2ec]">
            {[
              ["School Year", term.schoolYear, "Current academic year"],
              ["Semester", term.semester, "Active term"],
              ["Open", openMilestones, "Open milestones"],
              ["Scheduled", scheduledMilestones, "Upcoming items"],
              ["Closed", closedMilestones, "Completed windows"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#7b877f]">
                  {label}
                </p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-xl font-semibold leading-none text-[#203028]">
                    {value}
                  </p>
                  <p className="pb-0.5 text-[10px] leading-4 text-[#7b877f]">
                    {caption}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-semibold text-[#203028]">
                  Current Academic Term
                </h2>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${termStatusClasses(
                    term.status,
                  )}`}
                >
                  {term.status}
                </span>
              </div>

              <p className="mt-1 text-sm text-[#7b877f]">
                Configure school year, semester, term dates, and capstone
                timeline windows.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setTermEditing(true)}
              className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]"
            >
              Edit Term
            </button>
          </div>

          {!termEditing ? (
            <div className="mt-5 grid gap-3 md:grid-cols-4">
              <DetailBox label="School Year" value={term.schoolYear} />
              <DetailBox label="Semester" value={term.semester} />
              <DetailBox label="Start Date" value={term.startDate} />
              <DetailBox label="End Date" value={term.endDate} />
            </div>
          ) : (
            <div className="mt-5 rounded-xl border border-[#bfe9c5] bg-[#f7fff8] p-4">
              <div className="grid gap-3 md:grid-cols-5">
                <TextField
                  label="School Year"
                  value={termDraft.schoolYear}
                  onChange={(value) =>
                    updateTermDraft("schoolYear", value)
                  }
                />
                <TextField
                  label="Semester"
                  value={termDraft.semester}
                  onChange={(value) => updateTermDraft("semester", value)}
                />
                <TextField
                  label="Start Date"
                  value={termDraft.startDate}
                  onChange={(value) => updateTermDraft("startDate", value)}
                />
                <TextField
                  label="End Date"
                  value={termDraft.endDate}
                  onChange={(value) => updateTermDraft("endDate", value)}
                />

                <label className="block text-xs font-semibold text-[#59645d]">
                  Status
                  <select
                    value={termDraft.status}
                    onChange={(event) =>
                      updateTermDraft("status", event.target.value)
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  >
                    {termStatusOptions.map((status) => (
                      <option key={status}>{status}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelTermEdit}
                  className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={saveTerm}
                  className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
                >
                  Save Term
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-3 shadow-sm">
          <div className="flex min-w-[760px] items-end gap-3">
            <label className="w-[420px] shrink-0 text-xs font-semibold text-[#59645d]">
              Search Milestone
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search title, owner, portal..."
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="h-10 w-[120px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={startAddMilestone}
              className="h-10 w-[150px] shrink-0 rounded-lg bg-[#123f2b] px-4 text-xs font-semibold text-white hover:bg-[#0f3324]"
            >
              Add Milestone
            </button>
          </div>
        </section>

        {editingMilestoneId === "new" && (
          <MilestoneEditor
            title="Add Timeline Milestone"
            draft={milestoneDraft}
            onChange={updateMilestoneDraft}
            onSave={saveMilestone}
            onCancel={cancelMilestoneEdit}
          />
        )}

        <section className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-sm">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Capstone Timeline
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Maintain submission deadlines, review windows, defense windows,
              and final approval dates.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredMilestones.map((milestone) => {
              const editing = editingMilestoneId === milestone.id;

              return (
                <div key={milestone.id} className="px-5 py-4">
                  <div className="grid gap-4 xl:grid-cols-[260px_180px_1fr_180px_auto] xl:items-center">
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {milestone.title}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {milestone.dateRange}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Type
                      </p>
                      <p className="mt-1 text-sm text-[#59645d]">
                        {milestone.type}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Owner / Portal
                      </p>
                      <p className="mt-1 text-sm text-[#59645d]">
                        {milestone.owner} • {milestone.affectedPortal}
                      </p>
                    </div>

                    <div>
                      <span
                        className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${milestoneStatusClasses(
                          milestone.status,
                        )}`}
                      >
                        {milestone.status}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() => startEditMilestone(milestone)}
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteMilestone(milestone.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {editing && (
                    <MilestoneEditor
                      title={`Edit ${milestone.title}`}
                      draft={milestoneDraft}
                      onChange={updateMilestoneDraft}
                      onSave={saveMilestone}
                      onCancel={cancelMilestoneEdit}
                    />
                  )}
                </div>
              );
            })}

            {filteredMilestones.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No milestones found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the search.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </DeanShell>
  );
}

function MilestoneEditor({
  title,
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  title: string;
  draft: MilestoneDraft;
  onChange: (field: keyof MilestoneDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="mt-4 rounded-xl border border-[#bfe9c5] bg-[#f7fff8] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#203028]">{title}</h3>
          <p className="mt-1 text-xs text-[#7b877f]">
            Dates can be single dates or date windows, for example: May 22 - May
            30, 2026.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSave}
            className="rounded-lg bg-[#123f2b] px-4 py-2 text-xs font-semibold text-white hover:bg-[#0f3324]"
          >
            Save
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr_1fr_1fr_0.8fr_0.7fr]">
        <TextField
          label="Title"
          value={draft.title}
          onChange={(value) => onChange("title", value)}
        />

        <label className="block text-xs font-semibold text-[#59645d]">
          Type
          <select
            value={draft.type}
            onChange={(event) => onChange("type", event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          >
            {milestoneTypeOptions.map((type) => (
              <option key={type}>{type}</option>
            ))}
          </select>
        </label>

        <TextField
          label="Date / Window"
          value={draft.dateRange}
          onChange={(value) => onChange("dateRange", value)}
        />

        <TextField
          label="Owner"
          value={draft.owner}
          onChange={(value) => onChange("owner", value)}
        />

        <TextField
          label="Affected Portal"
          value={draft.affectedPortal}
          onChange={(value) => onChange("affectedPortal", value)}
        />

        <label className="block text-xs font-semibold text-[#59645d]">
          Status
          <select
            value={draft.status}
            onChange={(event) => onChange("status", event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          >
            {milestoneStatusOptions.map((status) => (
              <option key={status}>{status}</option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-[#59645d]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      />
    </label>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8faf7] p-4">
      <p className="text-xs text-[#7b877f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#203028]">{value}</p>
    </div>
  );
}
