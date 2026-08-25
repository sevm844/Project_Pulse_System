"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../_components/AdminShell";

type AdviserStatus = "Active" | "Inactive";
type WorkloadFilter = "All" | "Light" | "Moderate" | "High";

type AdviserRecord = {
  id: number;
  name: string;
  email: string;
  course: string;
  assignedGroups: string[];
  pendingReviews: number;
  completedReviews: number;
  defenseEndorsements: number;
  status: AdviserStatus;
};

type AdviserDraft = {
  name: string;
  email: string;
  course: string;
  assignedGroups: string;
  pendingReviews: string;
  completedReviews: string;
  defenseEndorsements: string;
  status: AdviserStatus;
};

const ADMIN_ADVISERS_STORAGE_KEY = "project-pulse-admin-advisers";

const defaultAdvisers: AdviserRecord[] = [
  {
    id: 1,
    name: "Anna Cruz",
    email: "anna.cruz@ub.edu.ph",
    course: "BSIT",
    assignedGroups: ["Project Pulse", "CodeCraft", "WBS Test Group"],
    pendingReviews: 5,
    completedReviews: 18,
    defenseEndorsements: 1,
    status: "Active",
  },
  {
    id: 2,
    name: "Marco Reyes",
    email: "marco.reyes@ub.edu.ph",
    course: "BSIS",
    assignedGroups: ["ArchiveLink"],
    pendingReviews: 1,
    completedReviews: 9,
    defenseEndorsements: 0,
    status: "Active",
  },
  {
    id: 3,
    name: "Elena Rivera",
    email: "elena.rivera@ub.edu.ph",
    course: "BSCS",
    assignedGroups: ["AlgorithmX", "DataForge", "NetSecure", "VisionTrack"],
    pendingReviews: 7,
    completedReviews: 14,
    defenseEndorsements: 2,
    status: "Active",
  },
];

const courseOptions = ["All", "BSIT", "BSIS", "BSCS", "BLIS", "ACT"];
const workloadOptions: WorkloadFilter[] = ["All", "Light", "Moderate", "High"];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getStoredAdvisers() {
  if (!canUseStorage()) return defaultAdvisers;

  const saved = window.localStorage.getItem(ADMIN_ADVISERS_STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(
      ADMIN_ADVISERS_STORAGE_KEY,
      JSON.stringify(defaultAdvisers),
    );

    return defaultAdvisers;
  }

  return JSON.parse(saved) as AdviserRecord[];
}

function saveStoredAdvisers(advisers: AdviserRecord[]) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    ADMIN_ADVISERS_STORAGE_KEY,
    JSON.stringify(advisers),
  );
}

function getWorkload(adviser: AdviserRecord): Exclude<WorkloadFilter, "All"> {
  if (adviser.pendingReviews >= 6 || adviser.assignedGroups.length >= 4) {
    return "High";
  }

  if (adviser.pendingReviews >= 3 || adviser.assignedGroups.length >= 2) {
    return "Moderate";
  }

  return "Light";
}

function workloadClasses(workload: string) {
  if (workload === "High") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (workload === "Moderate") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-emerald-200 bg-emerald-50 text-emerald-700";
}

function statusClasses(status: AdviserStatus) {
  if (status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function parseGroups(value: string) {
  return value
    .split(",")
    .map((group) => group.trim())
    .filter(Boolean);
}

function createDraft(adviser?: AdviserRecord): AdviserDraft {
  return {
    name: adviser?.name || "",
    email: adviser?.email || "",
    course: adviser?.course || "BSIT",
    assignedGroups: adviser?.assignedGroups.join(", ") || "",
    pendingReviews: String(adviser?.pendingReviews ?? 0),
    completedReviews: String(adviser?.completedReviews ?? 0),
    defenseEndorsements: String(adviser?.defenseEndorsements ?? 0),
    status: adviser?.status || "Active",
  };
}

export default function AdminAdvisersPage() {
  const [advisers, setAdvisers] = useState<AdviserRecord[]>(defaultAdvisers);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("All");
  const [workloadFilter, setWorkloadFilter] = useState<WorkloadFilter>("All");
  const [openAdviserId, setOpenAdviserId] = useState<number | null>(null);
  const [editingAdviserId, setEditingAdviserId] = useState<
    number | "new" | null
  >(null);
  const [draft, setDraft] = useState<AdviserDraft>(createDraft());

  useEffect(() => {
    setAdvisers(getStoredAdvisers());
  }, []);

  function updateAdvisers(nextAdvisers: AdviserRecord[]) {
    setAdvisers(nextAdvisers);
    saveStoredAdvisers(nextAdvisers);
  }

  const filteredAdvisers = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return advisers.filter((adviser) => {
      const workload = getWorkload(adviser);
      const searchable = [
        adviser.name,
        adviser.email,
        adviser.course,
        adviser.status,
        workload,
        adviser.assignedGroups.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCourse =
        courseFilter === "All" || adviser.course === courseFilter;
      const matchesWorkload =
        workloadFilter === "All" || workload === workloadFilter;

      return matchesSearch && matchesCourse && matchesWorkload;
    });
  }, [advisers, courseFilter, searchQuery, workloadFilter]);

  const totalAdvisers = advisers.length;
  const activeAdvisers = advisers.filter(
    (adviser) => adviser.status === "Active",
  ).length;
  const totalGroups = advisers.reduce(
    (sum, adviser) => sum + adviser.assignedGroups.length,
    0,
  );
  const pendingReviews = advisers.reduce(
    (sum, adviser) => sum + adviser.pendingReviews,
    0,
  );
  const highWorkload = advisers.filter(
    (adviser) => getWorkload(adviser) === "High",
  ).length;

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setWorkloadFilter("All");
  }

  function startAddAdviser() {
    setEditingAdviserId("new");
    setOpenAdviserId(null);
    setDraft(createDraft());
  }

  function startEditAdviser(adviser: AdviserRecord) {
    setEditingAdviserId(adviser.id);
    setOpenAdviserId(adviser.id);
    setDraft(createDraft(adviser));
  }

  function cancelEdit() {
    setEditingAdviserId(null);
    setDraft(createDraft());
  }

  function updateDraft(field: keyof AdviserDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveAdviser() {
    const name = draft.name.trim();
    const email = draft.email.trim();
    const assignedGroups = parseGroups(draft.assignedGroups);

    if (!name || !email || assignedGroups.length === 0) {
      window.alert("Adviser name, email, and at least one group are required.");
      return;
    }

    const nextAdviser: AdviserRecord = {
      id: editingAdviserId === "new" ? Date.now() : Number(editingAdviserId),
      name,
      email,
      course: draft.course,
      assignedGroups,
      pendingReviews: Number(draft.pendingReviews) || 0,
      completedReviews: Number(draft.completedReviews) || 0,
      defenseEndorsements: Number(draft.defenseEndorsements) || 0,
      status: draft.status,
    };

    if (editingAdviserId === "new") {
      updateAdvisers([nextAdviser, ...advisers]);
    } else {
      updateAdvisers(
        advisers.map((adviser) =>
          adviser.id === nextAdviser.id ? nextAdviser : adviser,
        ),
      );
    }

    setOpenAdviserId(nextAdviser.id);
    cancelEdit();
  }

  function deleteAdviser(adviserId: number) {
    const adviser = advisers.find((item) => item.id === adviserId);
    if (!adviser) return;

    const confirmed = window.confirm(
      `Delete ${adviser.name}? This removes the adviser assignment record.`,
    );

    if (!confirmed) return;

    updateAdvisers(advisers.filter((item) => item.id !== adviserId));

    if (openAdviserId === adviserId) {
      setOpenAdviserId(null);
    }

    if (editingAdviserId === adviserId) {
      cancelEdit();
    }
  }

  return (
    <AdminShell title="Adviser Assignments">
      <div className="space-y-5">
        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-4 shadow-sm">
          <div className="flex min-w-[860px] divide-x divide-[#edf2ec]">
            {[
              ["Advisers", totalAdvisers, "Faculty records"],
              ["Active", activeAdvisers, "Available advisers"],
              ["Groups", totalGroups, "Assigned groups"],
              ["Pending Reviews", pendingReviews, "Needs action"],
              ["High Load", highWorkload, "Overloaded advisers"],
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
                placeholder="Search adviser, email, group..."
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
              Workload
              <select
                value={workloadFilter}
                onChange={(event) =>
                  setWorkloadFilter(event.target.value as WorkloadFilter)
                }
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              >
                {workloadOptions.map((workload) => (
                  <option key={workload}>{workload}</option>
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
              onClick={startAddAdviser}
              className="h-10 w-[130px] shrink-0 rounded-lg bg-[#123f2b] px-4 text-xs font-semibold text-white hover:bg-[#0f3324]"
            >
              Add Adviser
            </button>
          </div>
        </section>

        {editingAdviserId === "new" && (
          <AdviserEditor
            title="Add Adviser Assignment"
            draft={draft}
            onChange={updateDraft}
            onSave={saveAdviser}
            onCancel={cancelEdit}
          />
        )}

        <section className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-sm">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Adviser Workload Board
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Monitor assigned groups, review load, completed reviews, and defense endorsements.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredAdvisers.map((adviser) => {
              const open = openAdviserId === adviser.id;
              const editing = editingAdviserId === adviser.id;
              const workload = getWorkload(adviser);

              return (
                <div key={adviser.id} className="px-5 py-4">
                  <div className="grid gap-4 xl:grid-cols-[250px_1fr_390px_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-base font-semibold text-[#203028]">
                          {adviser.name}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                            adviser.status,
                          )}`}
                        >
                          {adviser.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {adviser.email}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {adviser.course}
                      </p>
                      <p className="mt-1 text-xs text-[#59645d]">
                        {adviser.assignedGroups.length} assigned group
                        {adviser.assignedGroups.length === 1 ? "" : "s"} •{" "}
                        {adviser.pendingReviews} pending review
                        {adviser.pendingReviews === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <InlineMetric label="Completed" value={String(adviser.completedReviews)} />
                      <InlineMetric label="Defense" value={String(adviser.defenseEndorsements)} />
                      <InlineMetric
                        label="Workload"
                        value={workload}
                        className={workloadClasses(workload)}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenAdviserId((current) =>
                            current === adviser.id ? null : adviser.id,
                          )
                        }
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        {open ? "Close" : "Open"}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditAdviser(adviser)}
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteAdviser(adviser.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {open && !editing && (
                    <div className="mt-4 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4">
                      <p className="text-xs font-semibold text-[#7b877f]">
                        Assigned Groups
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {adviser.assignedGroups.map((group) => (
                          <span
                            key={group}
                            className="rounded-full border border-[#dfe8df] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#59645d]"
                          >
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {editing && (
                    <AdviserEditor
                      title={`Edit ${adviser.name}`}
                      draft={draft}
                      onChange={updateDraft}
                      onSave={saveAdviser}
                      onCancel={cancelEdit}
                    />
                  )}
                </div>
              );
            })}

            {filteredAdvisers.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No advisers found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the search, course, or workload filter.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
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

function AdviserEditor({
  title,
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  title: string;
  draft: AdviserDraft;
  onChange: (field: keyof AdviserDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="mt-4 rounded-xl border border-[#bfe9c5] bg-[#f7fff8] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#203028]">{title}</h3>
          <p className="mt-1 text-xs text-[#7b877f]">
            Use comma-separated group names, for example: Project Pulse,
            CodeCraft.
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

      <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_1.2fr_0.7fr]">
        <TextField
          label="Adviser Name"
          value={draft.name}
          onChange={(value) => onChange("name", value)}
        />
        <TextField
          label="Email"
          value={draft.email}
          onChange={(value) => onChange("email", value)}
        />
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

      <div className="mt-4 grid gap-3 lg:grid-cols-[1.4fr_0.6fr_0.6fr_0.6fr_0.6fr]">
        <TextField
          label="Assigned Groups"
          value={draft.assignedGroups}
          onChange={(value) => onChange("assignedGroups", value)}
        />
        <TextField
          label="Pending"
          value={draft.pendingReviews}
          onChange={(value) => onChange("pendingReviews", value)}
        />
        <TextField
          label="Completed"
          value={draft.completedReviews}
          onChange={(value) => onChange("completedReviews", value)}
        />
        <TextField
          label="Defense"
          value={draft.defenseEndorsements}
          onChange={(value) => onChange("defenseEndorsements", value)}
        />

        <label className="block text-xs font-semibold text-[#59645d]">
          Status
          <select
            value={draft.status}
            onChange={(event) => onChange("status", event.target.value)}
            className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
          >
            <option>Active</option>
            <option>Inactive</option>
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
