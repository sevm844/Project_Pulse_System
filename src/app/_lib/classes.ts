import { apiFetch } from "./api";

// Classes, like the school's learning system: two subjects (AppDev, taught by advisers; CAP101-2, the Dean's), a class has a teacher and a join code.
export type ClassStudent = {
  user_id: number;
  name: string;
  email: string;
  enrolled_at: string | null;
  group_name: string | null;
  // The course and section of the student's group (empty while they have no group).
  course: string | null;
  section: string | null;
};

export type ApiClass = {
  class_id: number;
  subject_code: "APPDEV" | "CAP101-2";
  subject_name: string;
  name: string;
  school_year: string;
  semester: string;
  teacher: string;
  enrollment_open: boolean;
  students_count: number;
  is_teacher: boolean;
  // Only the teacher gets the code.
  join_code?: string;
  // A student's card says which group they work in.
  group_name?: string | null;
  students?: ClassStudent[];
};

export const subjectLabel = (code: string) => (code === "APPDEV" ? "AppDev" : "CAP101-2");

export const fetchClasses = () => apiFetch<ApiClass[]>("/classes");
export const fetchClass = (id: number) => apiFetch<ApiClass>(`/classes/${id}`);

export const createClass = (data: { name: string; school_year: string; semester: string }) =>
  apiFetch<ApiClass>("/classes", { method: "POST", body: JSON.stringify(data) });

export const updateClass = (id: number, data: { name?: string; enrollment_open?: boolean; new_code?: boolean }) =>
  apiFetch<ApiClass>(`/classes/${id}`, { method: "PUT", body: JSON.stringify(data) });

export const removeClassStudent = (classId: number, studentId: number) =>
  apiFetch<{ message: string }>(`/classes/${classId}/students/${studentId}`, { method: "DELETE" });

export const enrollWithCode = (code: string) => apiFetch<ApiClass>("/enroll", { method: "POST", body: JSON.stringify({ code }) });

// The school year the school is in now (June starts a new one), for the "new class" form.
export function currentSchoolYear(now = new Date()) {
  const year = now.getFullYear();

  return now.getMonth() >= 5 ? `${year}-${year + 1}` : `${year - 1}-${year}`;
}
