"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { errorMessage } from "../../_lib/groups";
import { fetchInterviewLetter, type InterviewLetterState } from "../../_lib/interviewLetter";
import { formatDateTime } from "../../_lib/requirements";
import { ProposalDocument } from "./ProposalView";

// A button that opens a group's letter for interview to read (never to edit): for the adviser and the Dean.
export default function LetterViewer({ groupId, groupName, className }: { groupId: number; groupName: string; className?: string }) {
  const [state, setState] = useState<InterviewLetterState | null>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");

  async function show() {
    setError("");

    try {
      setState(await fetchInterviewLetter(groupId));
      setOpen(true);
    } catch (err) {
      setError(errorMessage(err, "Unable to open the letter."));
    }
  }

  return (
    <>
      <button type="button" onClick={() => void show()} className={className ?? "rounded-lg border border-[#dfe8df] px-3 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]"}>
        View letter
      </button>
      {error && (
        <span role="alert" className="ml-2 text-xs text-[#b42318]">
          {error}
        </span>
      )}

      {open &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-3 sm:p-4">
            <div role="dialog" aria-modal="true" aria-label="Letter for interview" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
              <div className="flex items-center justify-between gap-4 border-b border-[#edf2ec] px-5 py-3">
                <div className="min-w-0">
                  <h3 className="truncate text-base font-semibold text-[#203028]">Letter for interview · {groupName}</h3>
                  {state?.given && (
                    <p className="text-xs text-[#7b877f]">
                      {state.edited_at ? `Last saved by ${state.edited_by ?? "a member"} on ${formatDateTime(state.edited_at)}` : "The group has not edited it yet."}
                    </p>
                  )}
                </div>
                <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-[#dfe8df] px-4 py-1.5 text-xs font-semibold hover:bg-[#f3f7f1]">
                  Close
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-auto bg-[#eef2ee] p-3 sm:p-5">
                <div className="mx-auto max-w-[680px] rounded bg-white px-8 py-8 shadow-sm">
                  {state?.given ? <ProposalDocument content={state.content} /> : <p className="text-sm text-[#7b877f]">This group has not been given its letter yet.</p>}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
