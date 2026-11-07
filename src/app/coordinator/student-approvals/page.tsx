"use client";

import { useCallback, useEffect, useState } from "react";
import CoordinatorShell from "../_components/CoordinatorShell";
import Card from "../_components/Card";
import {
  ApiError,
  apiFetch,
  type ApiStudentApproval,
} from "../../_lib/api";
import { formatDate } from "../../_lib/requirements";

type StatusFilter = ApiStudentApproval["account_status"];

const filters: Array<[StatusFilter, string]> = [
  ["Pending", "Pending"],
  ["Rejected", "Rejected"],
  ["Active", "Approved"],
];

export default function CoordinatorStudentApprovalsPage() {
  const [status, setStatus] = useState<StatusFilter>("Pending");
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<ApiStudentApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({ status });
      if (search.trim()) params.set("search", search.trim());

      setStudents(
        await apiFetch<ApiStudentApproval[]>(
          `/student-approvals?${params.toString()}`,
        ),
      );
    } catch (err) {
      setStudents([]);
      setError(
        err instanceof ApiError ? err.message : "Unable to load students.",
      );
    }

    setLoading(false);
  }, [search, status]);

  useEffect(() => {
    // Wait a moment after typing so every keystroke is not a request.
    const timer = setTimeout(() => void loadStudents(), 250);
    return () => clearTimeout(timer);
  }, [loadStudents]);

  async function review(student: ApiStudentApproval, next: "Active" | "Rejected") {
    setSavingId(student.user_id);
    setError("");
    setNotice("");

    try {
      await apiFetch<ApiStudentApproval>(
        `/student-approvals/${student.user_id}`,
        { method: "PUT", body: JSON.stringify({ status: next }) },
      );

      setStudents((current) =>
        current.filter((item) => item.user_id !== student.user_id),
      );
      setNotice(
        `${student.fname} ${student.lname} was ${
          next === "Active" ? "approved" : "rejected"
        }.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Unable to save this decision.",
      );
    }

    setSavingId(null);
  }

  return (
    <CoordinatorShell
      title="Student Approvals"
      subtitle="Check each registrant against your class list, then approve or reject. Approved students can log in and can be added to groups by their adviser."
    >
      <div className="space-y-5">
        <Card className="p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap gap-2">
              {filters.map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setNotice("");
                    setStatus(value);
                  }}
                  className={`rounded-lg px-4 py-2 text-xs font-semibold transition ${
                    status === value
                      ? "bg-[#123f2b] text-white"
                      : "border border-[#dfe8df] bg-white text-[#59645d] hover:bg-[#f3f7f1]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search name or student email..."
              aria-label="Search students"
              className="w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-200 md:max-w-xs"
            />
          </div>

          {error && (
            <p
              role="alert"
              className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600"
            >
              {error}
            </p>
          )}

          {notice && (
            <p
              role="status"
              className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700"
            >
              {notice}
            </p>
          )}
        </Card>

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-[#edf2ec] bg-[#fbfdfb] text-xs text-[#7b877f]">
                <tr>
                  <th className="px-5 py-3 font-medium">Student</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Registered</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Action</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#edf2ec]">
                {students.map((student) => (
                  <tr key={student.user_id}>
                    <td className="px-5 py-4 font-semibold text-[#203028]">
                      {student.fname} {student.lname}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">{student.email}</td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {formatDate(student.created_at) || "-"}
                    </td>
                    <td className="px-5 py-4 text-[#59645d]">
                      {student.account_status === "Active"
                        ? "Approved"
                        : student.account_status}
                    </td>
                    <td className="px-5 py-4">
                      {student.account_status === "Active" ? (
                        <span className="text-xs text-[#7b877f]">
                          Already approved
                        </span>
                      ) : (
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={savingId === student.user_id}
                            onClick={() => review(student, "Active")}
                            className="rounded-lg bg-[#123f2b] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:opacity-50"
                          >
                            Approve
                          </button>

                          {student.account_status === "Pending" && (
                            <button
                              type="button"
                              disabled={savingId === student.user_id}
                              onClick={() => review(student, "Rejected")}
                              className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-50"
                            >
                              Reject
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}

                {students.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-5 py-10 text-center text-sm text-[#7b877f]"
                    >
                      {loading
                        ? "Loading students..."
                        : `No ${
                            status === "Active" ? "approved" : status.toLowerCase()
                          } students found.`}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </CoordinatorShell>
  );
}
