"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "../_components/AdminShell";

type DeanStatus = "Active" | "On Leave" | "Inactive";

type DeanOfficeProfile = {
  deanName: string;
  email: string;
  department: string;
  office: string;
  academicTerm: string;
  status: DeanStatus;
  backupContact: string;
  backupRole: string;
};

type DeanOfficeDraft = DeanOfficeProfile;

const DEAN_OFFICE_STORAGE_KEY = "project-pulse-admin-dean-office";

const defaultDeanOffice: DeanOfficeProfile = {
  deanName: "Dean Office",
  email: "dean.office@ub.edu.ph",
  department: "College of Information Technology",
  office: "Dean's Office",
  academicTerm: "2025-2026 / 2nd Semester",
  status: "Active",
  backupContact: "Program Coordinator",
  backupRole: "Coordinator",
};

const executiveModules = [
  "Projects Monitoring",
  "Defense Outcomes",
  "Final Approvals",
  "Reports",
  "Feedback Queue",
];

const approvalResponsibilities = [
  "Final output approval",
  "Defense outcome oversight",
  "At-risk project escalation",
  "Program-level reports review",
  "Final requirement readiness monitoring",
];

const currentQueue = [
  ["Pending Final Approvals", "2", "Awaiting dean action"],
  ["Pending Defense Outcomes", "3", "Need outcome review"],
  ["Feedback Queue", "5", "Open feedback items"],
  ["At-risk Projects", "1", "Needs executive attention"],
];

function canUseStorage() {
  return typeof window !== "undefined" && Boolean(window.localStorage);
}

function getStoredDeanOffice() {
  if (!canUseStorage()) return defaultDeanOffice;

  const saved = window.localStorage.getItem(DEAN_OFFICE_STORAGE_KEY);

  if (!saved) {
    window.localStorage.setItem(
      DEAN_OFFICE_STORAGE_KEY,
      JSON.stringify(defaultDeanOffice),
    );

    return defaultDeanOffice;
  }

  return JSON.parse(saved) as DeanOfficeProfile;
}

function saveStoredDeanOffice(profile: DeanOfficeProfile) {
  if (!canUseStorage()) return;

  window.localStorage.setItem(
    DEAN_OFFICE_STORAGE_KEY,
    JSON.stringify(profile),
  );
}

function statusClasses(status: DeanStatus) {
  if (status === "Active") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "On Leave") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-rose-200 bg-rose-50 text-rose-700";
}

export default function AdminDeanOfficePage() {
  const [profile, setProfile] = useState<DeanOfficeProfile>(defaultDeanOffice);
  const [draft, setDraft] = useState<DeanOfficeDraft>(defaultDeanOffice);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const storedProfile = getStoredDeanOffice();
    setProfile(storedProfile);
    setDraft(storedProfile);
  }, []);

  const activeAccessCount = useMemo(() => executiveModules.length, []);

  function updateDraft(field: keyof DeanOfficeDraft, value: string) {
    setDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function startEdit() {
    setDraft(profile);
    setEditing(true);
  }

  function cancelEdit() {
    setDraft(profile);
    setEditing(false);
  }

  function saveProfile() {
    const nextProfile: DeanOfficeProfile = {
      ...draft,
      deanName: draft.deanName.trim() || "Dean Office",
      email: draft.email.trim() || "dean.office@ub.edu.ph",
      department: draft.department.trim() || "College of Information Technology",
      office: draft.office.trim() || "Dean's Office",
      academicTerm: draft.academicTerm.trim() || "2025-2026 / 2nd Semester",
      backupContact: draft.backupContact.trim() || "Program Coordinator",
      backupRole: draft.backupRole.trim() || "Coordinator",
    };

    setProfile(nextProfile);
    saveStoredDeanOffice(nextProfile);
    setEditing(false);
  }

  return (
    <AdminShell title="Dean Office">
      <div className="space-y-5">
        <section className="overflow-x-auto rounded-2xl border border-[#dfe8df] bg-white p-4 shadow-sm">
          <div className="flex min-w-[820px] divide-x divide-[#edf2ec]">
            {[
              ["Dean Status", profile.status, "Executive account"],
              ["Access Modules", activeAccessCount, "Enabled modules"],
              ["Current Term", profile.academicTerm, "Active setup"],
              ["Backup Route", profile.backupRole, "If unavailable"],
            ].map(([label, value, caption]) => (
              <div key={label} className="flex-1 px-4 py-2">
                <p className="text-[11px] font-semibold text-[#7b877f]">
                  {label}
                </p>
                <div className="mt-1 flex items-end gap-2 whitespace-nowrap">
                  <p className="text-xl font-semibold leading-none text-[#203028]">
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

        <section className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-2xl font-semibold text-[#203028]">
                  {profile.deanName}
                </h2>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${statusClasses(
                    profile.status,
                  )}`}
                >
                  {profile.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-[#59645d]">
                {profile.department} • {profile.office}
              </p>
              <p className="mt-1 text-xs text-[#7b877f]">{profile.email}</p>
            </div>

            <button
              type="button"
              onClick={startEdit}
              className="rounded-lg bg-[#202823] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#303a33]"
            >
              Edit Dean Office
            </button>
          </div>

          {editing && (
            <div className="mt-5 rounded-xl border border-[#bfe9c5] bg-[#f7fff8] p-4">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-[#203028]">
                    Edit Dean Office Profile
                  </h3>
                  <p className="mt-1 text-xs text-[#7b877f]">
                    Admin controls only account and routing details. Dean
                    decisions stay inside the dean portal.
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
                    onClick={saveProfile}
                    className="rounded-lg bg-[#202823] px-4 py-2 text-xs font-semibold text-white hover:bg-[#303a33]"
                  >
                    Save Changes
                  </button>
                </div>
              </div>

              <div className="mt-4 grid gap-3 lg:grid-cols-3">
                <TextField
                  label="Dean Display Name"
                  value={draft.deanName}
                  onChange={(value) => updateDraft("deanName", value)}
                />
                <TextField
                  label="Email"
                  value={draft.email}
                  onChange={(value) => updateDraft("email", value)}
                />
                <TextField
                  label="Department"
                  value={draft.department}
                  onChange={(value) => updateDraft("department", value)}
                />
                <TextField
                  label="Office"
                  value={draft.office}
                  onChange={(value) => updateDraft("office", value)}
                />
                <TextField
                  label="Academic Term"
                  value={draft.academicTerm}
                  onChange={(value) => updateDraft("academicTerm", value)}
                />

                <label className="block text-xs font-semibold text-[#59645d]">
                  Status
                  <select
                    value={draft.status}
                    onChange={(event) =>
                      updateDraft("status", event.target.value)
                    }
                    className="mt-2 h-10 w-full rounded-xl border border-[#dfe8df] bg-white px-3 text-sm text-[#203028] outline-none focus:ring-2 focus:ring-[#d7f7d8]"
                  >
                    <option>Active</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </label>
                <TextField
                  label="Backup Contact"
                  value={draft.backupContact}
                  onChange={(value) => updateDraft("backupContact", value)}
                />
                <TextField
                  label="Backup Role"
                  value={draft.backupRole}
                  onChange={(value) => updateDraft("backupRole", value)}
                />
              </div>
            </div>
          )}
        </section>

        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#203028]">
              Executive Access
            </h3>
            <p className="mt-1 text-sm text-[#7b877f]">
              Dean account has access to executive monitoring and approval
              modules.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {executiveModules.map((module) => (
                <div
                  key={module}
                  className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-semibold text-[#203028]">
                      {module}
                    </p>
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700">
                      Enabled
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
            <h3 className="text-lg font-semibold text-[#203028]">
              Current Queue
            </h3>
            <p className="mt-1 text-sm text-[#7b877f]">
              Read-only snapshot of dean workload.
            </p>

            <div className="mt-5 space-y-3">
              {currentQueue.map(([label, value, caption]) => (
                <div
                  key={label}
                  className="rounded-xl border border-[#edf2ec] bg-[#fbfdfb] p-4"
                >
                  <div className="flex items-end justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-[#7b877f]">
                        {label}
                      </p>
                      <p className="mt-1 text-xs text-[#59645d]">{caption}</p>
                    </div>
                    <p className="text-2xl font-semibold text-[#203028]">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-[#dfe8df] bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-[#203028]">
            Approval Responsibilities
          </h3>
          <p className="mt-1 text-sm text-[#7b877f]">
            Responsibilities are shown for clarity. The dean performs these
            actions inside the dean portal.
          </p>

          <div className="mt-5 flex flex-wrap gap-2">
            {approvalResponsibilities.map((item) => (
              <span
                key={item}
                className="rounded-full border border-[#dfe8df] bg-[#fbfdfb] px-3 py-1.5 text-xs font-semibold text-[#59645d]"
              >
                {item}
              </span>
            ))}
          </div>
        </section>
      </div>
    </AdminShell>
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
