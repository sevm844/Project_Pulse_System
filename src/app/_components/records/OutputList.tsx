"use client";

import { useState } from "react";
import { apiFetch, downloadSubmission } from "../../_lib/api";
import { outputDot, type ApiFinalOutput } from "../../_lib/finalOutputs";
import { errorMessage } from "../../_lib/groups";
import { formatDate } from "../../_lib/requirements";

// The final outputs of one group. With onReceived, ready outputs can be marked received on the spot.
export default function OutputList({
  outputs,
  onReceived,
  onError,
}: {
  outputs: ApiFinalOutput[];
  onReceived?: () => void;
  onError: (message: string) => void;
}) {
  const [busyId, setBusyId] = useState<number | null>(null);

  async function open(output: ApiFinalOutput) {
    if (!output.submission_id) return;

    try {
      await downloadSubmission(output.submission_id, output.file_name);
    } catch (err) {
      onError(errorMessage(err, "Unable to open the file."));
    }
  }

  async function receive(output: ApiFinalOutput) {
    if (!output.submission_id) return;

    setBusyId(output.submission_id);

    try {
      await apiFetch(`/submissions/${output.submission_id}/receive`, { method: "PUT" });
      onReceived?.();
    } catch (err) {
      onError(errorMessage(err, "Unable to mark it as received."));
    }

    setBusyId(null);
  }

  if (outputs.length === 0) {
    return <p className="text-xs text-[#7b877f]">No final outputs apply to this group yet.</p>;
  }

  return (
    <ul className="divide-y divide-[#edf2ec]">
      {outputs.map((output) => (
        <li key={output.requirement_id} className="flex flex-wrap items-center justify-between gap-3 py-2.5 text-xs">
          <div className="min-w-0">
            <p className="truncate font-semibold text-[#203028]">{output.title}</p>
            <p className="mt-0.5 flex items-center gap-2 text-[#7b877f]">
              <span className={`h-2 w-2 rounded-full ${outputDot[output.state]}`} />
              {output.state}
              {output.received_at ? ` · ${formatDate(output.received_at)}` : ""}
              {output.version_no && output.version_no > 1 ? ` · version ${output.version_no}` : ""}
            </p>
          </div>

          <div className="flex items-center gap-4 font-semibold">
            {output.has_file && (
              <button type="button" onClick={() => void open(output)} className="text-[#4f8f58] hover:underline">
                Open file
              </button>
            )}

            {output.link_url && (
              <a href={output.link_url} target="_blank" rel="noopener noreferrer" className="text-[#4f8f58] hover:underline">
                Open link
              </a>
            )}

            {onReceived && output.state === "Ready to receive" && (
              <button
                type="button"
                disabled={busyId === output.submission_id}
                onClick={() => void receive(output)}
                className="rounded-lg bg-[#123f2b] px-3 py-1.5 text-white hover:bg-[#0f3324] disabled:opacity-40"
              >
                Mark as received
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
