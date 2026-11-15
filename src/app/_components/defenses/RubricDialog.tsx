"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { errorMessage } from "../../_lib/groups";
import { fetchRubric, type ApiRubricForm } from "../../_lib/rubric";
import RubricPaper from "./RubricPaper";

// One panelist's filled-in rubric, to read (never to change) and print: for the Dean and the group's adviser.
export default function RubricDialog({ defenseId, panelistId, panelistName, onClose }: { defenseId: number; panelistId: number; panelistName: string; onClose: () => void }) {
  const [form, setForm] = useState<ApiRubricForm | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetchRubric(defenseId, panelistId)
      .then(setForm)
      .catch((err) => setError(errorMessage(err, "Unable to open this rubric.")));
  }, [defenseId, panelistId]);

  async function print() {
    if (!form) return;
    setBusy(true);

    try {
      const { downloadRubricPdf } = await import("../../_lib/manuscriptExport/rubric");
      await downloadRubricPdf({
        course: form.defense.course,
        groupName: form.defense.group_name,
        members: form.defense.members ?? [],
        date: form.defense.defense_date,
        ratings: form.rubric.ratings,
        comments: form.comments ?? "",
        panelistName: form.panelist,
        signature: form.signature,
        signedDate: form.signed_at,
      });
    } catch (err) {
      setError(errorMessage(err, "The PDF could not be made. Please try again."));
    }

    setBusy(false);
  }

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-4">
      <div role="dialog" aria-modal="true" aria-label={`Rubric of ${panelistName}`} className="flex max-h-[94vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf2ec] px-5 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-base font-semibold text-[#203028]">Rubric of {panelistName}</h3>
            {form && (
              <p className="text-xs text-[#7b877f]">
                {form.rubric.total} / {form.rubric.max} · {form.recommendation}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            {form && (
              <button type="button" disabled={busy} onClick={() => void print()} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1] disabled:opacity-50">
                {busy ? "Making..." : "Print / Save as PDF"}
              </button>
            )}
            <button type="button" onClick={onClose} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
              Close
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-auto bg-[#eef2ee] p-3 sm:p-5">
          {error && (
            <p role="alert" className="mb-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}
          {!form && !error && <p className="text-sm text-[#7b877f]">Loading...</p>}
          {form && (
            <RubricPaper
              course={form.defense.course}
              groupName={form.defense.group_name}
              members={form.defense.members ?? []}
              date={form.defense.defense_date}
              ratings={form.rubric.ratings}
              comments={form.comments ?? ""}
              signature={form.signature}
              panelistName={form.panelist}
              signedDate={form.signed_at}
            />
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
