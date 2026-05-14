"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getStoredFinalSubmissions,
  isFinalSubmissionComplete,
  updateFinalSubmission,
  type FinalSubmission,
} from "../../_utils/finalSubmissionStorage";
import { addCurrentUserAuditLog } from "../../_utils/auditLogStorage";

function statusClasses(status: string) {
  if (status === "Validated" || status === "Verified") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "Rejected") return "bg-rose-50 text-rose-700";
  return "bg-amber-50 text-amber-700";
}

export default function RecordsFinalApprovalPage() {
  const [items, setItems] = useState<FinalSubmission[]>([]);

  useEffect(() => {
    setItems(getStoredFinalSubmissions());
  }, []);

  function verifyCertificate(id: number) {
    setItems(
      updateFinalSubmission(id, {
        grammarianCertificateStatus: "Verified",
        remarks: "Grammar certificate verified by records staff.",
      }),
    );

    addCurrentUserAuditLog({
      action: "Verify",
      module: "Final Records Validation",
      details: `Verified grammar certificate for final submission ${id}.`,
    });
  }

  function validateRecords(id: number) {
    const item = items.find((submission) => submission.id === id);
    if (!item) return;

    if (!isFinalSubmissionComplete(item)) {
      setItems(
        updateFinalSubmission(id, {
          recordsValidation: "Rejected",
          status: "Incomplete",
          remarks:
            "Records validation failed because one or more final requirements are missing.",
        }),
      );

      addCurrentUserAuditLog({
        action: "Reject",
        module: "Final Records Validation",
        details: `Rejected final submission ${id} because requirements are incomplete.`,
      });

      return;
    }

    setItems(
      updateFinalSubmission(id, {
        recordsValidation: "Validated",
        status: "For Dean Approval",
        remarks: "Records staff validated the final requirement package.",
      }),
    );

    addCurrentUserAuditLog({
      action: "Validate",
      module: "Final Records Validation",
      details: `Validated final submission ${id} and forwarded it for dean approval.`,
    });
  }

  function rejectRecords(id: number) {
    const reason = window.prompt("Reason for records rejection");
    if (!reason?.trim()) return;

    setItems(
      updateFinalSubmission(id, {
        recordsValidation: "Rejected",
        status: "Rejected",
        remarks: reason.trim(),
      }),
    );

    addCurrentUserAuditLog({
      action: "Reject",
      module: "Final Records Validation",
      details: `Rejected final submission ${id}. Reason: ${reason.trim()}`,
    });
  }

  return (
    <main className="min-h-screen bg-white text-[#1f2a24]">
      <div className="flex min-h-screen">
        <aside className="hidden w-[260px] border-r border-[#dfe8df] bg-white px-5 py-6 lg:block">
          <h1 className="text-sm font-semibold">Project Pulse</h1>
          <p className="text-xs text-[#7b877f]">Records Staff Portal</p>

          <nav className="mt-8 space-y-2 text-sm">
            <Link
              href="/records"
              className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-[#f3f7f1]"
            >
              Dashboard
            </Link>

            <Link
              href="/records/final-approval"
              className="block rounded-lg bg-[#d7f7d8] px-3 py-2.5 font-semibold"
            >
              Final Validation
            </Link>

            <Link
              href="/records/archive"
              className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-[#f3f7f1]"
            >
              Archive
            </Link>

            <Link
              href="/records/repository"
              className="block rounded-lg px-3 py-2.5 font-semibold hover:bg-[#f3f7f1]"
            >
              Repository
            </Link>
          </nav>
        </aside>

        <section className="relative flex-1 overflow-hidden">
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[720px] bg-[radial-gradient(circle_at_50%_100%,rgba(210,255,158,0.62),rgba(207,247,236,0.52)_46%,rgba(255,255,255,0)_82%)]" />

          <div className="relative z-10 px-6 py-6 lg:px-8">
            <p className="text-[11px] font-medium text-[#7b877f]">
              Final Submission & Approval
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Final Records Validation
            </h1>

            <div className="mt-6 space-y-5">
              {items.map((item) => {
                const complete = isFinalSubmissionComplete(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <h2 className="text-lg font-semibold text-[#203028]">
                            {item.groupName}
                          </h2>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              complete
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {complete ? "Complete" : "Incomplete"}
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-[#59645d]">
                          {item.course} - {item.projectTitle}
                        </p>
                        <p className="mt-1 text-xs text-[#7b877f]">
                          Submitted by {item.submittedBy} on {item.submittedAt}
                        </p>

                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {[
                            ["Final Manuscript", item.finalManuscript],
                            ["Grammar Certificate", item.grammarCertificate],
                            ["Approval Form", item.approvalForm],
                            ["Records Clearance", item.recordsClearance],
                          ].map(([label, value]) => (
                            <div
                              key={label}
                              className="rounded-xl bg-[#f8faf7] p-4"
                            >
                              <p className="text-xs text-[#7b877f]">{label}</p>
                              <p className="mt-1 text-sm font-semibold text-[#203028]">
                                {value || "Missing"}
                              </p>
                            </div>
                          ))}
                        </div>

                        <div className="mt-5 grid gap-3 md:grid-cols-3">
                          <StatusBox
                            label="Certificate"
                            value={item.grammarianCertificateStatus}
                          />
                          <StatusBox
                            label="Records Validation"
                            value={item.recordsValidation}
                          />
                          <StatusBox
                            label="Dean Approval"
                            value={item.deanApproval}
                          />
                        </div>

                        {item.remarks && (
                          <p className="mt-4 rounded-lg bg-[#fbfdfb] p-4 text-sm text-[#59645d]">
                            {item.remarks}
                          </p>
                        )}
                      </div>

                      <div className="flex min-w-[230px] flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => verifyCertificate(item.id)}
                          className="rounded-lg border border-[#dfe8df] px-4 py-2.5 text-xs font-semibold hover:bg-[#f3f7f1]"
                        >
                          Verify Certificate
                        </button>

                        <button
                          type="button"
                          onClick={() => validateRecords(item.id)}
                          className="rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
                        >
                          Validate Records
                        </button>

                        <button
                          type="button"
                          onClick={() => rejectRecords(item.id)}
                          className="rounded-lg border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {items.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#dfe8df] bg-white p-8 text-center">
                  <p className="text-sm font-semibold text-[#203028]">
                    No final submissions yet.
                  </p>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Student final submissions will appear here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8faf7] p-4">
      <p className="text-xs text-[#7b877f]">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${statusClasses(value)}`}>
        {value}
      </p>
    </div>
  );
}
