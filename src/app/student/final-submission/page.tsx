"use client";

import { useState } from "react";
import StudentShell from "../_components/StudentShell";
import { validateDocumentFile } from "../documents/_utils/fileValidation";
import {
  addFinalSubmission,
  isFinalSubmissionComplete,
  type FinalRequirementKey,
  type FinalSubmission,
} from "../../_utils/finalSubmissionStorage";
import { addCurrentUserAuditLog } from "../../_utils/auditLogStorage";

const requirements: Array<{
  key: FinalRequirementKey;
  label: string;
  detail: string;
}> = [
  {
    key: "finalManuscript",
    label: "Final Manuscript",
    detail: "Upload the approved final manuscript.",
  },
  {
    key: "approvalForm",
    label: "Adviser Approval Form",
    detail: "Upload the signed adviser approval form.",
  },
  {
    key: "recordsClearance",
    label: "Records Clearance",
    detail: "Upload the records clearance or final requirement form.",
  },
];

export default function StudentFinalSubmissionPage() {
  const [files, setFiles] = useState<Record<FinalRequirementKey, string>>({
    finalManuscript: "",
    grammarCertificate: "",
    approvalForm: "",
    recordsClearance: "",
  });
  const [fileErrors, setFileErrors] = useState<
    Partial<Record<FinalRequirementKey, string>>
  >({});
  const [submitted, setSubmitted] = useState<FinalSubmission | null>(null);

  const previewSubmission: FinalSubmission = {
    id: 0,
    groupName: "Project Pulse",
    course: "BSIT 4A",
    projectTitle: "Smart Capstone Monitoring System",
    submittedBy: "Student Name",
    submittedAt: "",
    finalManuscript: files.finalManuscript,
    grammarCertificate: "",
    approvalForm: files.approvalForm,
    recordsClearance: files.recordsClearance,
    grammarianCertificateStatus: "Pending",
    grammarReviewStatus: "Not Routed",
    recordsValidation: "Pending",
    deanApproval: "Pending",
    status: "Draft",
    remarks: "",
  };

  const isComplete = isFinalSubmissionComplete(previewSubmission);

  function handleFileChange(key: FinalRequirementKey, file?: File) {
    const validationError = validateDocumentFile(file);

    if (validationError) {
      setFiles((current) => ({ ...current, [key]: "" }));
      setFileErrors((current) => ({ ...current, [key]: validationError }));
      return;
    }

    setFiles((current) => ({ ...current, [key]: file?.name || "" }));
    setFileErrors((current) => ({ ...current, [key]: "" }));
  }

  function submitFinalRequirements() {
    if (!isComplete) {
      addCurrentUserAuditLog({
        action: "Submit",
        module: "Final Submission",
        details: "Attempted final submission with incomplete requirements.",
      });

      setSubmitted({
        ...previewSubmission,
        status: "Incomplete",
        remarks: "Complete all final requirements before submission.",
      });
      return;
    }

    const nextSubmission = addFinalSubmission({
      ...previewSubmission,
      status: "For Records Validation",
      remarks: "Submitted for records staff validation.",
    });

    addCurrentUserAuditLog({
      action: "Submit",
      module: "Final Submission",
      details: "Submitted complete final requirements for records validation.",
    });

    setSubmitted(nextSubmission);
  }

  return (
    <StudentShell title="Final Submission">
      <div className="space-y-5">
        <section className="rounded-lg border border-[#dfe8df] bg-white p-5">
          <p className="text-sm font-semibold text-[#4f8f58]">
            Final Submission & Approval
          </p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#203028]">
            Submit Final Requirements
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            Upload the final manuscript package for dean review. The grammar
            certificate is generated later after the Dean routes the manuscript
            to a grammarian.
          </p>
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.4fr_0.8fr]">
          <section className="rounded-lg border border-[#dfe8df] bg-white p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Required Manuscript Package
            </h3>

            <div className="mt-5 space-y-4">
              {requirements.map((requirement) => (
                <div
                  key={requirement.key}
                  className="rounded-lg border border-[#edf2ec] bg-[#fbfdfb] p-4"
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[#203028]">
                        {requirement.label}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {requirement.detail}
                      </p>

                      {files[requirement.key] && (
                        <p className="mt-2 text-xs font-semibold text-[#4f8f58]">
                          Uploaded: {files[requirement.key]}
                        </p>
                      )}

                      {fileErrors[requirement.key] && (
                        <p className="mt-2 text-xs font-semibold text-red-600">
                          {fileErrors[requirement.key]}
                        </p>
                      )}
                    </div>

                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(event) =>
                        handleFileChange(
                          requirement.key,
                          event.target.files?.[0],
                        )
                      }
                      className="max-w-full text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-lg border border-[#dfe8df] bg-white p-5">
            <h3 className="text-base font-semibold text-[#203028]">
              Submission Status
            </h3>

            <div className="mt-5 space-y-3">
              {requirements.map((requirement) => {
                const complete = Boolean(files[requirement.key]);

                return (
                  <div
                    key={requirement.key}
                    className="flex items-center justify-between rounded-lg bg-[#f8faf7] px-4 py-3"
                  >
                    <span className="text-xs font-semibold text-[#203028]">
                      {requirement.label}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                        complete
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-700"
                      }`}
                    >
                      {complete ? "Complete" : "Missing"}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              type="button"
              onClick={submitFinalRequirements}
              className="mt-6 w-full rounded-lg bg-[#202823] px-4 py-3 text-sm font-semibold text-white hover:bg-[#303a33]"
            >
              Submit Final Requirements
            </button>

            {submitted && (
              <div
                className={`mt-5 rounded-lg p-4 text-sm ${
                  submitted.status === "Incomplete"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-emerald-50 text-emerald-700"
                }`}
              >
                <p className="font-semibold">{submitted.status}</p>
                <p className="mt-1 text-xs leading-5">{submitted.remarks}</p>
              </div>
            )}
          </aside>
        </div>
      </div>
    </StudentShell>
  );
}
