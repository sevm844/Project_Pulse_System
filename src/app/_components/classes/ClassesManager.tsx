"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import {
  createClass,
  currentSchoolYear,
  fetchClass,
  fetchClasses,
  removeClassStudent,
  subjectLabel,
  updateClass,
  type ApiClass,
} from "../../_lib/classes";
import { errorMessage } from "../../_lib/groups";
import { formatDateTime } from "../../_lib/requirements";
import DashboardCard from "../DashboardCard";
import RowToggle from "../RowToggle";

const SEMESTERS = ["1st Semester", "2nd Semester", "Summer"];

// The course and section labels of the students' groups, for the filter.
const courses = (item: ApiClass) => [...new Set((item.students ?? []).filter((student) => student.course).map((student) => `${student.course} ${student.section}`))].sort();

// The teacher's classes: an adviser's AppDev classes, or the Dean's CAP101-2 class. Each has a join code that students type on their dashboard.
export default function ClassesManager({ role }: { role: "Adviser" | "Dean" }) {
  const subject = role === "Dean" ? "CAP101-2" : "AppDev";
  const [classes, setClasses] = useState<ApiClass[] | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [schoolYear, setSchoolYear] = useState(currentSchoolYear());
  const [semester, setSemester] = useState(SEMESTERS[0]);
  const [busy, setBusy] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);
  const [opened, setOpened] = useState<ApiClass | null>(null);
  const [courseFilter, setCourseFilter] = useState("All");

  const load = useCallback(async () => {
    try {
      setClasses(await fetchClasses());
      setError("");
    } catch (err) {
      setError(errorMessage(err, "Unable to load your classes."));
    }
  }, []);

  useEffect(() => {
    queueMicrotask(() => void load());
  }, [load]);

  async function openClass(id: number) {
    if (openId === id) {
      setOpenId(null);
      setOpened(null);
      return;
    }

    setOpenId(id);
    setOpened(null);

    try {
      setOpened(await fetchClass(id));
    } catch (err) {
      setError(errorMessage(err, "Unable to open the class."));
    }
  }

  async function refreshOpen(id: number, message?: string) {
    if (message) setNotice(message);
    await load();
    try {
      setOpened(await fetchClass(id));
    } catch {
      /* the list is already fresh */
    }
  }

  async function create(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      const made = await createClass({ name: name.trim(), school_year: schoolYear.trim(), semester });
      setAdding(false);
      setName("");
      await load();
      setOpenId(made.class_id);
      setOpened(made);
      setNotice(`The class "${made.name}" is open. Give the code ${made.join_code} to your students.`);
    } catch (err) {
      setError(errorMessage(err, "Unable to open the class."));
    }

    setBusy(false);
  }

  async function change(id: number, data: { enrollment_open?: boolean; new_code?: boolean }, message: string) {
    setError("");

    try {
      await updateClass(id, data);
      await refreshOpen(id, message);
    } catch (err) {
      setError(errorMessage(err, "Unable to change the class."));
    }
  }

  async function remove(classId: number, studentId: number, studentName: string) {
    if (!window.confirm(`Take ${studentName} out of this class?`)) return;

    try {
      await removeClassStudent(classId, studentId);
      await refreshOpen(classId, `${studentName} was taken out of the class.`);
    } catch (err) {
      setError(errorMessage(err, "Unable to remove the student."));
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setNotice(`The code ${code} was copied.`);
    } catch {
      setNotice(`The code is ${code}.`);
    }
  }

  const field = "mt-1 w-full rounded-lg border border-[#dfe3eb] bg-white px-3 py-2.5 text-sm font-normal text-[#203028] outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]";

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <DashboardCard className="p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl">
            <h2 className="text-lg font-semibold tracking-tight text-[#203028]">{subject} classes</h2>
            <p className="mt-1 text-sm leading-6 text-[#7b877f]">
              {role === "Dean"
                ? "Open the CAP101-2 class of the semester. Every student types its code on their dashboard to enroll, and the class appears there as a card."
                : "Open a class for your section. Give its code to your students: they type it on their dashboard to enroll. You then form your groups from the students who enrolled."}
            </p>
          </div>
          {!adding && (
            <button type="button" onClick={() => setAdding(true)} className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324]">
              New class
            </button>
          )}
        </div>

        {adding && (
          <form onSubmit={create} className="mt-5 grid gap-4 rounded-xl border border-[#dfe8df] bg-[#f8faf7] p-5 sm:grid-cols-3">
            <label className="block text-xs font-semibold text-[#203028] sm:col-span-3 lg:col-span-1">
              Class name
              <input value={name} onChange={(event) => setName(event.target.value)} required minLength={2} maxLength={100} placeholder={role === "Dean" ? "CAP101-2" : "BSIT 4A"} className={field} />
            </label>
            <label className="block text-xs font-semibold text-[#203028]">
              School year
              <input value={schoolYear} onChange={(event) => setSchoolYear(event.target.value)} required pattern="\d{4}-\d{4}" placeholder="2026-2027" className={field} />
            </label>
            <label className="block text-xs font-semibold text-[#203028]">
              Semester
              <select value={semester} onChange={(event) => setSemester(event.target.value)} className={field}>
                {SEMESTERS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <div className="flex gap-3 sm:col-span-3">
              <button type="submit" disabled={busy} className="rounded-lg bg-[#123f2b] px-5 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-60">
                {busy ? "Opening..." : "Open the class"}
              </button>
              <button type="button" onClick={() => setAdding(false)} className="rounded-lg border border-[#dfe3eb] bg-white px-5 py-2.5 text-xs font-semibold text-[#203028] hover:bg-[#f4f6f3]">
                Cancel
              </button>
            </div>
          </form>
        )}

        {notice && (
          <p role="status" className="mt-4 text-sm text-[#1d6b34]">
            {notice}
          </p>
        )}
        {error && (
          <p role="alert" className="mt-4 text-sm text-[#b42318]">
            {error}
          </p>
        )}
      </DashboardCard>

      {classes === null && !error && <p className="text-sm text-[#7b877f]">Loading your classes...</p>}

      {classes !== null && classes.length === 0 && (
        <DashboardCard className="p-8 text-center text-sm text-[#7b877f]">You have no class yet. Press New class to open one and get its code.</DashboardCard>
      )}

      {classes !== null && classes.length > 0 && (
        <ul className="space-y-3">
          {classes.map((item) => {
            const open = openId === item.class_id;

            return (
              <li key={item.class_id} className="overflow-hidden rounded-2xl border border-[#dfe8df] bg-white shadow-[0_16px_42px_rgba(31,42,36,0.07)]">
                <button type="button" onClick={() => void openClass(item.class_id)} aria-expanded={open} className="group flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-[#fbfdfb]">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-[#203028]">
                      {subjectLabel(item.subject_code)} · {item.name}
                    </p>
                    <p className="mt-0.5 text-xs text-[#7b877f]">
                      {item.school_year} · {item.semester} · {item.students_count} {item.students_count === 1 ? "student" : "students"}
                    </p>
                  </div>
                  <span className="hidden w-28 shrink-0 text-xs font-semibold text-[#59645d] sm:block">{item.enrollment_open ? "Open to join" : "Enrollment closed"}</span>
                  <RowToggle open={open} />
                </button>

                {open && (
                  <div className="space-y-5 border-t border-[#edf2ec] bg-[#fbfdfb] px-5 py-5">
                    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[#dfe8df] bg-white px-5 py-4">
                      <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#9aa59e]">Join code</p>
                        <p className="mt-1 font-mono text-3xl font-bold tracking-[0.3em] text-[#123f2b]">{item.join_code}</p>
                      </div>
                      <div className="ml-auto flex flex-wrap gap-2">
                        <button type="button" onClick={() => void copy(item.join_code ?? "")} className="rounded-lg border border-[#cfe0d3] bg-white px-3 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4]">
                          Copy code
                        </button>
                        <button
                          type="button"
                          onClick={() => void change(item.class_id, { enrollment_open: !item.enrollment_open }, item.enrollment_open ? "Enrollment is closed: the code no longer works." : "Enrollment is open again.")}
                          className="rounded-lg border border-[#cfe0d3] bg-white px-3 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4]"
                        >
                          {item.enrollment_open ? "Close enrollment" : "Open enrollment"}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm("Make a new code? The old one stops working. Students already enrolled stay enrolled.")) void change(item.class_id, { new_code: true }, "A new code was made.");
                          }}
                          className="rounded-lg border border-[#cfe0d3] bg-white px-3 py-2 text-xs font-semibold text-[#123f2b] hover:bg-[#f3f8f4]"
                        >
                          Make a new code
                        </button>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-sm font-semibold text-[#203028]">Students who enrolled</p>
                        {opened && courses(opened).length > 0 && (
                          <select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} aria-label="Filter by course and section" className="rounded-lg border border-[#dfe3eb] bg-white px-3 py-1.5 text-xs text-[#203028]">
                            <option value="All">All courses and sections</option>
                            {courses(opened).map((label) => (
                              <option key={label}>{label}</option>
                            ))}
                            <option value="None">No group yet</option>
                          </select>
                        )}
                      </div>
                      {opened === null && <p className="mt-2 text-xs text-[#7b877f]">Loading...</p>}
                      {opened && (opened.students ?? []).length === 0 && <p className="mt-2 text-xs text-[#9aa59e]">Nobody has enrolled yet. Give them the code above.</p>}
                      {opened && (opened.students ?? []).length > 0 && (
                        <ul className="mt-3 divide-y divide-[#edf2ec] rounded-xl border border-[#edf2ec] bg-white">
                          {(opened.students ?? []).filter((student) => courseFilter === "All" || (courseFilter === "None" ? !student.course : `${student.course} ${student.section}` === courseFilter)).map((student) => (
                            <li key={student.user_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-[#203028]">{student.name}</p>
                                <p className="truncate text-xs text-[#7b877f]">
                                  {student.email}
                                  {student.enrolled_at ? ` · enrolled ${formatDateTime(student.enrolled_at)}` : ""}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-xs text-[#59645d]">{student.group_name ? `${student.group_name} · ${student.course} ${student.section}` : "No group yet"}</span>
                                <button type="button" onClick={() => void remove(item.class_id, student.user_id, student.name)} className="text-xs font-semibold text-[#b42318] hover:underline">
                                  Remove
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
