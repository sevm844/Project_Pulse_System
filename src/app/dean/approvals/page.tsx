"use client";

import { useEffect, useMemo, useState } from "react";
import DeanShell from "../_components/DeanShell";
import Card from "../_components/Card";
import {
  getStoredFinalSubmissions,
  isFinalSubmissionComplete,
  updateFinalSubmission,
  type FinalSubmission,
} from "../../_utils/finalSubmissionStorage";
import { addCurrentUserAuditLog } from "../../_utils/auditLogStorage";

type CourseFilter = "All" | "BSIT" | "BSIS" | "BSCS" | "BLIS" | "ACT";
type StatusFilter =
  | "All"
  | "For Records Validation"
  | "For Dean Approval"
  | "Approved"
  | "Rejected";
type RequirementFilter = "All" | "Ready" | "Needs Action";

const courseOptions: CourseFilter[] = [
  "All",
  "BSIT",
  "BSIS",
  "BSCS",
  "BLIS",
  "ACT",
];

function statusClasses(status: string) {
  if (status === "Approved") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "Rejected") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (status === "For Dean Approval") {
    return "border-blue-200 bg-blue-50 text-blue-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function chipClasses(value: string) {
  const normalized = value.toLowerCase();

  if (
    normalized.includes("approved") ||
    normalized.includes("uploaded") ||
    normalized.includes("verified") ||
    normalized.includes("validated") ||
    normalized.includes("complete") ||
    normalized === "ready" ||
    normalized === "yes"
  ) {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (
    normalized.includes("rejected") ||
    normalized.includes("missing") ||
    normalized.includes("incomplete") ||
    normalized === "no"
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  return "border-amber-200 bg-amber-50 text-amber-700";
}

function getCourseValue(course: string) {
  return course.split(" ")[0].trim().toUpperCase();
}

function canDeanApprove(item: FinalSubmission) {
  return (
    isFinalSubmissionComplete(item) &&
    item.recordsValidation === "Validated" &&
    item.grammarianCertificateStatus === "Verified"
  );
}

function getCompletionCount(item: FinalSubmission) {
  return [
    item.finalManuscript,
    item.grammarCertificate,
    item.approvalForm,
    item.recordsClearance,
  ].filter(Boolean).length;
}

function getMissingItems(item: FinalSubmission) {
  const missing = [];

  if (!item.finalManuscript) missing.push("Final manuscript");
  if (!item.grammarCertificate) missing.push("Grammar certificate");
  if (!item.approvalForm) missing.push("Approval form");
  if (!item.recordsClearance) missing.push("Records clearance");
  if (item.grammarianCertificateStatus !== "Verified") {
    missing.push("Verified grammar certificate");
  }
  if (item.recordsValidation !== "Validated") {
    missing.push("Records validation");
  }

  return missing;
}

type EditableSubmission = Omit<FinalSubmission, "id">;

function createEditDraft(item: FinalSubmission): EditableSubmission {
  return {
    groupName: item.groupName,
    projectTitle: item.projectTitle,
    course: item.course,
    submittedBy: item.submittedBy,
    submittedAt: item.submittedAt,
    finalManuscript: item.finalManuscript || "",
    grammarCertificate: item.grammarCertificate || "",
    approvalForm: item.approvalForm || "",
    recordsClearance: item.recordsClearance || "",
    grammarianCertificateStatus: item.grammarianCertificateStatus,
    recordsValidation: item.recordsValidation,
    deanApproval: item.deanApproval,
    status: item.status,
    remarks: item.remarks || "",
  };
}

export default function DeanFinalApprovalPage() {
  const [items, setItems] = useState<FinalSubmission[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState<CourseFilter>("All");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("All");
  const [requirementFilter, setRequirementFilter] =
    useState<RequirementFilter>("All");
  const [openItemId, setOpenItemId] = useState<number | null>(null);
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<EditableSubmission | null>(null);

  useEffect(() => {
    setItems(getStoredFinalSubmissions());
  }, []);

  const filteredItems = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return items.filter((item) => {
      const searchable = [
        item.groupName,
        item.projectTitle,
        item.course,
        item.submittedBy,
        item.status,
        item.recordsValidation,
        item.grammarianCertificateStatus,
        item.deanApproval,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = !query || searchable.includes(query);
      const matchesCourse =
        courseFilter === "All" || getCourseValue(item.course) === courseFilter;
      const matchesStatus =
        statusFilter === "All" || item.status === statusFilter;
      const matchesRequirement =
        requirementFilter === "All" ||
        (requirementFilter === "Ready" && canDeanApprove(item)) ||
        (requirementFilter === "Needs Action" && !canDeanApprove(item));

      return (
        matchesSearch &&
        matchesCourse &&
        matchesStatus &&
        matchesRequirement
      );
    });
  }, [courseFilter, items, requirementFilter, searchQuery, statusFilter]);

  const totalItems = items.length;
  const readyItems = items.filter(canDeanApprove).length;
  const pendingItems = items.filter(
    (item) =>
      item.status === "For Records Validation" ||
      item.status === "For Dean Approval",
  ).length;
  const approvedItems = items.filter(
    (item) => item.status === "Approved",
  ).length;
  const returnedItems = items.filter(
    (item) => item.status === "Rejected",
  ).length;

  function resetFilters() {
    setSearchQuery("");
    setCourseFilter("All");
    setStatusFilter("All");
    setRequirementFilter("All");
  }

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
    const reason = window.prompt("Reason for return or rejection");
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

  function startEdit(item: FinalSubmission) {
    setOpenItemId(item.id);
    setEditingItemId(item.id);
    setEditDraft(createEditDraft(item));
  }

  function cancelEdit() {
    setEditingItemId(null);
    setEditDraft(null);
  }

  function updateDraft(field: keyof EditableSubmission, value: string) {
    setEditDraft((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
  }

  function saveEdit(id: number) {
    if (!editDraft) return;

    setItems(
      updateFinalSubmission(id, {
        groupName: editDraft.groupName,
        projectTitle: editDraft.projectTitle,
        course: editDraft.course,
        submittedBy: editDraft.submittedBy,
        submittedAt: editDraft.submittedAt,
        finalManuscript: editDraft.finalManuscript,
        grammarCertificate: editDraft.grammarCertificate,
        approvalForm: editDraft.approvalForm,
        recordsClearance: editDraft.recordsClearance,
        grammarianCertificateStatus: editDraft.grammarianCertificateStatus,
        recordsValidation: editDraft.recordsValidation,
        deanApproval: editDraft.deanApproval,
        status: editDraft.status,
        remarks: editDraft.remarks,
      }),
    );

    addCurrentUserAuditLog({
      action: "Update",
      module: "Dean Final Approval",
      details: `Dean updated final submission ${id}.`,
    });

    cancelEdit();
  }

  return (
    <DeanShell title="Final Approvals">
      <div className="space-y-5">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-[#203028]">
            Final Approval Queue
          </h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-[#59645d]">
            Review final files, validation status, and dean approval in a compact
            approval board.
          </p>
        </div>

        <Card className="overflow-hidden !border-[#bfe8b9] !bg-[#f7fff4] p-0 shadow-[0_10px_28px_rgba(32,48,40,0.08)]">
          <div className="overflow-x-auto rounded-2xl bg-[linear-gradient(90deg,#ffffff_0%,#f2fdeb_48%,#e4f8d8_100%)] p-4">
            <div className="flex min-w-[920px] divide-x divide-[#cfe8c8]">
              {[
                ["Total", totalItems, "Submissions"],
                ["Ready", readyItems, "Can approve"],
                ["Pending", pendingItems, "Needs action"],
                ["Approved", approvedItems, "Completed"],
                ["Returned", returnedItems, "Revision"],
              ].map(([label, value, caption]) => (
                <div key={label} className="flex-1 px-4 py-2">
                  <p className="text-[11px] font-semibold text-[#2f6f3a]">
                    {label}
                  </p>

                  <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                    <p className="text-2xl font-semibold leading-none text-[#0f1f16]">
                      {value}
                    </p>
                    <p className="pb-0.5 text-[10px] leading-4 text-[#59645d]">
                      {caption}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className="overflow-x-auto p-3">
  <div className="flex min-w-[1180px] items-end gap-3">
    <label className="w-[420px] shrink-0 text-xs font-semibold text-[#59645d]">
      Search
      <input
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.target.value)}
        placeholder="Search group, project, course..."
        className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      />
    </label>

    <label className="w-[170px] shrink-0 text-xs font-semibold text-[#59645d]">
      Course
      <select
        value={courseFilter}
        onChange={(event) =>
          setCourseFilter(event.target.value as CourseFilter)
        }
        className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      >
        {courseOptions.map((course) => (
          <option key={course}>{course}</option>
        ))}
      </select>
    </label>

    <label className="w-[240px] shrink-0 text-xs font-semibold text-[#59645d]">
      Status
      <select
        value={statusFilter}
        onChange={(event) =>
          setStatusFilter(event.target.value as StatusFilter)
        }
        className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      >
        <option>All</option>
        <option>For Records Validation</option>
        <option>For Dean Approval</option>
        <option>Approved</option>
        <option>Rejected</option>
      </select>
    </label>

    <label className="w-[190px] shrink-0 text-xs font-semibold text-[#59645d]">
      Requirement
      <select
        value={requirementFilter}
        onChange={(event) =>
          setRequirementFilter(event.target.value as RequirementFilter)
        }
        className="mt-1.5 h-10 w-full rounded-lg border border-[#dfe8df] bg-[#fbfdfb] px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      >
        <option>All</option>
        <option>Ready</option>
        <option>Needs Action</option>
      </select>
    </label>

    <button
      type="button"
      onClick={resetFilters}
      className="h-10 w-[150px] shrink-0 rounded-lg border border-[#dfe8df] px-4 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
    >
      Reset Filters
    </button>
  </div>
</Card>


        <Card className="overflow-hidden">
          <div className="border-b border-[#edf2ec] px-5 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-[#203028]">
                  Final Approval Board
                </h2>
                <p className="text-xs text-[#7b877f]">
                  {filteredItems.length} submission
                  {filteredItems.length === 1 ? "" : "s"} found
                </p>
              </div>
              <p className="text-xs text-[#7b877f]">
                Open a group to review details or use Edit to update approval
                records.
              </p>
            </div>
          </div>

          <div className="divide-y divide-[#edf2ec]">
            {filteredItems.map((item) => {
              const approveReady = canDeanApprove(item);
              const open = openItemId === item.id;
              const editing = editingItemId === item.id;
              const missingItems = getMissingItems(item);

              return (
                <div key={item.id} className="px-5 py-4">
                  <div className="grid gap-4 xl:grid-cols-[1.15fr_1.8fr_auto] xl:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-[#203028]">
                          {item.groupName}
                        </h3>
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                            item.status,
                          )}`}
                        >
                          {item.status}
                        </span>
                      </div>

                      <p className="mt-1 text-sm text-[#59645d]">
                        {item.projectTitle}
                      </p>
                      <p className="mt-1 text-xs text-[#7b877f]">
                        {item.course} • {item.submittedBy} • {item.submittedAt}
                      </p>
                    </div>

                    <div className="grid gap-2 md:grid-cols-4">
                      <InlineStatus
                        label="Files"
                        value={`${getCompletionCount(item)}/4`}
                      />
                      <InlineStatus
                        label="Grammar"
                        value={item.grammarianCertificateStatus}
                      />
                      <InlineStatus
                        label="Records"
                        value={item.recordsValidation}
                      />
                      <InlineStatus
                        label="Ready"
                        value={approveReady ? "Yes" : "No"}
                      />
                    </div>

                    <div className="flex flex-wrap gap-2 xl:justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenItemId((current) =>
                            current === item.id ? null : item.id,
                          )
                        }
                        className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                      >
                        {open ? "Close" : "Open"}
                      </button>

                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-[#dfe8df] px-4 py-2 text-xs font-semibold text-[#203028] hover:bg-[#f3f7f1]"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() => approveSubmission(item.id)}
                        disabled={!approveReady}
                        className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33] disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Approve
                      </button>

                      <button
                        type="button"
                        onClick={() => rejectSubmission(item.id)}
                        className="rounded-lg border border-rose-200 px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"
                      >
                        Return
                      </button>
                    </div>
                  </div>

                  {open && !editing && (
                    <div className="mt-4 rounded-xl border border-[#dfe8df] bg-[#fbfdfb] p-4">
                      <div className="grid gap-3 lg:grid-cols-4">
                        <DetailBox
                          label="Final Manuscript"
                          value={item.finalManuscript || "Missing"}
                        />
                        <DetailBox
                          label="Grammar Certificate"
                          value={item.grammarCertificate || "Missing"}
                        />
                        <DetailBox
                          label="Approval Form"
                          value={item.approvalForm || "Missing"}
                        />
                        <DetailBox
                          label="Records Clearance"
                          value={item.recordsClearance || "Missing"}
                        />
                      </div>

                      <div className="mt-3 grid gap-3 lg:grid-cols-4">
                        <DetailBox
                          label="Certificate Status"
                          value={item.grammarianCertificateStatus}
                        />
                        <DetailBox
                          label="Records Validation"
                          value={item.recordsValidation}
                        />
                        <DetailBox
                          label="Dean Approval"
                          value={item.deanApproval}
                        />
                        <DetailBox
                          label="Approval Readiness"
                          value={approveReady ? "Ready" : "Needs Action"}
                        />
                      </div>

                      {missingItems.length > 0 ? (
                        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                          <p className="text-xs font-semibold text-amber-700">
                            Missing or pending before approval
                          </p>
                          <p className="mt-1 text-xs leading-5 text-amber-700">
                            {missingItems.join(", ")}
                          </p>
                        </div>
                      ) : (
                        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                          <p className="text-xs font-semibold text-emerald-700">
                            This final submission is complete and ready for dean
                            approval.
                          </p>
                        </div>
                      )}

                      {item.remarks && (
                        <div className="mt-4 rounded-lg bg-white p-3">
                          <p className="text-xs font-semibold text-[#7b877f]">
                            Remarks
                          </p>
                          <p className="mt-1 text-sm leading-6 text-[#59645d]">
                            {item.remarks}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {editing && editDraft && (
                    <div className="mt-4 rounded-xl border border-[#bfe9c5] bg-[#f7fff8] p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <h3 className="text-sm font-semibold text-[#203028]">
                            Edit Final Approval Details
                          </h3>
                          <p className="mt-1 text-xs text-[#7b877f]">
                            Update group details, file records, validation, and
                            approval status.
                          </p>
                        </div>

                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="rounded-lg border border-[#dfe8df] bg-white px-4 py-2 text-xs font-semibold hover:bg-[#f3f7f1]"
                          >
                            Cancel
                          </button>

                          <button
                            type="button"
                            onClick={() => saveEdit(item.id)}
                            className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                          >
                            Save Changes
                          </button>
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <TextField
                          label="Group Name"
                          value={editDraft.groupName}
                          onChange={(value) => updateDraft("groupName", value)}
                        />
                        <TextField
                          label="Project Title"
                          value={editDraft.projectTitle}
                          onChange={(value) =>
                            updateDraft("projectTitle", value)
                          }
                        />
                        <TextField
                          label="Course"
                          value={editDraft.course}
                          onChange={(value) => updateDraft("course", value)}
                        />
                        <TextField
                          label="Submitted By"
                          value={editDraft.submittedBy}
                          onChange={(value) =>
                            updateDraft("submittedBy", value)
                          }
                        />
                        <TextField
                          label="Submitted Date"
                          value={editDraft.submittedAt}
                          onChange={(value) =>
                            updateDraft("submittedAt", value)
                          }
                        />
                        <SelectField
                          label="Status"
                          value={editDraft.status}
                          options={[
                            "For Records Validation",
                            "For Dean Approval",
                            "Approved",
                            "Rejected",
                          ]}
                          onChange={(value) => updateDraft("status", value)}
                        />
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-4">
                        <TextField
                          label="Final Manuscript"
                          value={editDraft.finalManuscript}
                          onChange={(value) =>
                            updateDraft("finalManuscript", value)
                          }
                        />
                        <TextField
                          label="Grammar Certificate"
                          value={editDraft.grammarCertificate}
                          onChange={(value) =>
                            updateDraft("grammarCertificate", value)
                          }
                        />
                        <TextField
                          label="Approval Form"
                          value={editDraft.approvalForm}
                          onChange={(value) =>
                            updateDraft("approvalForm", value)
                          }
                        />
                        <TextField
                          label="Records Clearance"
                          value={editDraft.recordsClearance}
                          onChange={(value) =>
                            updateDraft("recordsClearance", value)
                          }
                        />
                      </div>

                      <div className="mt-4 grid gap-3 lg:grid-cols-3">
                        <SelectField
                          label="Grammar Certificate Status"
                          value={editDraft.grammarianCertificateStatus}
                          options={["Pending", "Verified", "Rejected"]}
                          onChange={(value) =>
                            updateDraft(
                              "grammarianCertificateStatus",
                              value,
                            )
                          }
                        />
                        <SelectField
                          label="Records Validation"
                          value={editDraft.recordsValidation}
                          options={["Pending", "Validated", "Rejected"]}
                          onChange={(value) =>
                            updateDraft("recordsValidation", value)
                          }
                        />
                        <SelectField
                          label="Dean Approval"
                          value={editDraft.deanApproval}
                          options={["Pending", "Approved", "Rejected"]}
                          onChange={(value) =>
                            updateDraft("deanApproval", value)
                          }
                        />
                      </div>

                      <label className="mt-4 block text-xs font-semibold text-[#59645d]">
                        Remarks
                        <textarea
                          value={editDraft.remarks}
                          onChange={(event) =>
                            updateDraft("remarks", event.target.value)
                          }
                          className="mt-2 min-h-24 w-full resize-none rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                        />
                      </label>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredItems.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-sm font-semibold text-[#203028]">
                  No final submissions found.
                </p>
                <p className="mt-1 text-xs text-[#7b877f]">
                  Try changing the search, course, status, or requirement
                  filters.
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DeanShell>
  );
}

function InlineStatus({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[#edf2ec] bg-[#f8faf7] px-3 py-2">
      <p className="text-[10px] font-semibold text-[#7b877f]">{label}</p>
      <p
        className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${chipClasses(
          value,
        )}`}
      >
        {value}
      </p>
    </div>
  );
}

function DetailBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-white p-3">
      <p className="text-[11px] font-semibold text-[#7b877f]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#203028]">
        {value}
      </p>
    </div>
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
        className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      />
    </label>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block text-xs font-semibold text-[#59645d]">
      {label}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-[#dfe8df] bg-white px-3 py-2.5 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
      >
        {options.map((option) => (
          <option key={option}>{option}</option>
        ))}
      </select>
    </label>
  );
}
