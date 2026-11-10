"use client";

import { useState } from "react";
import { CLOSE_REASONS, type CloseReason } from "../../_lib/groups";

const fieldClass =
  "mt-2 w-full rounded-lg border border-[#dfe8df] bg-white px-3 py-2.5 text-sm text-[#203028] outline-none focus:border-[#123f2b] focus:ring-2 focus:ring-[#d7f7d8]";

// The Dean closing a group that still has members (for example one that failed and will retake). The reason is required
// and goes to the audit log; the group's history is kept and its students can then join a new group.
export default function CloseGroupDialog({
  groupName,
  busy,
  error,
  onCancel,
  onSubmit,
}: {
  groupName: string;
  busy: boolean;
  error: string;
  onCancel: () => void;
  onSubmit: (category: CloseReason, details: string) => void;
}) {
  const [category, setCategory] = useState<CloseReason | "">("");
  const [details, setDetails] = useState("");

  const valid = category !== "" && (category !== "Other" || details.trim().length >= 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div role="dialog" aria-modal="true" aria-label="Close group" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold text-[#203028]">Close {groupName}</h3>
        <p className="mt-2 text-sm text-[#59645d]">
          The group&apos;s history is kept, and its students become free to join a new group. This cannot be undone.
          The reason is saved to the audit log.
        </p>

        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          If the group has a scheduled defense, closing it cancels the defense and tells the panel. This is recorded as a
          critical entry.
        </p>

        <label className="mt-4 block text-xs font-semibold text-[#203028]">
          Reason
          <select value={category} onChange={(event) => setCategory(event.target.value as CloseReason | "")} className={fieldClass}>
            <option value="">Choose a reason</option>
            {CLOSE_REASONS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
        </label>

        <label className="mt-4 block text-xs font-semibold text-[#203028]">
          Details {category === "Other" ? "(required)" : "(optional)"}
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
            {busy ? "Closing..." : "Close group"}
          </button>
        </div>
      </div>
    </div>
  );
}
