"use client";

import { useEffect, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import {
  getStoredFinalSubmissions,
  isFinalSubmissionComplete,
  updateFinalSubmission,
  type FinalSubmission,
} from "../../_utils/finalSubmissionStorage";
import { addCurrentUserAuditLog } from "../../_utils/auditLogStorage";

function statusClasses(status: string) {
  if (status === "Approved") return "bg-emerald-50 text-emerald-700";
  if (status === "Rejected") return "bg-rose-50 text-rose-700";
  if (status === "For Dean Approval") return "bg-blue-50 text-blue-700";
  return "bg-amber-50 text-amber-700";
}

export default function DeanFinalApprovalPage() {
  const [items, setItems] = useState<FinalSubmission[]>([]);

  useEffect(() => {
    setItems(getStoredFinalSubmissions());
  }, []);

  function approveSubmission(id: number) {
    setItems(
      updateFinalSubmission(id, {
        deanApproval: "Approved",
        status: "Approved",
        remarks: "Approved by dean for final completion.",
      }),
    );

    addCurrentUserAuditLog({
      action: "Approve",
      module: "Dean Final Approval",
      details: `Dean approved final submission ${id}.`,
    });
  }

  function rejectSubmission(id: number) {
    const reason = window.prompt("Reason for rejection");
    if (!reason?.trim()) return;

    setItems(
      updateFinalSubmission(id, {
        deanApproval: "Rejected",
        status: "Rejected",
        remarks: reason.trim(),
      }),
    );

    addCurrentUserAuditLog({
      action: "Reject",
      module: "Dean Final Approval",
      details: `Dean rejected final submission ${id}. Reason: ${reason.trim()}`,
    });
  }

  return (
    <DeanShell title="Final Approval">
      <div className="space-y-5">
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-[#203028]">
            Final Submission Approval
          </h2>
          <p className="mt-1 text-sm text-[#7b877f]">
            Review records-validated final requirements and approve final
            completion.
          </p>
        </Card>

        {items.map((item) => {
          const complete = isFinalSubmissionComplete(item);
          const canApprove =
            complete &&
            item.recordsValidation === "Validated" &&
            item.grammarianCertificateStatus === "Verified";

          return (
            <Card key={item.id} className="p-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-lg font-semibold text-[#203028]">
                      {item.groupName}
                    </h3>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(
                        item.status,
                      )}`}
                    >
                      {item.status}
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
                      <div key={label} className="rounded-xl bg-[#f8faf7] p-4">
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
                    <StatusBox label="Dean Approval" value={item.deanApproval} />
                  </div>

                  {item.remarks && (
                    <p className="mt-4 rounded-lg bg-[#fbfdfb] p-4 text-sm text-[#59645d]">
                      {item.remarks}
                    </p>
                  )}
                </div>

                <div className="flex min-w-[220px] flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => approveSubmission(item.id)}
                    disabled={!canApprove}
                    className="rounded-lg bg-[#123f2b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#0f3324] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Dean Approve
                  </button>

                  <button
                    type="button"
                    onClick={() => rejectSubmission(item.id)}
                    className="rounded-lg border border-rose-200 px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                  >
                    Reject
                  </button>

                  {!canApprove && (
                    <p className="text-xs leading-5 text-[#7b877f]">
                      Requires complete files, verified certificate, and records
                      validation before dean approval.
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}

        {items.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-sm font-semibold text-[#203028]">
              No final submissions yet.
            </p>
            <p className="mt-1 text-xs text-[#7b877f]">
              Records-validated submissions will appear here.
            </p>
          </Card>
        )}
      </div>
    </DeanShell>
  );
}

function StatusBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[#f8faf7] p-4">
      <p className="text-xs text-[#7b877f]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#203028]">{value}</p>
    </div>
  );
}
