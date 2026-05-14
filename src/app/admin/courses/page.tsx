"use client";

import { useMemo, useState } from "react";
import AdminShell from "../_components/AdminShell";

type CourseStatus = "Active" | "Inactive";

type CourseRecord = {
  id: number;
  code: string;
  name: string;
  sections: string[];
  groups: number;
  advisers: number;
  status: CourseStatus;
};

type CourseDraft = {
  code: string;
  name: string;
  sections: string;
  groups: string;
  advisers: string;
  status: CourseStatus;
};

const initialCourses: CourseRecord[] = [
  {
    id: 1,
    code: "BSIT",
    name: "Bachelor of Science in Information Technology",
    sections: ["4A", "4B", "4C", "4D"],
    groups: 8,
    advisers: 4,
    status: "Active",
  },
  {
    id: 2,
    code: "BSIS",
    name: "Bachelor of Science in Information Systems",
    sections: ["4A", "4B"],
    groups: 3,
    advisers: 2,
    status: "Active",
  },
  {
    id: 3,
    code: "BSCS",
    name: "Bachelor of Science in Computer Science",
    sections: ["4A", "4B", "4C"],
    groups: 5,
    advisers: 3,
    status: "Active",
  },
  {
    id: 4,
    code: "BLIS",
    name: "Bachelor of Library and Information Science",
    sections: ["4A", "4B"],
    groups: 2,
    advisers: 1,
    status: "Active",
  },
  {
    id: 5,
    code: "ACT",
    name: "Associate in Computer Technology",
    sections: ["2A", "2B"],
    groups: 2,
    advisers: 1,
    status: "Active",
  },
];

const statusOptions: ("All" | CourseStatus)[] = ["All", "Active", "Inactive"];

function statusClasses(status: CourseStatus) {
  if (status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function createDraft(course?: CourseRecord): CourseDraft {
  return {
    code: course?.code || "",
    name: course?.name || "",
    sections: course?.sections.join(", ") || "",
    groups: String(course?.groups ?? 0),
    advisers: String(course?.advisers ?? 0),
    status: course?.status || "Active",
  };
}

function parseSections(value: string) {
  return value
    .split(",")
    .map((section) => section.trim())
    .filter(Boolean);
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<CourseRecord[]>(initialCourses);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | CourseStatus>("All");
  const [openCourseId, setOpenCourseId] = useState<number | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<number | "new" | null>(
    null,
  );
  const [draft, setDraft] = useState<CourseDraft>(createDraft());

  const filteredCourses = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return courses.filter((course) => {
      const searchable = [
        course.code,
        course.name,
        course.sections.join(" "),
        course.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesStatus =
        statusFilter === "All" || course.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [courses, searchQuery, statusFilter]);

  const totalCourses = courses.length;
  const activeCourses = courses.filter(
    (course) => course.status === "Active",
  ).length;
  const totalSections = courses.reduce(
    (sum, course) => sum + course.sections.length,
    0,
  );
  const totalGroups = courses.reduce((sum, course) => sum + course.groups, 0);
  const totalAdvisers = courses.reduce(
    (sum, course) => sum + course.advisers,
    0,
  );

  function resetFilters() {
    setSearchQuery("");
    setStatusFilter("All");
  }

  function startAddCourse() {
    setEditingCourseId("new");
    setOpenCourseId(null);
    setDraft(createDraft());
  }

  function startEditCourse(course: CourseRecord) {
    setEditingCourseId(course.id);
    setOpenCourseId(course.id);
    setDraft(createDraft(course));
  }

  function cancelEdit() {
    setEditingCourseId(null);
    setDraft(createDraft());
  }

  function updateDraft(field: keyof CourseDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function saveCourse() {
    const code = draft.code.trim().toUpperCase();
    const name = draft.name.trim();
    const sections = parseSections(draft.sections);

    if (!code || !name || sections.length === 0) {
      window.alert("Course code, course name, and at least one section are required.");
      return;
    }

    const nextCourse: CourseRecord = {
      id: editingCourseId === "new" ? Date.now() : Number(editingCourseId),
      code,
      name,
      sections,
      groups: Number(draft.groups) || 0,
      advisers: Number(draft.advisers) || 0,
      status: draft.status,
    };

    setCourses((current) => {
      if (editingCourseId === "new") {
        return [nextCourse, ...current];
      }

      return current.map((course) =>
        course.id === nextCourse.id ? nextCourse : course,
      );
    });

    setOpenCourseId(nextCourse.id);
    cancelEdit();
  }

  function deleteCourse(courseId: number) {
    const course = courses.find((item) => item.id === courseId);
    if (!course) return;

    const confirmed = window.confirm(
      `Delete ${course.code}? This removes the course from the admin setup list.`,
    );

    if (!confirmed) return;

    setCourses((current) => current.filter((item) => item.id !== courseId));

    if (openCourseId === courseId) {
      setOpenCourseId(null);
    }

    if (editingCourseId === courseId) {
      cancelEdit();
    }
  }

  return (
    <AdminShell title="Courses & Sections">
      <div className="space-y-5">
        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-4 shadow-sm">
          <div className="flex min-w-[860px] divide-x divide-[#edf2ec]">
            {[
              ["Courses", totalCourses, "Programs listed"],
              ["Active", activeCourses, "Available courses"],
              ["Sections", totalSections, "Configured sections"],
              ["Groups", totalGroups, "Assigned groups"],
              ["Advisers", totalAdvisers, "Linked advisers"],
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
          <div className="flex min-w-[860px] items-end gap-3">
            <label className="w-[390px] shrink-0 text-xs font-semibold text-[#59645d]">
              Search
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search course, section, or program..."
                className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
              />
            </label>

            <label className="w-[180px] shrink-0 text-xs font-semibold text-[#59645d]">
              Status
              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value as "All" | CourseStatus)
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
              className="h-10 w-[120px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
            >
              Reset
            </button>

            <button
              type="button"
              onClick={startAddCourse}
              className="h-10 w-[130px] shrink-0 rounded-lg bg-[#202823] px-4 text-xs font-semibold text-white hover:bg-[#303a33]"
            >
              Add Course
            </button>
          </div>
        </section>

        {editingCourseId === "new" && (
          <CourseEditor
            title="Add Course"
            draft={draft}
            onChange={updateDraft}
            onSave={saveCourse}
            onCancel={cancelEdit}
          />
        )}

        <section className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-sm">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <h2 className="text-lg font-semibold text-[#203028]">
              Course Directory
            </h2>
            <p className="mt-1 text-sm text-[#7b877f]">
              Manage course codes, program names, sections, assigned groups, and adviser coverage.
            </p>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredCourses.map((course) => {
              const open = openCourseId === course.id;
              const editing = editingCourseId === course.id;

              return (
                <div key={course.id} className="px-5 py-4">
                  <div className="grid gap-4 xl:grid-cols-[180px_1fr_360px_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-lg font-semibold text-[#203028]">
                          {course.code}
                        </p>
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                            course.status,
                          )}`}
                        >
                          {course.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {course.sections.length} section
                        {course.sections.length === 1 ? "" : "s"}
                      </p>
                    </div>

                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {course.name}
                      </p>
                      <p className="mt-1 text-xs text-[#59645d]">
                        {course.groups} groups assigned • {course.advisers} advisers linked
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {course.sections.map((section) => (
                        <span
                          key={section}
                          className="rounded-full border border-[#dfe8df] bg-[#fbfdfb] px-2.5 py-1 text-[11px] font-semibold text-[#59645d]"
                        >
                          {course.code} {section}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenCourseId((current) =>
                            current === course.id ? null : course.id,
                          )
                        }
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        {open ? "Close" : "Open"}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEditCourse(course)}
                        className="rounded-lg border border-[#dfe8df] px-3 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => deleteCourse(course.id)}
                        className="rounded-lg border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  {open && !editing && (
                    <div className="mt-4 grid gap-3 rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4 md:grid-cols-4">
                      <DetailBox label="Course Code" value={course.code} />
                      <DetailBox
                        label="Sections"
                        value={course.sections.join(", ")}
                      />
                      <DetailBox
                        label="Assigned Groups"
                        value={String(course.groups)}
                      />
                      <DetailBox
                        label="Linked Advisers"
                        value={String(course.advisers)}
                      />
                    </div>
                  )}

                  {editing && (
                    <CourseEditor
                      title={`Edit ${course.code}`}
                      draft={draft}
                      onChange={updateDraft}
                      onSave={saveCourse}
                      onCancel={cancelEdit}
                    />
                  )}
                </div>
              );
            })}

            {filteredCourses.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No courses found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the search or status filter.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </AdminShell>
  );
}

function CourseEditor({
  title,
  draft,
  onChange,
  onSave,
  onCancel,
}: {
  title: string;
  draft: CourseDraft;
  onChange: (field: keyof CourseDraft, value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) {
  return (
    <section className="mt-4 rounded-xl border border-[#bfe9c5] bg-[#f7fff8] p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#203028]">{title}</h3>
          <p className="mt-1 text-xs text-[#7b877f]">
            Use comma-separated values for sections, for example: 4A, 4B, 4C.
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
            className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
          >
            Save
          </button>
        </div>
      </div>

      <div className="mt-4 grid gap-3 lg:grid-cols-[0.6fr_1.5fr_1fr_0.6fr_0.6fr_0.7fr]">
        <TextField
          label="Code"
          value={draft.code}
          onChange={(value) => onChange("code", value)}
        />
        <TextField
          label="Program Name"
          value={draft.name}
          onChange={(value) => onChange("name", value)}
        />
        <TextField
          label="Sections"
          value={draft.sections}
          onChange={(value) => onChange("sections", value)}
        />
        <TextField
          label="Groups"
          value={draft.groups}
          onChange={(value) => onChange("groups", value)}
        />
        <TextField
          label="Advisers"
          value={draft.advisers}
          onChange={(value) => onChange("advisers", value)}
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

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[11px] font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#203028]">{value}</p>
    </div>
  );
}
