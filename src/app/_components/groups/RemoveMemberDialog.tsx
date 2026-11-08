"use client";

import { useState } from "react";
import { REMOVAL_REASONS, type RemovalReason } from "../../_lib/groups";

const fieldClass =
  "mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2.5 text-sm text-[#203028] outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]";

// Removing someone always needs a stated reason; it is saved to the audit log. After the Dean's endorsement the
// normal removal is blocked, so the Dean uses `exception`, which asks for written details as well.
export default function RemoveMemberDialog({
  memberName,
  groupName,
  exception = false,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  memberName: string;
  groupName: string;
  exception?: boolean;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (category: RemovalReason, details: string) => void;
}) {
  const [category, setCategory] = useState<RemovalReason | "">("");
  const [details, setDetails] = useState("");

  const needsDetails = exception || category === "Other";
  const valid = category !== "" && (!needsDetails || details.trim().length >= 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" aria-label="Remove member" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#203028]">
          {exception ? "Exception: remove" : "Remove"} {memberName}
        </h3>
        <p className="mt-2 text-sm text-[#59645d]">
          from {groupName}. The reason is required and is saved to the audit log.
        </p>

        {exception && (
          <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
            The Dean already endorsed this group&apos;s titles, so membership is normally locked. Use this only for a
            genuine emergency, such as someone dropping out mid-process. It is recorded as a critical entry.
          </p>
        )}

        <label className="mt-4 block text-xs font-semibold text-[#203028]">
          Reason
          <select value={category} onChange={(event) => setCategory(event.target.value as RemovalReason | "")} className={fieldClass}>
            <option value="">Choose a reason</option>
            {REMOVAL_REASONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-xs font-semibold text-[#203028]">
          Details {needsDetails ? "(required)" : "(optional)"}
          <textarea value={details} onChange={(event) => setDetails(event.target.value)} rows={3} maxLength={300} className={fieldClass} />
        </label>

        {error && (
          <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600">
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="rounded-full border border-[#dfe8df] px-5 py-2 text-xs font-semibold hover:bg-[#f3f7f1]">
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid || busy}
            onClick={() => category && onSubmit(category, details.trim())}
            className="rounded-full bg-[#b3261e] px-5 py-2 text-xs font-semibold text-white hover:bg-[#8f1e18] disabled:opacity-50"
          >
            {busy ? "Removing..." : "Remove member"}
          </button>
        </div>
      </div>
    </div>
  );
}
