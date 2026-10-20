"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../../_components/DeanShell";

type PanelistStatus = "Available" | "Assigned" | "Unavailable";
type PanelistRole = "Chairperson" | "Panelist" | "Technical Panel" | "Documentation Panel";
type StatusFilter = "All" | PanelistStatus;

type PanelistRecord = {
  id: number;
  name: string;
  email: string;
  role: PanelistRole;
  course: string;
  expertise: string[];
  assignedDefenses: string[];
  pendingEvaluations: number;
  status: PanelistStatus;
};

type PanelistDraft = {
  name: string;
  email: string;
  role: PanelistRole;
  course: string;
  expertise: string;
  assignedDefenses: string;
  pendingEvaluations: string;
  status: PanelistStatus;
};

const ADMIN_PANELISTS_STORAGE_KEY = "project-pulse-admin-panelists";

const defaultPanelists: PanelistRecord[] = [
  {
    id: 1,
    name: "Dr. Santos",
    email: "santos@ub.edu.ph",
    role: "Chairperson",
    course: "BSIT",
    expertise: ["Capstone Evaluation", "Research Design"],
    assignedDefenses: ["Project Pulse", "CodeCraft"],
    pendingEvaluations: 2,
    status: "Assigned",
  },
  {
    id: 2,
    name: "Prof. Lim",
    email: "lim@ub.edu.ph",
    role: "Technical Panel",
    course: "BSCS",
    expertise: ["System Architecture", "Algorithms"],
    assignedDefenses: ["AlgorithmX"],
    pendingEvaluations: 1,
    status: "Available",
  },
  {
    id: 3,
    name: "Ms. Reyes",
    email: "reyes@ub.edu.ph",
    role: "Documentation Panel",
    course: "BSIS",
    expertise: ["Documentation", "Records Systems"],
    assignedDefenses: ["ArchiveLink"],
    pendingEvaluations: 1,
    status: "Assigned",
  },
  {
    id: 4,
    name: "Engr. Dela Cruz",
    email: "delacruz@ub.edu.ph",
    role: "Panelist",
    course: "BSIT",
    expertise: ["Software Engineering", "Quality Assurance"],
    assignedDefenses: [],
    pendingEvaluations: 0,
    status: "Unavailable",
  },
];

const courseOptions = ["All", "BSIT", "BSIS", "BSCS", "BLIS", "ACT"];
const statusOptions: StatusFilter[] = [
  "All",
  "Available",
  "Assigned",
  "Unavailable",
];
const roleOptions: PanelistRole[] = [
  "Chairperson",
  "Panelist",
  "Technical Panel",
  "Documentation Panel",
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getStoredPanelists() {
  if (!canUseStorage()) return defaultPanelists;

  const saved = window.localStorage.getItem(ADMIN_PANELISTS_STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(
      ADMIN_PANELISTS_STORAGE_KEY,
      JSON.stringify(defaultPanelists),
    );

    return defaultPanelists;
  }

  return JSON.parse(saved) as PanelistRecord[];
}

function saveStoredPanelists(panelists: PanelistRecord[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    ADMIN_PANELISTS_STORAGE_KEY,
    JSON.stringify(panelists),
  );
}

function statusClasses(status: PanelistStatus) {
  if (status === "Available") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Assigned") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function workloadClasses(count: number) {
  if (count >= 3) return "border-rose-200 bg-rose-50 text-rose-700";
  if (count >= 1) return "border-amber-200 bg-amber-50 text-amber-700";
  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function splitList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function createDraft(panelist?: PanelistRecord): PanelistDraft {
  return {
    name: panelist?.name || "",
    email: panelist?.email || "",
    role: panelist?.role || "Panelist",
    course: panelist?.course || "BSIT",
    expertise: panelist?.expertise.join(", ") || "",
    assignedDefenses: panelist?.assignedDefenses.join(", ") || "",
    pendingEvaluations: String(panelist?.pendingEvaluations ?? 0),
    status: panelist?.status || "Available",
  };
}

export default function DeanPanelistsPage() {
  const [panelists, setPanelists] =
    useState<PanelistRecord[]>(defaultPanelists);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [openPanelistId, setOpenPanelistId] = useState<number | null>(null);
  const [editingPanelistId, setEditingPanelistId] = useState<
    number | "new" | null
  >(null);
  const [draft, setDraft] = useState<PanelistDraft>(createDraft());

  useEffect(() => {
    queueMicrotask(() => {
    setPanelists(getStoredPanelists());
      });
  }, []);

  function updatePanelists(nextPanelists: PanelistRecord[]) {
    setPanelists(nextPanelists);
    saveStoredPanelists(nextPanelists);
  }

  const filteredPanelists = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return panelists.filter((panelist) => {
      const searchable = [
        panelist.name,
        panelist.email,
        panelist.role,
        panelist.course,
        panelist.status,
        panelist.expertise.join(" "),
        panelist.assignedDefenses.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCourse =
        courseFilter === "All" || panelist.course === courseFilter;
      const matchesStatus =
        statusFilter === "All" || panelist.status === statusFilter;

      return matchesSearch && matchesCourse && matchesStatus;
    });
  }, [courseFilter, panelists, searchQuery, statusFilter]);

  const totalPanelists = panelists.length;
  const availablePanelists = panelists.filter(
    (panelist) => panelist.status === "Available",
  ).length;
  const assignedPanelists = panelists.filter(
    (panelist) => panelist.status === "Assigned",
  ).length;
  const unavailablePanelists = panelists.filter(
    (panelist) => panelist.status === "Unavailable",
  ).length;
  const pendingEvaluations = panelists.reduce(
    (sum, panelist) => sum + panelist.pendingEvaluations,
    0,
  );

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setStatusFilter("All");
  }

  function startAddPanelist() {
    setEditingPanelistId("new");
    setOpenPanelistId(null);
    setDraft(createDraft());
  }

  function startEditPanelist(panelist: PanelistRecord) {
    setEditingPanelistId(panelist.id);
    setOpenPanelistId(panelist.id);
    setDraft(createDraft(panelist));
  }

  function cancelEdit() {
    setEditingPanelistId(null);
    setDraft(createDraft());
  }

  function updateDraft(field: keyof PanelistDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function savePanelist() {
    const name = draft.name.trim();
    const email = draft.email.trim();
    const expertise = splitList(draft.expertise);
    const assignedDefenses = splitList(draft.assignedDefenses);

    if (!name || !email || expertise.length === 0) {
      window.alert("Panelist name, email, and at least one expertise are required.");
      return;
    }

    const nextPanelist: PanelistRecord = {
      id: editingPanelistId === "new" ? Date.now() : Number(editingPanelistId),
      name,
      email,
      role: draft.role,
      course: draft.course,
      expertise,
      assignedDefenses,
      pendingEvaluations: Number(draft.pendingEvaluations) || 0,
      status: draft.status,
    };

    if (editingPanelistId === "new") {
      updatePanelists([nextPanelist, ...panelists]);
    } else {
      updatePanelists(
        panelists.map((panelist) =>
          panelist.id === nextPanelist.id ? nextPanelist : panelist,
        ),
      );
    }

    setOpenPanelistId(nextPanelist.id);
    cancelEdit();
  }

  function deletePanelist(panelistId: number) {
    const panelist = panelists.find((item) => item.id === panelistId);
    if (!panelist) return;

    const confirmed = window.confirm(
      `Delete ${panelist.name}? This removes the panelist assignment record.`,
    );

    if (!confirmed) return;

    updatePanelists(panelists.filter((item) => item.id !== panelistId));

    if (openPanelistId === panelistId) {
      setOpenPanelistId(null);
    }

    if (editingPanelistId === panelistId) {
      cancelEdit();
    }
  }

  return (
    <DeanShell title="Panelist Assignments">
      <div className="space-y-5">
        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-4 shadow-sm">
          <div className="flex min-w-[860px] divide-x divide-[#edf2ec]">
            {[
              ["Panelists", totalPanelists, "Faculty records"],
              ["Available", availablePanelists, "Can be assigned"],
              ["Assigned", assignedPanelists, "In active defenses"],
              ["Unavailable", unavailablePanelists, "Not assignable"],
              ["Pending Eval", pendingEvaluations, "Evaluation forms"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#7b877f]">
                  {label}
                </p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-2xl font-semibold leading-none text-[#203028]">
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

        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-3 shadow-sm">
          <div className="flex min-w-[980px] items-end gap-3">
            <label className="w-[360px] shrink-0 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search panelist, expertise, defense..."
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="w-[150px] shrink-0 text-xs font-semibold text-[#59645d]">
              Course
              <select
                value={courseFilter}
                onChange={(event) => setCourseFilter(event.target.value)}
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {courseOptions.map((course) => (
                  <option key={course}>{course}</option>
                ))}
              </select>
            </label>

            <label className="w-[170px] shrink-0 text-xs font-semibold text-[#59645d]">
              Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as StatusFilter)
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </label>

            <button
              type="button"
              onClick={resetFilters}
              className="h-10 w-[110px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={startAddPanelist}
              className="h-10 w-[130px] shrink-0 rounded-lg bg-[#123f2b] px-4 text-xs font-semibold text-white hover:bg-[#0f3324]"
            >
              Add Panelist
            </button>
          </div>
        </section>

        {editingPanelistId === "new" && (
          <PanelistEditor
            title="Add Panelist"
            draft={draft}
            onChange={updateDraft}
            onSave={savePanelist}
            onCancel={cancelEdit}
          />
        )}

        <section className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-sm">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Panelist Directory
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Manage panelist roles, availability, expertise, assigned defenses,
              and pending evaluation workload.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredPanelists.map((panelist) => {
              const open = openPanelistId === panelist.id;
              const editing = editingPanelistId === panelist.id;

              return (
                <div key={panelist.id} className="px-5 py-4">
                  <div className="grid gap-4 xl:grid-cols-[250px_1fr_390px_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-[#203028]">
                          {panelist.name}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                            panelist.status,
                          )}`}
                        >
                          {panelist.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {panelist.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {panelist.role} • {panelist.course}
                      </p>
                      <p className="mt-1 text-xs text-[#59645d]">
                        {panelist.assignedDefenses.length} assigned defense
                        {panelist.assignedDefenses.length === 1 ? "" : "s"} •{" "}
                        {panelist.pendingEvaluations} pending evaluation
                        {panelist.pendingEvaluations === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <InlineMetric
                        label="Expertise"
                        value={String(panelist.expertise.length)}
                      />
                      <InlineMetric
                        label="Defenses"
                        value={String(panelist.assignedDefenses.length)}
                      />
                      <InlineMetric
                        label="Pending"
                        value={String(panelist.pendingEvaluations)}
                        className={workloadClasses(panelist.pendingEvaluations)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenPanelistId((current) =>
                            current === panelist.id ? null : panelist.id,
                          )
                        }
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        {open ? "Close" : "Open"}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditPanelist(panelist)}
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deletePanelist(panelist.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {open && !editing && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4 lg:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-[#7b877f]">
                          Expertise
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {panelist.expertise.map((item) => (
                            <span
                              key={item}
                              className="rounded-full border border-[#dfe8df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#59645d]"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-semibold text-[#7b877f]">
                          Assigned Defenses
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {panelist.assignedDefenses.length === 0 ? (
                            <span className="rounded-full border border-[#dfe8df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#59645d]">
                              No assigned defenses
                            </span>
                          ) : (
                            panelist.assignedDefenses.map((defense) => (
                              <span
                                key={defense}
                                className="rounded-full border border-[#dfe8df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#59645d]"
                              >
                                {defense}
                              </span>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {editing && (
                    <PanelistEditor
                      title={`Edit ${panelist.name}`}
                      draft={draft}
                      onChange={updateDraft}
                      onSave={savePanelist}
                      onCancel={cancelEdit}
                    />
                  )}
                </div>
              );
            })}

            {filteredPanelists.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No panelists found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the search, course, or status filter.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </DeanShell>
  );
}

function InlineMetric({
  label,
  value,
  className = "border-[#dfe8df] bg-[#fbfdfb] text-[#59645d]",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className="rounded-lg border border-[#edf2ec] bg-[#f8faf7] px-3 py-2">
      <p className="text-[10px] font-semibold text-[#7b877f]">{label}</p>
      <p
        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${className}`}
      >
        {value}
      </p>
    </div>
  );
}

function PanelistEditor({
  title,
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  title: string;
  draft: PanelistDraft;
  onChange: (field: keyof PanelistDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="mt-4 rounded-xl border border-[#bfe9c5] bg-[#f7fff8] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#203028]">{title}</h3>
          <p className="mt-1 text-xs text-[#7b877f]">
            Use comma-separated values for expertise and assigned defenses.
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

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr_0.8fr_0.8fr]">
        <TextField
          label="Panelist Name"
          value={draft.name}
          onChange={(value) => onChange("name", value)}
        />

        <TextField
          label="Email"
          value={draft.email}
          onChange={(value) => onChange("email", value)}
        />

        <label className="block text-xs font-semibold text-[#59645d]">
          Role
          <select
            value={draft.role}
            onChange={(event) => onChange("role", event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          >
            {roleOptions.map((role) => (
              <option key={role}>{role}</option>
            ))}
          </select>
        </label>

        <label className="block text-xs font-semibold text-[#59645d]">
          Course
          <select
            value={draft.course}
            onChange={(event) => onChange("course", event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          >
            {courseOptions
              .filter((course) => course !== "All")
              .map((course) => (
                <option key={course}>{course}</option>
              ))}
          </select>
        </label>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_1.2fr_0.5fr_0.7fr]">
        <TextField
          label="Expertise"
          value={draft.expertise}
          onChange={(value) => onChange("expertise", value)}
        />

        <TextField
          label="Assigned Defenses"
          value={draft.assignedDefenses}
          onChange={(value) => onChange("assignedDefenses", value)}
        />

        <TextField
          label="Pending Eval"
          value={draft.pendingEvaluations}
          onChange={(value) => onChange("pendingEvaluations", value)}
        />

        <label className="block text-xs font-semibold text-[#59645d]">
          Status
          <select
            value={draft.status}
            onChange={(event) => onChange("status", event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          >
            <option>Available</option>
            <option>Assigned</option>
            <option>Unavailable</option>
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
